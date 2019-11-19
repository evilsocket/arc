/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package backup

import (
	"fmt"
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/arc/log"
	"github.com/evilsocket/arc/utils"
	"os/exec"
	"path"
	"runtime"
	"time"
)

func worker(secs int, folder string, cmd string) {
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

			if cmd != "" {
				log.Infof("Running %s ...", log.Bold(cmd))

				var timer *time.Timer
				var c *exec.Cmd

				// make sure commands don't get stucked for more
				// than we are configured to wait.
				timer = time.AfterFunc(period, func() {
					timer.Stop()
					if c != nil {
						log.Warningf("Command timed out, killing.")
						c.Process.Kill()
					}
				})

				cmd = fmt.Sprintf("cd '%s' && %s", folder, cmd)

				started := time.Now()

				if runtime.GOOS == "windows" {
					c = exec.Command("cmd", "/C", cmd)
				} else {
					c = exec.Command("sh", "-c", cmd)
				}

				output, err := c.CombinedOutput()
				if err != nil {
					log.Errorf("Error: %s", err)
				}

				if output != nil && len(output) > 0 {
					log.Infof("Output: %s", log.Bold(string(output)))
				}

				log.Infof("Command ran in %s.", time.Since(started))
			}
		}

		time.Sleep(period)
	}

}

func Start(period int, folder string, cmd string) {
	go worker(period, folder, cmd)
}
