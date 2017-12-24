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
	"golang.org/x/crypto/bcrypt"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"syscall"
	"time"

	"github.com/evilsocket/arc/arcd/app"
	"github.com/evilsocket/arc/arcd/backup"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/controllers"
	"github.com/evilsocket/arc/arcd/db"
	"github.com/evilsocket/arc/arcd/events"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/middlewares"
	"github.com/evilsocket/arc/arcd/scheduler"
	"github.com/evilsocket/arc/arcd/tls"
	"github.com/evilsocket/arc/arcd/updater"
	"github.com/evilsocket/arc/arcd/utils"

	"github.com/gin-gonic/gin"
)

var (
	signals        = make(chan os.Signal, 1)
	appPath        = ""
	confFile       = ""
	debug          = false
	logfile        = ""
	noColors       = false
	noAuth         = false
	noUpdates      = false
	export         = false
	importFrom     = ""
	output         = "arc.tar"
	dbIsNew        = false
	tlsFingerprint = ""
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

	r.Use(middlewares.Security(tlsFingerprint))
	r.Use(middlewares.ServeStatic("/", webapp.Path, webapp.Manifest.Index))

	return webapp
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

	if len(os.Args) >= 3 && os.Args[1] == "password" {
		password := os.Args[2]
		cost := bcrypt.DefaultCost
		if len(os.Args) == 4 {
			cost, err = strconv.Atoi(os.Args[3])
			if err != nil {
				log.Fatal(err)
			}
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println(string(hash))
		return
	}

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
		scheduler.Start(config.Conf.Scheduler.Period)
	} else {
		log.Importantf("Scheduler is disabled.")
	}

	if config.Conf.Backups.Enabled {
		log.Debugf("Starting backup task with a period of %ds ...", config.Conf.Backups.Period)
		backup.Start(config.Conf.Backups.Period, config.Conf.Backups.Folder)
	} else {
		log.Importantf("Backups are disabled.")
	}

	if noUpdates == false {
		updater.Start(config.APP_VERSION)
	}

	address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)

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

	tlsFingerprint, err = tls.Fingerprint(config.Conf.Certificate)
	if err != nil {
		log.Fatal(err)
	}

	log.Importantf("TLS certificate fingerprint is %s", log.Bold(tlsFingerprint))

	r := setupRouter()
	if address[0] == ':' {
		address = "0.0.0.0" + address
	}

	log.Infof("Running on %s ...", log.Bold("https://"+address+"/"))
	if err = r.RunTLS(address, config.Conf.Certificate, config.Conf.Key); err != nil {
		log.Fatal(err)
	}
}
