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
	"os"
	"path"
	"time"

	"github.com/evilsocket/arc/arcd/app"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/controllers"
	"github.com/evilsocket/arc/arcd/db"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/middlewares"

	"github.com/gin-gonic/gin"
)

const (
	APP_NAME    = "arcd"
	APP_VERSION = "0.9.0"
)

var (
	apppath   = ""
	conf_file = ""
	debug     = false
	logfile   = ""
	no_colors = false
	no_auth   = false
	export    = false
	import_fn = ""
	output    = "arc.json"
	dbIsNew   = false
)

func init() {
	flag.StringVar(&apppath, "app", ".", "Path of the web application to serve.")
	flag.StringVar(&conf_file, "config", "", "JSON configuration file.")
	flag.BoolVar(&no_auth, "no-auth", no_auth, "Disable authenticaion.")
	flag.BoolVar(&debug, "debug", debug, "Enable debug logs.")
	flag.StringVar(&logfile, "logfile", logfile, "Log messages to this file instead of standard error.")
	flag.BoolVar(&no_colors, "no-colors", no_colors, "DIsable colored output.")

	flag.StringVar(&import_fn, "import", import_fn, "Import stores from this JSON export file.")
	flag.BoolVar(&export, "export", export, "Export store to JSON file, requires --output parameter.")
	flag.StringVar(&output, "output", output, "Export file name.")
}

func arcLoadApp(r *gin.Engine) *app.App {
	err, webapp := app.Open(apppath)
	if err != nil {
		log.Fatal(err)
	}

	r.Use(middlewares.ServeStatic("/", webapp.Path, webapp.Manifest.Index))

	return webapp
}

func arcBackupper() {
	period := time.Duration(config.Conf.Backups.Period) * time.Second
	filename := path.Join(config.Conf.Backups.Folder, "arcd_backup.json")

	log.Infof("Backup task started with a %v period to %s", period, filename)
	for {
		time.Sleep(period)

		log.Infof("Backup to %s ...", filename)
		if err := db.Export(filename); err != nil {
			log.Errorf("Error while creating the backup file: %s.", err)
		}
	}
}

func arcScheduler() {
	period := time.Duration(config.Conf.Scheduler.Period) * time.Second

	log.Infof("Scheduler started with a %v period.", period)

	for {
		time.Sleep(period)

		db.Lock()

		for _, store := range db.GetStores() {
			for _, r := range store.Children() {
				meta := r.Meta()
				if r.Expired() && meta.Prune {
					log.Infof("Pruning record %d ...", meta.Id)
					if _, err := store.Del(meta.Id); err != nil {
						log.Errorf("Error while deleting record %d: %s.", meta.Id, err)
					}
				}
			}
		}

		db.Unlock()
	}
}

func main() {
	var err error

	flag.Parse()

	log.WithColors = !no_colors

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

	log.Infof("%s is starting ...", log.Bold(APP_NAME+" v"+APP_VERSION))

	if conf_file != "" {
		if err = config.Load(conf_file); err != nil {
			log.Fatal(err)
		}
	}

	if dbIsNew, err = db.Setup(); err != nil {
		log.Fatal(err)
	}

	if export == true {
		if err = db.Export(output); err != nil {
			log.Fatal(err)
		}
		return
	} else if import_fn != "" {
		if err = db.Import(import_fn); err != nil {
			log.Fatal(err)
		}
		return
	}

	if config.Conf.Scheduler.Enabled {
		log.Infof("Starting scheduler with a period of %ds ...", config.Conf.Scheduler.Period)
		go arcScheduler()
	} else {
		log.Warningf("Scheduler is disabled.")
	}

	if config.Conf.Backups.Enabled {
		log.Infof("Starting backup task with a period of %ds ...", config.Conf.Backups.Period)
		go arcBackupper()
	} else {
		log.Warningf("Backups are disabled.")
	}

	gin.SetMode(gin.ReleaseMode)

	r := gin.New()

	webapp := arcLoadApp(r)

	api := r.Group("/api")
	r.POST("/auth", controllers.Auth)

	if no_auth == false {
		api.Use(middlewares.AuthHandler())
	} else {
		log.Warningf("API authentication is disabled.")
	}

	controllers.App = webapp

	api.GET("/manifest", controllers.GetManifest)
	api.GET("/config", controllers.GetConfig)

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

	address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)

	log.Infof("arcd is serving the app %s on %s ...", log.Bold(webapp.String()), log.Bold(address))

	if config.Conf.TLS.Enabled {
		if err = r.RunTLS(address, config.Conf.TLS.Certificate, config.Conf.TLS.Key); err != nil {
			log.Fatal(err)
		}
	} else {
		if err = r.Run(address); err != nil {
			log.Fatal(err)
		}
	}
}
