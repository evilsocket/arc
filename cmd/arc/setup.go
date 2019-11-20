package main

import (
	"flag"
	assetfs "github.com/elazarl/go-bindata-assetfs"
	"github.com/evilsocket/arc/backup"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/controllers"
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/arc/events"
	"github.com/evilsocket/arc/middlewares"
	"github.com/evilsocket/arc/scheduler"
	"github.com/evilsocket/arc/tls"
	"github.com/evilsocket/arc/updater"
	"github.com/evilsocket/arc/utils"
	"github.com/evilsocket/arc/webui"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"strings"
	"time"
)

var (
	signals        = make(chan os.Signal, 1)
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
	router         = (*gin.Engine)(nil)
)

func init() {
	flag.StringVar(&confFile, "config", "", "JSON configuration file.")
	flag.BoolVar(&noAuth, "no-auth", noAuth, "Disable authentication.")
	flag.BoolVar(&noUpdates, "no-updates", noUpdates, "Disable updates check.")

	flag.BoolVar(&debug, "debug", debug, "Enable debug logs.")
	flag.StringVar(&logfile, "log", logfile, "Log messages to this file instead of standard error.")

	flag.StringVar(&importFrom, "import", importFrom, "Import stores from this TAR export file.")
	flag.BoolVar(&export, "export", export, "Export store to a TAR archive, requires --output parameter.")
	flag.StringVar(&output, "output", output, "Export file name.")
}

func setupLogging() {
	if logfile != "" {
		log.Output = logfile
	}

	if debug == true {
		log.Level = log.DEBUG
	} else {
		log.Level = log.INFO
	}

	log.DateFormat = "06-Jan-02"
	log.TimeFormat = "15:04:05"
	log.DateTimeFormat = "2006-01-02 15:04:05"
	log.Format = "{datetime} {level:color}{level:name}{reset} {message}"

	if err := log.Open(); err != nil {
		panic(err)
	}
}

func setupDatabase() {
	var err error

	if dbIsNew, err = db.Setup(); err != nil {
		log.Fatal("%v", err)
	}

	if export == true {
		started := time.Now()
		if err = db.Export(output); err != nil {
			log.Fatal("%v", err)
		}
		log.Info("Archived %s of data in %s to %s.", utils.FormatBytes(db.Size), time.Since(started), tui.Bold(output))
		os.Exit(0)
	} else if importFrom != "" {
		started := time.Now()
		if err = db.Import(importFrom); err != nil {
			log.Fatal("%v", err)
		}
		log.Info("Imported %s of data in %s.", utils.FormatBytes(db.Size), time.Since(started))
		os.Exit(0)
	}
}

func setupScheduler() {
	if config.Conf.Scheduler.Enabled {
		if err := events.Setup(); err != nil {
			log.Fatal("%v", err)
		}

		log.Debug("Starting scheduler with a period of %ds ...", config.Conf.Scheduler.Period)
		scheduler.Start(config.Conf.Scheduler.Period)
	} else {
		log.Warning("Scheduler is disabled.")
	}
}

func setupBackups() {
	if config.Conf.Backups.Enabled {
		log.Debug("Starting backup task with a period of %ds ...", config.Conf.Backups.Period)
		backup.Start(config.Conf.Backups.Period, config.Conf.Backups.Folder, config.Conf.Backups.Run)
	} else {
		log.Warning("Backups are disabled.")
	}
}

func setupUpdates() {
	if noUpdates == false {
		updater.Start(config.APP_VERSION)
	}
}

func setupTLS() {
	var err error

	if config.Conf.Certificate, err = utils.ExpandPath(config.Conf.Certificate); err != nil {
		log.Fatal("%v", err)
	} else if config.Conf.Key, err = utils.ExpandPath(config.Conf.Key); err != nil {
		log.Fatal("%v", err)
	}

	if utils.Exists(config.Conf.Certificate) == false || utils.Exists(config.Conf.Key) == false {
		log.Warning("TLS certificate files not found, generating new ones ...")
		if err = tls.Generate(&config.Conf); err != nil {
			log.Fatal("%v", err)
		}
		log.Info("New RSA key and certificate have been generated, remember to add them as exceptions to your browser!")
	}

	tlsFingerprint, err = tls.Fingerprint(config.Conf.Certificate)
	if err != nil {
		log.Fatal("%v", err)
	}

	log.Warning("TLS certificate fingerprint is %s", tui.Bold(tlsFingerprint))
}

type binaryFileSystem struct {
	fs http.FileSystem
}

func (b *binaryFileSystem) Open(name string) (http.File, error) {
	return b.fs.Open(name)
}

func (b *binaryFileSystem) Exists(prefix string, filepath string) bool {
	if p := strings.TrimPrefix(filepath, prefix); len(p) < len(filepath) {
		if _, err := b.fs.Open(p); err != nil {
			return false
		}
		return true
	}
	return false
}

func BinaryFileSystem(root string) *binaryFileSystem {
	fs := &assetfs.AssetFS{
		Asset:    webui.Asset,
		AssetDir: webui.AssetDir,
		Prefix:   root}
	return &binaryFileSystem{
		fs,
	}
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router = gin.New()

	router.Use(middlewares.Security(tlsFingerprint))

	router.Use(static.Serve("/", BinaryFileSystem("webui")))

	// router.Use(middlewares.ServeStatic("/", webapp.Path, webapp.Manifest.Index))

	api := router.Group("/api")
	router.POST("/auth", controllers.Auth)

	if noAuth == false {
		api.Use(middlewares.AuthHandler())
	} else {
		log.Warning("API authentication is disabled.")
	}

	api.GET("/status", controllers.GetStatus)
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

	return router
}
