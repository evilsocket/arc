/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package models

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"time"
)

type Store struct {
	ID        uint `gorm:"primary_key"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Title     string `gorm:"unique;not null"`
	Records   []Record
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
		}
	}

	return
}

func GetStoreWithRecords(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	if err == nil {
		db.Model(&store).Related(&store.Records)
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

	log.Printf("Exporting %d records ...\n", len(stores))

	var buffer []byte
	if buffer, err = json.Marshal(stores); err != nil {
		return
	}

	if err = ioutil.WriteFile(filename, buffer, 0644); err != nil {
		return
	}

	log.Printf("Exported %d bytes to %s.\n", len(buffer), filename)

	return nil
}

func ImportStores(stores []Store) (err error) {
	tx := db.Begin()
	for _, store := range stores {
		log.Printf("Creating store '%s' with %d records (id=%d).\n", store.Title, len(store.Records), store.ID)
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

	log.Printf("Read %d bytes from %s ...\n", len(buffer), filename)

	if err = json.Unmarshal(buffer, &stores); err != nil {
		return
	}

	log.Printf("Importing %d stores ...\n", len(stores))

	return ImportStores(stores)
}
