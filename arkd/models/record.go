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

const (
	isExpired = "datetime(expired_at) < datetime('now') AND datetime(expired_at) != datetime('0001-01-01 00:00:00+00:00')"
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
	// Record expiration time or 0 if no expiration is set.
	ExpiredAt time.Time `sql:"DEFAULT:''"`
	// If true, the record will be deleted after expiration,
	// otherwise ExpiredAt will stay set as a past time thus
	// marking the record as expired.
	Prune bool `sql:"DEFAULT:FALSE"`
	// Record title.
	// required: true
	Title string `gorm:"not null"`
	// Record encryption.
	// required: true
	Encryption string `sql:"DEFAULT:'none'"`
	// Record data.
	// format: bytes
	Data []byte

	// Store association.
	StoreID uint  `json:"-"`
	Store   Store `json:"-"`
}

func Records(store_id string) (records []Record, err error) {
	err = db.Where("store_id = ?", store_id).Order("updated_at desc").Find(&records).Error
	return
}

func CountExpired() (total int, prunable int, err error) {
	err = db.Model(&Record{}).Where(isExpired).Count(&total).Error
	if err != nil {
		return
	}
	err = db.Model(&Record{}).Where(isExpired).Where("prune = 1").Count(&prunable).Error
	return
}

func PrunableRecords() (records []Record, err error) {
	err = db.Where(isExpired).Where("prune = 1").Find(&records).Error
	return
}

func GetRecord(store_id, id string) (record Record, err error) {
	err = db.Where("store_id = ?", store_id).Where("id = ?", id).Find(&record).Error
	return
}
