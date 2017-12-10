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
	"bytes"
	"compress/gzip"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
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
	// If true this record is compressed.
	Compressed bool `sql:"DEFAULT:False"`
	// Buffer data.
	// format: bytes
	Data []byte
}

func NewBuffer(encryption string, data string) Buffer {
	buffer := []byte(data)
	compress := config.Conf.Compression && len(buffer) >= 1024
	if compress {
		var b bytes.Buffer

		log.Infof("Compressing buffer of %s ...", utils.FormatBytes(uint64(len(data))))

		start := time.Now()
		gz := gzip.NewWriter(&b)
		if _, err := gz.Write(buffer); err != nil {
			log.Fatal(err)
		} else if err := gz.Flush(); err != nil {
			log.Fatal(err)
		} else if err := gz.Close(); err != nil {
			log.Fatal(err)
		}

		buffer = b.Bytes()
		elapsed := time.Since(start)

		log.Infof("Compressed in %s, now buffer is %s.", elapsed, utils.FormatBytes(uint64(len(buffer))))
	}

	return Buffer{
		Encryption: encryption,
		Data:       buffer,
		Compressed: compress,
	}
}

func (b *Buffer) SetData(encryption string, data string) {
	new_buffer := NewBuffer(encryption, data)
	b.Encryption = encryption
	b.Data = new_buffer.Data
	b.Compressed = new_buffer.Compressed
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

func DeleteBuffer(id uint) error {
	return db.Where("id = ?", id).Delete(&Buffer{}).Error
}
