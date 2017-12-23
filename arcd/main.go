/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path"
	"regexp"
	"runtime"
	"syscall"
	"time"

	"github.com/evilsocket/arc/arcd/app"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/controllers"
	"github.com/evilsocket/arc/arcd/db"
	"github.com/evilsocket/arc/arcd/events"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/middlewares"
	"github.com/evilsocket/arc/arcd/tls"
	"github.com/evilsocket/arc/arcd/utils"

	"github.com/gin-gonic/gin"
	"gopkg.in/unrolled/secure.v1"
)

var (
	signals    = make(chan os.Signal, 1)
	appPath    = ""
	confFile   = ""
	debug      = false
	logfile    = ""
	noColors   = false
	noAuth     = false
	noUpdates  = false
	export     = false
	importFrom = ""
	output     = "arc.tar"
	dbIsNew    = false
)

func init() {
	flag.StringVar(&appPath, "app", ".", "Path of the web application to serve.")
	flag.StringVar(&confFile, "config", "", "JSON configuration file.")
	flag.BoolVar(&noAuth, "no-auth", noAuth, "Disable authentication.")
	flag.BoolVar(&noUpdates, "no-updates", noUpdates, "Disable updates check.")

	flag.BoolVar(&debug, "log-debug", debug, "Enable debug logs.")
	flag.StringVar(&logfile, "log-file", logfile, "Log messages to this file instead of standard error.")
	flag.BoolVar(&noColors, "log-colors-off", noColors, "Disable colored output.")

	flag.StringVar(&importFrom, "import", importFrom, "Import stores from this TAR export file.")
	flag.BoolVar(&export, "export", export, "Export store to a TAR archive, requires --output parameter.")
	flag.StringVar(&output, "output", output, "Export file name.")
}

func arcLoadApp(r *gin.Engine) *app.App {
	err, webapp := app.Open(appPath)
	if err != nil {
		log.Fatal(err)
	}

	secureMiddleware := secure.New(secure.Options{
		FrameDeny:          true,
		ContentTypeNosniff: true,
		BrowserXssFilter:   true,
		ReferrerPolicy:     "same-origin",
	})
	secureFunc := func() gin.HandlerFunc {
		return func(c *gin.Context) {
			err := secureMiddleware.Process(c.Writer, c.Request)
			// If there was an error, do not continue.
			if err != nil {
				c.Abort()
				return
			}
			// Avoid header rewrite if response is a redirection.
			if status := c.Writer.Status(); status > 300 && status < 399 {
				c.Abort()
			}
		}
	}()

	r.Use(secureFunc)
	r.Use(middlewares.ServeStatic("/", webapp.Path, webapp.Manifest.Index))

	return webapp
}

func arcBackupper() {
	period := time.Duration(config.Conf.Backups.Period) * time.Second
	filename := path.Join(config.Conf.Backups.Folder, "arc-backup.tar")

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

func arcScheduler() {
	period := time.Duration(config.Conf.Scheduler.Period) * time.Second

	log.Debugf("Scheduler started with a %v period.", period)

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
						log.Infof("Pruning record %d ( %s ) ...", meta.Id, meta.Title)
						if _, err := store.Del(meta.Id); err != nil {
							log.Errorf("Error while deleting record %d: %s.", meta.Id, err)
						}
					}
				}
			}
		}

		db.Unlock()
	}
}

func arcUpdater() {
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
			if config.APP_VERSION != latest {
				log.Importantf("Update to %s available at %s.", latest, location)
				events.Add(events.UpdateAvailable(config.APP_VERSION, latest, location))
			} else {
				log.Debugf("No updates available.")
			}
		} else {
			log.Warningf("Unexpected location header: '%s'.", location)
		}

		time.Sleep(time.Duration(60) * time.Minute)
	}
}

