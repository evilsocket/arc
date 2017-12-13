/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"compress/gzip"
	"fmt"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io"
	"os"
	"path/filepath"
	"time"
)

type Record struct {
	path     string
	meta     *Meta
	children Index
}

func CreateRecord(root_path string, meta Meta, reader *io.Reader) (record *Record, err error) {
	log.Debugf("Creating record %d:'%s' on '%s' with reader %v...", meta.Id, meta.Title, root_path, reader)

	if root_path, err = utils.ExpandPath(root_path); err != nil {
		return nil, err
	}

	record_path := filepath.Join(root_path, fmt.Sprintf("%d", meta.Id))
	meta_path := filepath.Join(record_path, "meta.json")

	if utils.Exists(record_path) == false {
		log.Debugf("Creating record path '%s' ...", record_path)
		if err = os.MkdirAll(record_path, os.ModePerm); err != nil {
			return nil, err
		}
	}

	m, err := CreateMeta(meta_path, meta)
	if err != nil {
		return nil, err
	}

	i, err := LoadIndex(record_path)
	if err != nil {
		return nil, err
	}

	record = &Record{
		path:     record_path,
		meta:     m,
		children: i,
	}

	if reader != nil {
		err = record.UpdateBuffer(*reader)
		if err != nil {
			return nil, err
		}
	}

	return record, nil
}

func OpenRecord(path string) (record *Record, err error) {
	log.Debugf("Opening record from path '%s' ...", path)

	if path, err = utils.ExpandPath(path); err != nil {
		return nil, err
	}

	meta_path := filepath.Join(path, "meta.json")
	meta, err := OpenMeta(meta_path)
	if err != nil {
		return nil, err
	}

	i, err := LoadIndex(path)
	if err != nil {
		return nil, err
	}

	record = &Record{
		path:     path,
		meta:     meta,
		children: i,
	}

	return record, nil
}

func (r *Record) Meta() *Meta {
	r.Lock()
	defer r.Unlock()
	return r.meta
}

func (r *Record) Id() uint64 {
	return r.meta.Id
}

func (r *Record) DataPath() string {
	return filepath.Join(r.path, "data")
}

func (r *Record) Size() uint64 {
	r.Lock()
	defer r.Unlock()
	return r.meta.Size
}

func (r *Record) Encryption() string {
	r.Lock()
	defer r.Unlock()
	return r.meta.Encryption
}

func (r *Record) Expires() bool {
	r.Lock()
	defer r.Unlock()
	return r.meta.ExpiredAt != time.Time{}
}

func (r *Record) Expired() bool {
	r.Lock()
	defer r.Unlock()
	return r.meta.ExpiredAt != time.Time{} && r.meta.ExpiredAt.Before(time.Now())
}

func (r *Record) Lock() error {
	return r.meta.Lock()
}

func (r *Record) Unlock() error {
	return r.meta.Unlock()
}

func (r *Record) Update(meta Meta) (err error) {
	log.Debugf("Updating record '%s' meta.", r.path)
	return r.meta.Update(meta)
}

func (r *Record) compress() (err error) {
	log.Infof("Compressing file ...")

	start := time.Now()

	datapath := r.DataPath()
	reader, err := os.Open(datapath)
	if err != nil {
		return err
	}

	tmp_filename := datapath + ".tmp.gz"
	writer, err := os.Create(tmp_filename)
	if err != nil {
		return err
	}
	defer writer.Close()

	gzipper := gzip.NewWriter(writer)

	_, err = io.Copy(gzipper, reader)
	if err != nil {
		return err
	}

	gzipper.Flush()
	gzipper.Close()

	err = os.Rename(tmp_filename, datapath)
	if err != nil {
		return err
	}

	elapsed := time.Since(start)
	stats, _ := os.Stat(datapath)

	r.meta.Size = uint64(stats.Size())
	r.meta.Compressed = true

	log.Infof("Compressed %s (%d b) in %s.", utils.FormatBytes(r.meta.Size), r.meta.Size, elapsed)
	return nil
}

func (r *Record) UpdateBuffer(reader io.Reader) (err error) {
	r.Lock()
	defer r.Unlock()

	datapath := r.DataPath()

	log.Infof("Writing buffer to %s ...", datapath)

	start := time.Now()
	writer, err := os.Create(datapath)
	if err != nil {
		return err
	}
	written, err := io.Copy(writer, reader)
	if err != nil {
		writer.Close()
		return err
	}

	writer.Close()

	elapsed := time.Since(start)
	r.meta.Size = uint64(written)
	r.meta.Compressed = false

	log.Infof("Wrote %s (%d b) in %s ...", utils.FormatBytes(r.meta.Size), r.meta.Size, elapsed)

	if config.Conf.Compression && r.meta.Size > 1024 {
		err := r.compress()
		if err != nil {
			return err
		}
	}

	r.meta.FlushNoLock()

	return nil
}

func (r *Record) New(meta Meta, reader io.Reader) (child *Record, err error) {
	r.Lock()
	defer r.Unlock()

	log.Debugf("Creating new record '%s' for parent %s.", meta.Title, r.path)

	meta.Id = r.meta.NextId

	child, err = CreateRecord(r.path, meta, &reader)
	if err != nil {
		return nil, err
	}

	r.children.Add(child)

	r.meta.NextId++
	r.meta.UpdatedAt = time.Now()
	r.meta.FlushNoLock()

	return child, nil
}

func (r *Record) Del(id uint64) (deleted *Record, err error) {
	deleted = r.children.Del(id)
	if deleted == nil {
		return nil, ERR_RECORD_NOT_FOUND
	}

	r.Lock()
	defer r.Unlock()

	r.meta.UpdatedAt = time.Now()
	r.meta.FlushNoLock()

	return deleted, nil
}

func (r *Record) Children() map[uint64]*Record {
	return r.children.Records()
}

func (r *Record) NumChildren() int {
	return r.children.NumRecords()
}

func (r *Record) Get(id uint64) *Record {
	return r.children.Get(id)
}

func (r *Record) Close() {
	log.Debugf("Closing record %s ...", r.path)
	r.meta.Close()
}

func (r *Record) Delete() error {
	log.Debugf("Deleting record %s ...", r.path)
	return os.RemoveAll(r.path)
}
