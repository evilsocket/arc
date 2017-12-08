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
	"time"
)

// swagger:model
type Buffer struct {
	// Buffer id.
	// Read Only: true
	// required: true
	ID uint `gorm:"primary_key"`
	// Buffer creation time.
	CreatedAt time.Time
	// Buffer creation time.
	UpdatedAt time.Time
	// Buffer encryption.
	// required: true
	Encryption string `sql:"DEFAULT:'none'"`
	// Buffer data.
	// format: string
	Data string
}

func NewBuffer(encryption string, data string) Buffer {
	return Buffer{
		Encryption: encryption,
		Data:       data,
	}
}

func GetBuffer(store_id, record_id string) (buffer Buffer, err error) {
	var record Record

	err = db.Where("store_id = ?", store_id).Where("id = ?", record_id).Find(&record).Error
	if err != nil {
		return
	}

	err = db.Where("id = ?", record.BufferID).Find(&buffer).Error
	return
}
