/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package updater

import (
	"github.com/evilsocket/arc/events"
	"github.com/evilsocket/islazy/log"
	"net/http"
	"regexp"
	"time"
)

var versionParser = regexp.MustCompile("^https://github\\.com/evilsocket/arc/releases/tag/v([\\d\\.a-z]+)$")

func worker(currVersion string) {
	interval := time.Duration(60) * time.Minute
	client := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	for {
		log.Debug("Checking for newer versions ...")

		req, _ := http.NewRequest("GET", "https://github.com/evilsocket/arc/releases/latest", nil)
		resp, err := client.Do(req)
		if err != nil {
			if err := events.Setup(); err != nil {
				log.Fatal("%v", err)
			}
			log.Error("Error while checking latest version: %s.", err)
			return
		}
		defer resp.Body.Close()

		location := resp.Header.Get("Location")

		log.Debug("Location header = '%s'", location)

		m := versionParser.FindStringSubmatch(location)
		if len(m) == 2 {
			latest := m[1]
			log.Debug("Latest version is '%s'", latest)
			if currVersion != latest {
				log.Warning("Update to %s available at %s.", latest, location)
				events.Add(events.UpdateAvailable(currVersion, latest, location))
			} else {
				log.Debug("No updates available.")
			}
		} else {
			log.Warning("Unexpected location header: '%s'.", location)
		}

		time.Sleep(interval)
	}
}

func Start(currVersion string) {
	go worker(currVersion)
}
