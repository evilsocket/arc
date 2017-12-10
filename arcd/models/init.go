/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package models

import (
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"os"
)

var db *gorm.DB

func Setup() (created bool, err error) {
	if config.Conf.Database, err = utils.ExpandPath(config.Conf.Database); err != nil {
		return false, err
	}

	if _, err = os.Stat(config.Conf.Database); os.IsNotExist(err) {
		created = true
		log.Warningf("Creating database %s ...", log.Bold(config.Conf.Database))
	} else {
		created = false
		log.Infof("Loading database %s ...", log.Bold(config.Conf.Database))
	}

	if db, err = gorm.Open("sqlite3", config.Conf.Database); err != nil {
		return false, err
	}

	log.Debugf("Migrating models ...")

	db.AutoMigrate(&Store{})
	db.AutoMigrate(&Record{})
	db.AutoMigrate(&Buffer{})

	return created, nil
}

func Vacuum() error {
	return db.Exec("VACUUM").Error
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
