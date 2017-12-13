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
	"encoding/json"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io/ioutil"
	"os"
	"time"
)

type ExportedBuffer struct {
	ID         uint64
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Encryption string
	Compressed bool
	Data       []byte
}

type ExportedRecord struct {
	ID        uint64
	CreatedAt time.Time
	UpdatedAt time.Time
	ExpiredAt time.Time
	Prune     bool
	Title     string
	Size      uint64
	Buffer    ExportedBuffer
}

type ExportedStore struct {
	ID        uint64
	CreatedAt time.Time
	UpdatedAt time.Time
	Title     string
	Records   []ExportedRecord
}

func Export(filename string) error {
	log.Warningf("Exporting %d stores ...", dbIndex.NumRecords())

	Lock()
	defer Unlock()

	estores := make([]ExportedStore, 0)

	for _, store := range GetStores() {
		s_meta := store.Meta()
		es := ExportedStore{
			ID:        s_meta.Id,
			CreatedAt: s_meta.CreatedAt,
			UpdatedAt: s_meta.UpdatedAt,
			Title:     s_meta.Title,
			Records:   make([]ExportedRecord, 0),
		}

		for _, r := range store.Children() {
			r_meta := r.Meta()
			datapath := r.DataPath()

			var data []byte
			var err error

			if r_meta.Compressed {
				log.Infof("Decompressing %s ...", datapath)
				fi, err := os.Open(datapath)
				if err != nil {
					return err
				}
				defer fi.Close()

				fz, err := gzip.NewReader(fi)
				if err != nil {
					return err
				}
				defer fz.Close()

				data, err = ioutil.ReadAll(fz)
				if err != nil {
					return err
				}
			} else {
				log.Infof("Reading %s ...", datapath)
				data, err = ioutil.ReadFile(datapath)
				if err != nil {
					return err
				}
			}

			er := ExportedRecord{
				ID:        r_meta.Id,
				CreatedAt: r_meta.CreatedAt,
				UpdatedAt: r_meta.UpdatedAt,
				ExpiredAt: r_meta.ExpiredAt,
				Prune:     r_meta.Prune,
				Title:     r_meta.Title,
				Size:      r_meta.Size,
				Buffer: ExportedBuffer{
					Encryption: r_meta.Encryption,
					Compressed: false,
					Data:       data,
				},
			}

			es.Records = append(es.Records, er)
		}

		estores = append(estores, es)
	}

	buffer, err := json.Marshal(estores)
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(filename, buffer, 0644); err != nil {
		return err
	}

	log.Infof("Exported %s to %s.", utils.FormatBytes(uint64(len(buffer))), filename)

	return nil
}
