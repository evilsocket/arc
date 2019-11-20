/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package scheduler

import (
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/arc/events"
	"github.com/evilsocket/islazy/log"
	"time"
)

func worker(secs int) {
	period := time.Duration(secs) * time.Second

	log.Debug("Scheduler started with a %v period.", period)

	for {
		time.Sleep(period)

		db.Lock()

		for _, store := range db.GetStores() {
			for _, r := range store.Children() {
				meta := r.Meta()
				if r.Expired() {
					if r.WasNotified() == false {
						events.Add(events.RecordExpired(r))
						r.SetNotified(true)
					}

					if meta.Prune {
						log.Info("Pruning record %d ( %s ) ...", meta.Id, meta.Title)
						if _, err := store.Del(meta.Id); err != nil {
							log.Error("Error while deleting record %d: %s.", meta.Id, err)
						}
					}
				}
			}
		}

		db.Unlock()
	}
}

func Start(period int) {
	go worker(period)
}
