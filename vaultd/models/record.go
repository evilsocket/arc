package models

import (
	"time"
)

type Record struct {
	ID         uint `gorm:"primary_key"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	StoreID    uint   `json:"-"`
	Store      Store  `json:"-"`
	Title      string `gorm:"not null"`
	Encryption string `sql:"DEFAULT:'none'"`
	Data       []byte
}

func Records(store_id string) (records []Record, err error) {
	err = db.Where("store_id = ?", store_id).Order("updated_at desc").Find(&records).Error
	return
}

func GetRecord(store_id, id string) (record Record, err error) {
	err = db.Where("store_id = ?", store_id).Where("id = ?", id).Find(&record).Error
	return
}