func arcSignalHandler() {
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	s := <-signals
	log.Raw("\n")
	log.Importantf("RECEIVED SIGNAL: %s", s)
	db.Flush()
	os.Exit(1)
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()

	webapp := arcLoadApp(r)

	api := r.Group("/api")
	r.POST("/auth", controllers.Auth)

	if noAuth == false {
		api.Use(middlewares.AuthHandler())
	} else {
		log.Importantf("API authentication is disabled.")
	}

	controllers.App = webapp

	api.GET("/status", controllers.GetStatus)
	api.GET("/manifest", controllers.GetManifest)
	api.GET("/config", controllers.GetConfig)

	api.GET("/events/clear", controllers.ClearEvents)

	api.GET("/stores", controllers.ListStores)
	api.POST("/stores", controllers.CreateStore)
	api.GET("/store/:id", controllers.GetStore)
	api.PUT("/store/:id", controllers.UpdateStore)
	api.DELETE("/store/:id", controllers.DeleteStore)

	api.GET("/store/:id/records", controllers.ListRecords)
	api.POST("/store/:id/records", controllers.CreateRecord)
	api.GET("/store/:id/record/:r_id", controllers.GetRecord)
	api.GET("/store/:id/record/:r_id/buffer", controllers.GetRecordBuffer)
	api.PUT("/store/:id/record/:r_id", controllers.UpdateRecord)
	api.DELETE("/store/:id/record/:r_id", controllers.DeleteRecord)

	return r
}

func main() {
	var err error

	flag.Parse()

	log.WithColors = !noColors

	if logfile != "" {
		log.Output, err = os.Create(logfile)
		if err != nil {
			log.Fatal(err)
		}

		defer log.Output.Close()
	}

	if debug == true {
		log.MinLevel = log.DEBUG
	} else {
		log.MinLevel = log.INFO
	}

	log.Infof("%s (%s %s) is starting ...", log.Bold(config.APP_NAME+" v"+config.APP_VERSION), runtime.GOOS, runtime.GOARCH)

	if confFile != "" {
		if err = config.Load(confFile); err != nil {
			log.Fatal(err)
		}
	}

	if dbIsNew, err = db.Setup(); err != nil {
		log.Fatal(err)
	}

	if export == true {
		started := time.Now()
		if err = db.Export(output); err != nil {
			log.Fatal(err)
		}
		log.Infof("Archived %s of data in %s to %s.", utils.FormatBytes(db.Size), time.Since(started), log.Bold(output))
		return
	} else if importFrom != "" {
		started := time.Now()
		if err = db.Import(importFrom); err != nil {
			log.Fatal(err)
		}
		log.Infof("Imported %s of data in %s.", utils.FormatBytes(db.Size), time.Since(started))
		return
	}

	go arcSignalHandler()

	if config.Conf.Scheduler.Enabled {
		if err := events.Setup(); err != nil {
			log.Fatal(err)
		}

		log.Debugf("Starting scheduler with a period of %ds ...", config.Conf.Scheduler.Period)
		go arcScheduler()
	} else {
		log.Importantf("Scheduler is disabled.")
	}

	if config.Conf.Backups.Enabled {
		log.Debugf("Starting backup task with a period of %ds ...", config.Conf.Backups.Period)
		go arcBackupper()
	} else {
		log.Importantf("Backups are disabled.")
	}

	if noUpdates == false {
		go arcUpdater()
	}

	address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)

	r := setupRouter()

	if config.Conf.Certificate, err = utils.ExpandPath(config.Conf.Certificate); err != nil {
		log.Fatal(err)
	} else if config.Conf.Key, err = utils.ExpandPath(config.Conf.Key); err != nil {
		log.Fatal(err)
	}

	if utils.Exists(config.Conf.Certificate) == false || utils.Exists(config.Conf.Key) == false {
		log.Importantf("TLS certificate files not found, generating new ones ...")
		if err = tls.Generate(&config.Conf); err != nil {
			log.Fatal(err)
		}
		log.Infof("New RSA key and certificate have been generated, remember to add them as exceptions to your browser!")
	}

	if address[0] == ':' {
		address = "0.0.0.0" + address
	}
	log.Infof("Running on %s ...", log.Bold("https://"+address+"/"))
	if err = r.RunTLS(address, config.Conf.Certificate, config.Conf.Key); err != nil {
		log.Fatal(err)
	}
}
