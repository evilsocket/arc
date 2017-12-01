package models

import (
	"github.com/gosimple/slug"
	"time"
)

type Record struct {
	ID         uint `gorm:"primary_key"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	StoreID    uint
	Store      Store
	Title      string `gorm:"unique;not null"`
	Name       string `gorm:"unique;not null"`
	Encryption string
	Data       []byte
}

func (r *Record) BeforeSave() error {
	r.Name = slug.Make(r.Title)
	return nil
}

func (r *Record) BeforeUpdate() error {
	r.Name = slug.Make(r.Title)
	return nil
}

func Records(store_id string) (records []Record, err error) {
	err = db.Where("store_id = ?", store_id).Find(&records).Error
	return
}

func GetRecord(store_id, id string) (record Record, err error) {
	err = db.Where("store_id = ?", store_id).Where("id = ?", id).Find(&record).Error
	return
}
