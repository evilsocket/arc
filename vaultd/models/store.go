/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package models

import (
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
