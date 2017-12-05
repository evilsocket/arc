package models

import (
	"time"
)

type Store struct {
	ID        uint `gorm:"primary_key"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Title     string   `gorm:"unique;not null"`
	Records   []Record `json:"-"`
}

func Stores() (stores []Store, err error) {
	err = db.Find(&stores).Error
	return
}

func GetStore(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	return
}

func GetStoreWithRecords(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	if err == nil {
		db.Model(&store).Related(&store.Records)
	}
	return
}
