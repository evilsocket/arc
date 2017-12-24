/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package backup

import (
	"github.com/evilsocket/arc/arcd/db"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"path"
	"time"
)

func worker(secs int, folder string) {
	period := time.Duration(secs) * time.Second
	filename := path.Join(folder, "arc-backup.tar")

	log.Debugf("Backup task started with a %v period to %s", period, filename)
	for {

		started := time.Now()
		log.Infof("Backupping database to %s ...", filename)
		if err := db.Export(filename); err != nil {
			log.Errorf("Error while creating the backup file: %s.", err)
		} else {
			log.Infof("Backupped %s of data to %s in %s.", utils.FormatBytes(db.Size), log.Bold(filename), time.Since(started))
		}

		time.Sleep(period)
	}

}

func Start(period int, folder string) {
	go worker(period, folder)
}
