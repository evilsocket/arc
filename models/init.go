package models

import (
	"github.com/evilsocket/vault/config"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"log"
	"os/user"
	"path/filepath"
	"strings"
)

var db *gorm.DB

func expand(path string) (string, error) {
	if strings.HasPrefix(path, "~") {
		usr, err := user.Current()
		if err != nil {
			return "", err
		}
		path = strings.Replace(path, "~", usr.HomeDir, -1)
	}
	return filepath.Abs(path)
}

func Setup() (err error) {
	if config.Conf.Database, err = expand(config.Conf.Database); err != nil {
		return err
	}

	log.Printf("Loading database %s ...\n", config.Conf.Database)

	if db, err = gorm.Open("sqlite3", config.Conf.Database); err != nil {
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
