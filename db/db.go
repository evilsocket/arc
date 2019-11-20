/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"github.com/evilsocket/islazy/log"
	"sort"
	"time"
)

func getStoreById(store_id string) (store *Record, err error) {
	id, err := ToID(store_id)
	if err != nil {
		return nil, ERR_INVALID_ID
	}

	return dbIndex.Get(id), nil
}

func Stores() (stores []*Meta, err error) {
	stores = make([]*Meta, 0)
	for _, r := range dbIndex.Records() {
		stores = append(stores, r.meta)
	}

	sort.Slice(stores, func(i, j int) bool {
		return stores[i].UpdatedAt.After(stores[j].UpdatedAt)
	})

	return stores, nil
}

func Create(meta *Meta) (*Meta, error) {
	dbIndex.Lock()
	defer dbIndex.Unlock()

	meta.Id = dbNextId
	dbNextId++

	store, err := CreateRecord(dbIndex.Path(), meta, nil)
	if err != nil {
		return nil, err
	}

	dbIndex.Add(store)

	return store.meta, nil
}

func Delete(store *Record) (err error) {
	if err = store.Delete(); err != nil {
		return err
	}

	if dbIndex.Del(store.Id()) == nil {
		return ERR_STORE_NOT_FOUND
	}

	return nil
}

func Records(store_id string) (records []*Meta, err error) {
	store, err := getStoreById(store_id)
	if err != nil {
		return records, err
	} else if store == nil {
		return records, ERR_STORE_NOT_FOUND
	}

	records = make([]*Meta, 0)
	for _, r := range store.Children() {
		records = append(records, r.meta)
	}

	sort.Slice(records, func(i, j int) bool {
		return records[i].UpdatedAt.After(records[j].UpdatedAt)
	})

	return records, nil
}

func GetStore(store_id string) (store *Record, err error) {
	store, err = getStoreById(store_id)
	if err != nil {
		return nil, err
	} else if store == nil {
		return nil, ERR_STORE_NOT_FOUND
	}
	return
}

func GetRecord(store_id, record_id string) (record *Record, err error) {
	store, err := getStoreById(store_id)
	if err != nil {
		return nil, err
	} else if store == nil {
		return nil, ERR_STORE_NOT_FOUND
	}

	id, err := ToID(record_id)
	if err != nil {
		return nil, ERR_INVALID_ID
	}

	record = store.Get(id)
	if record == nil {
		return nil, ERR_RECORD_NOT_FOUND
	}
	return
}

func GetRecordMeta(store_id, record_id string) (meta *Meta, err error) {
	record, err := GetRecord(store_id, record_id)
	if err != nil {
		return nil, err
	}

	meta = record.meta
	err = nil
	return
}

func CountExpired() (total int, prunable int, err error) {
	dbIndex.Lock()
	defer dbIndex.Unlock()

	for _, store := range dbIndex.Records() {
		for _, r := range store.Children() {
			if r.Expired() {
				total++
				if r.meta.Prune {
					prunable++
				}
			}
		}
	}

	return
}

func PrunableRecords() (records []*Record, err error) {
	dbIndex.Lock()
	defer dbIndex.Unlock()

	records = make([]*Record, 0)
	for _, store := range dbIndex.Records() {
		for _, r := range store.Children() {
			if r.Expired() && r.meta.Prune {
				records = append(records, r)
			}
		}
	}

	return
}

func Flush() {
	log.Info("Flushing database ...")

	start := time.Now()
	dbIndex.Flush()
	elapsed := time.Since(start)

	log.Info("Database flushed in %s.", elapsed)
}
