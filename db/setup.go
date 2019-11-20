/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/utils"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"os"
	"time"
)

var (
	dbIndex  = (*Index)(nil)
	dbNextId = uint64(0)

	Size = uint64(0)
)

func Setup() (created bool, err error) {
	started := time.Now()

	if config.Conf.Database, err = utils.ExpandPath(config.Conf.Database); err != nil {
		return false, err
	}

	if _, err = os.Stat(config.Conf.Database); os.IsNotExist(err) {
		created = true
		log.Warning("Creating database %s ...", tui.Bold(config.Conf.Database))
	} else {
		created = false
		log.Info("Loading database %s ...", tui.Bold(config.Conf.Database))
	}

	dbIndex, err = LoadIndex(config.Conf.Database)
	if err != nil {
		return false, err
	}

	for id := range dbIndex.Records() {
		if id > dbNextId {
			dbNextId = id + 1
		}
	}

	elapsed := time.Since(started)

	log.Debug("  dbNextId=%d", dbNextId)
	log.Info("%s of records loaded in %s.", utils.FormatBytes(Size), elapsed)

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
