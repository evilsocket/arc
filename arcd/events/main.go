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
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"gopkg.in/gomail.v2"
	"sync"
)

var (
	lock = &sync.Mutex{}
	Pool = make([]Event, 0)
)

func Report(event Event) {
	log.Infof("Reporting event '%s' to %s ...", event.Title, config.Conf.Scheduler.Reports.To)

	smtp := config.Conf.Scheduler.Reports.SMTP
	d := gomail.NewDialer(smtp.Address, smtp.Port, smtp.Username, smtp.Password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	m := gomail.NewMessage()
	m.SetHeader("From", smtp.Username)
	m.SetHeader("To", config.Conf.Scheduler.Reports.To)
	m.SetHeader("Subject", event.Title)
	m.SetBody("text/html", event.Description)

	if err := d.DialAndSend(m); err != nil {
		log.Errorf("Error: %s.", err)
	} else {
		log.Infof("Reported.")
	}
}

func Add(event Event) {
	lock.Lock()
	defer lock.Unlock()
	Pool = append([]Event{event}, Pool...)
	log.Debugf("New event added (Pool size is %d): %s.", len(Pool), event)

	if config.Conf.Scheduler.Reports.Enabled && utils.InSlice(event.Name, config.Conf.Scheduler.Reports.Filter) == true {
		go Report(event)
	}
}

func Clear() {
	lock.Lock()
	defer lock.Unlock()
	Pool = make([]Event, 0)
	log.Debugf("Events Pool has been cleared.")
}

func AddNew(name, title, description string) Event {
	event := New(name, title, description)
	Add(event)
	return event
}
