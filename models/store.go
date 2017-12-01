package models

import (
	"github.com/gosimple/slug"
	"time"
)

type Store struct {
	ID        uint `gorm:"primary_key"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Title     string `gorm:"unique;not null"`
	Name      string `gorm:"unique;not null"`
	Records   []Record
}

func (s *Store) BeforeSave() error {
	s.Name = slug.Make(s.Title)
	return nil
}

func (s *Store) BeforeUpdate() error {
	s.Name = slug.Make(s.Title)
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

func GetStoreWithRecords(id string) (store Store, err error) {
	err = db.Where("id = ?", id).Find(&store).Error
	if err == nil {
		db.Model(&store).Related(&store.Records)
	}
	return
}
