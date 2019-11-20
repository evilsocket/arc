/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package events

import (
	"crypto/tls"
	"fmt"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/arc/pgp"
	"github.com/evilsocket/arc/utils"
	"gopkg.in/gomail.v2"
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

	repotype := "plaintext"
	if pgpConf.Enabled {
		repotype = "PGP encrypted"
	}

	log.Info("Reporting %s event '%s' to %s ...", repotype, event.Title, config.Conf.Scheduler.Reports.To)

	smtp := config.Conf.Scheduler.Reports.SMTP
	d := gomail.NewDialer(smtp.Address, smtp.Port, smtp.Username, smtp.Password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("Arc Reporting System <%s>", smtp.Username))
	m.SetHeader("To", config.Conf.Scheduler.Reports.To)
	m.SetHeader("Subject", event.Title)

	var err error
	ctype := "text/html"
	body := event.Description
	if pgpConf.Enabled {
		ctype = "text/plain"
		if err, body = pgp.Encrypt(body); err != nil {
			log.Error("Could not PGP encrypt the message: %s.", err)
		}
	}

	m.SetBody(ctype, body)

	if err := d.DialAndSend(m); err != nil {
		log.Error("Error: %s.", err)
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
