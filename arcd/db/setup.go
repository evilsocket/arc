/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"os"
)

var (
	dbIndex  Index
	dbNextId = uint64(0)
)

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

	dbIndex, err = LoadIndex(config.Conf.Database)
	if err != nil {
		return false, err
	}

	for id, _ := range dbIndex.Records() {
		if id > dbNextId {
			dbNextId = id + 1
		}
	}

	log.Debugf("dbNextId=%d", dbNextId)

	return created, nil
}

func Lock() {
	dbIndex.Lock()
}

func Unlock() {
	dbIndex.Unlock()
}

func GetStores() map[uint64]*Record {
	return dbIndex.Records()
}
