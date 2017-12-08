/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
// swagger:meta
package models

import (
	"encoding/json"
	"github.com/evilsocket/arc/arcd/log"
	"io/ioutil"
	"time"
)

// A store represents a single database / data container of the Arc server.
// swagger:model
type Store struct {
	// Store id.
	// Read Only: true
	// required: true
	ID uint `gorm:"primary_key"`
	// Store creation time.
	CreatedAt time.Time
	// Store update time.
	UpdatedAt time.Time
	// Store title.
	// required: true
	Title string `gorm:"unique;not null"`
	// Store records.
	Records []Record
}

func (s *Store) BeforeDelete() (err error) {
	log.Warningf("Deleting records of store %d.", s.ID)
	db.Model(s).Related(&s.Records)
	for _, record := range s.Records {
		log.Warningf("  Deleting record %d.", record.ID)
		if err = Delete(&record); err != nil {
			return err
		}
	}
	return nil
}

func Stores() (stores []Store, err error) {
	err = db.Find(&stores).Error
	return
}

func GetStore(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	return
}

func GetStores(with_records bool) (stores []Store, err error) {
	if stores, err = Stores(); err != nil {
		return
	}

	if with_records {
		for i, _ := range stores {
			db.Model(&stores[i]).Related(&stores[i].Records)
			for j, _ := range stores[i].Records {
				db.Model(&stores[i].Records[j]).Related(&stores[i].Records[j].Buffer)
			}
		}
	}

	return
}

func GetStoreWithRecords(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	if err == nil {
		db.Model(&store).Related(&store.Records)
		for i, _ := range store.Records {
			db.Model(&store.Records[i]).Related(&store.Records[i].Buffer)
		}
	}
	return
}

func Export(store_id string, filename string) (err error) {
	var store Store
	var stores []Store

	if store_id != "" {
		if store, err = GetStoreWithRecords(store_id); err != nil {
			return
		}

		stores = []Store{store}
	} else {
		if stores, err = GetStores(true); err != nil {
			return
		}
	}

	log.Infof("Exporting %d stores ...", len(stores))

	var buffer []byte
	if buffer, err = json.Marshal(stores); err != nil {
		return
	}

	if err = ioutil.WriteFile(filename, buffer, 0644); err != nil {
		return
	}

	log.Infof("Exported %d bytes to %s.", len(buffer), filename)

	return nil
}

func ImportStores(stores []Store) (err error) {
	tx := db.Begin()
	for _, store := range stores {
		log.Debugf("Creating store %s with %d records (id=%d).", log.Bold(store.Title), len(store.Records), store.ID)
		if err = db.Create(&store).Error; err != nil {
			tx.Rollback()
			return
		}
	}
	tx.Commit()
	return nil
}

func Import(filename string) (err error) {
	var stores []Store

	var buffer []byte
	if buffer, err = ioutil.ReadFile(filename); err != nil {
		return
	}

	log.Infof("Read %d bytes from %s ...", len(buffer), filename)

	if err = json.Unmarshal(buffer, &stores); err != nil {
		return
	}

	log.Infof("Importing %d stores ...", len(stores))

	return ImportStores(stores)
}
