/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"github.com/theckman/go-flock"
	"path/filepath"
	"strings"
)

type Index struct {
	path    string
	lock    *flock.Flock
	records map[uint64]*Record
}

func LoadIndex(path string) (i Index, err error) {
	log.Debugf("Loading index from '%s' ...", path)

	i = Index{
		path:    path,
		lock:    flock.NewFlock(filepath.Join(path, ".lock")),
		records: make(map[uint64]*Record),
	}

	i.Lock()
	defer i.Unlock()

	matches, err := filepath.Glob(filepath.Join(path, "*"))
	if err != nil {
		log.Errorf("Error while globbing folder %s: %s", path, err)
		return i, err
	}

	for _, folder := range matches {
		name := strings.Replace(folder, path+"/", "", -1)
		id, err := ToID(name)
		if err == nil {
			meta_path := filepath.Join(folder, "meta.json")
			if utils.Exists(meta_path) {
				log.Debugf("Loading record from %s ...", folder)
				child, err := OpenRecord(folder)
				if err == nil {
					i.records[id] = child
				}
			}
		}
	}

	return i, nil
}

func (i *Index) Path() string {
	return i.path
}

func (i *Index) Lock() error {
	return i.lock.Lock()
}

func (i *Index) Unlock() error {
	return i.lock.Unlock()
}

func (i *Index) Del(id uint64) *Record {
	i.Lock()
	defer i.Unlock()

	if child, found := i.records[id]; found {
		delete(i.records, id)
		return child
	}

	return nil
}

func (i *Index) Get(id uint64) *Record {
	i.Lock()
	defer i.Unlock()

	if child, found := i.records[id]; found {
		return child
	}

	return nil
}

func (i *Index) Add(r *Record) {
	i.Lock()
	defer i.Unlock()
	i.records[r.meta.Id] = r
}

func (i *Index) NumRecords() int {
	i.Lock()
	defer i.Unlock()
	return len(i.records)
}

func (i *Index) Records() map[uint64]*Record {
	i.Lock()
	defer i.Unlock()
	return i.records
}
