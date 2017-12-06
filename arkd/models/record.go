/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
// swagger:meta
package models

import (
	"time"
)

// A single encrypted record belonging to one store.
// swagger:model
type Record struct {
	// Record id.
	// Read Only: true
	// required: true
	ID uint `gorm:"primary_key"`
	// Record creation time.
	CreatedAt time.Time
	// Record creation time.
	UpdatedAt time.Time
	StoreID   uint  `json:"-"`
	Store     Store `json:"-"`
	// Record title.
	// required: true
	Title string `gorm:"not null"`
	// Record encryption.
	// required: true
	Encryption string `sql:"DEFAULT:'none'"`
	// Record data.
	// format: bytes
	Data []byte
}

func Records(store_id string) (records []Record, err error) {
	err = db.Where("store_id = ?", store_id).Order("updated_at desc").Find(&records).Error
	return
}

func GetRecord(store_id, id string) (record Record, err error) {
	err = db.Where("store_id = ?", store_id).Where("id = ?", id).Find(&record).Error
	return
}
