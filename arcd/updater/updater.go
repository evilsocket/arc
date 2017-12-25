/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package updater

import (
	"github.com/evilsocket/arc/arcd/events"
	"github.com/evilsocket/arc/arcd/log"
	"net/http"
	"regexp"
	"time"
)

func worker(currVersion string) {
	for {
		log.Debugf("Checking for newer versions ...")

		client := &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		}

		req, _ := http.NewRequest("GET", "https://github.com/evilsocket/arc/releases/latest", nil)
		resp, err := client.Do(req)
		if err != nil {
			if err := events.Setup(); err != nil {
				log.Fatal(err)
			}
			log.Errorf("Error while checking latest version: %s.", err)
			return
		}
		defer resp.Body.Close()

		location := resp.Header.Get("Location")

		log.Debugf("Location header = '%s'", location)

		var verParser = regexp.MustCompile("^https://github\\.com/evilsocket/arc/releases/tag/v([\\d\\.a-z]+)$")
		m := verParser.FindStringSubmatch(location)
		if len(m) == 2 {
			latest := m[1]
			log.Debugf("Latest version is '%s'", latest)
			if currVersion != latest {
				log.Importantf("Update to %s available at %s.", latest, location)
				events.Add(events.UpdateAvailable(currVersion, latest, location))
			} else {
				log.Debugf("No updates available.")
			}
		} else {
			log.Warningf("Unexpected location header: '%s'.", location)
		}

		time.Sleep(time.Duration(60) * time.Minute)
	}
}

func Start(currVersion string) {
	go worker(currVersion)
}
