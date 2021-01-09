/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package events

import (
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/pgp"
	"github.com/evilsocket/arc/utils"
	"github.com/evilsocket/islazy/log"
	"sync"
	"time"
)

var (
	lock      = &sync.Mutex{}
	Pool      = make([]Event, 0)
	pgpConf   = &config.Conf.Scheduler.Reports.PGP
	repStats  = make(map[string]time.Time, 0)
	statsLock = &sync.Mutex{}
)

func Setup() error {
	reports := config.Conf.Scheduler.Reports
	if config.Conf.Scheduler.Enabled && reports.Enabled && pgpConf.Enabled {
		if err := pgp.Setup(pgpConf); err != nil {
			return err
		}
	}
	return nil
}

func rateLimit(event Event) bool {
	statsLock.Lock()
	defer statsLock.Unlock()

	dropEvent := false
	lastSeen := time.Now()

	if last, found := repStats[event.Name]; found == true {
		elapsed := time.Since(last)
		if elapsed.Seconds() < float64(config.Conf.Scheduler.Reports.RateLimit) {
			dropEvent = true
		}
	}

	repStats[event.Name] = lastSeen

	return dropEvent
}

func Report(event Event) {
	if rateLimit(event) == true {
		log.Warning("Dropping event '%s' because of rate limiting.", event.Title)
		return
	}

	if err := doEmailReport(event); err != nil {
		log.Error("%v", err)
	}
}

func Add(event Event) {
	lock.Lock()
	defer lock.Unlock()
	Pool = append([]Event{event}, Pool...)
	log.Info("New event (Pool size is %d): %s.", len(Pool), event)

	if config.Conf.Scheduler.Reports.Enabled && utils.InSlice(event.Name, config.Conf.Scheduler.Reports.Filter) == true {
		go Report(event)
	}
}

func Clear() {
	lock.Lock()
	defer lock.Unlock()
	Pool = make([]Event, 0)
	log.Debug("Events Pool has been cleared.")
}

func AddNew(name, title, description string) Event {
	event := New(name, title, description)
	Add(event)
	return event
}
