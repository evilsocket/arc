package models

import (
	"github.com/evilsocket/vault/config"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"os/user"
	"path"
)

var db *gorm.DB

func Setup() error {
	usr, err := user.Current()
	if err != nil {
		return err
	}

	filename := path.Join(usr.HomeDir, config.Conf.Database)
	if db, err = gorm.Open("sqlite3", filename); err != nil {
		return err
	}

	db.AutoMigrate(&Store{})
	db.AutoMigrate(&Record{})

	return nil
}

func Save(obj interface{}) error {
	return db.Save(obj).Error
}

func Create(obj interface{}) error {
	return db.Create(obj).Error
}

func Delete(obj interface{}) error {
	return db.Delete(obj).Error
}
