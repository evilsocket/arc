/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/evilsocket/ark/arkd/app"
	"github.com/evilsocket/ark/arkd/config"
	"github.com/evilsocket/ark/arkd/controllers"
	"github.com/evilsocket/ark/arkd/middlewares"
	"github.com/evilsocket/ark/arkd/models"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
)

var (
	apppath   = ""
	conf_file = ""
	no_auth   = false
	export    = false
	import_fn = ""
	store_id  = ""
	output    = "ark.json"
	dbIsNew   = false
)

func init() {
	flag.StringVar(&apppath, "app", ".", "Path of the web application to serve.")
	flag.StringVar(&conf_file, "config", "", "JSON configuration file.")
	flag.BoolVar(&no_auth, "no-auth", no_auth, "Disable authenticaion.")

	flag.StringVar(&import_fn, "import", import_fn, "Import stores from this JSON export file.")
	flag.BoolVar(&export, "export", export, "Export store to JSON file, requires --store and --output parameters.")
	flag.StringVar(&store_id, "store", store_id, "Store id to export or empty for all the existing stores.")
	flag.StringVar(&output, "output", output, "Export file name.")
}

func fatal(err error) {
	log.Println(err)
	os.Exit(1)
}

func loadApp(r *gin.Engine) *app.App {
	err, webapp := app.Open(apppath)
	if err != nil {
		fatal(err)
	}

	r.Use(static.Serve("/", static.LocalFile(webapp.Path, true)))

	return webapp
}

func main() {
	var err error

	flag.Parse()

	if conf_file != "" {
		if err = config.Load(conf_file); err != nil {
			fatal(err)
		}
	}

	if dbIsNew, err = models.Setup(); err != nil {
		fatal(err)
	}

	if export == true {
		if err = models.Export(store_id, output); err != nil {
			fatal(err)
		}
		return
	} else if import_fn != "" {
		if err = models.Import(import_fn); err != nil {
			fatal(err)
		}
		return
	}

	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	webapp := loadApp(r)

	if dbIsNew && len(webapp.Seeds) > 0 {
		log.Printf("Seeding database with %d store(s) ...\n", len(webapp.Seeds))
		if err = models.ImportStores(webapp.Seeds); err != nil {
			fatal(err)
		}
	}

	api := r.Group("/api")
	r.POST("/auth", controllers.Auth)

	if no_auth == false {
		api.Use(middlewares.AuthHandler())
	} else {
		log.Printf("WARNING - API authentication is disabled - WARNING\n")
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
	api.PUT("/store/:id/record/:r_id", controllers.UpdateRecord)
	api.DELETE("/store/:id/record/:r_id", controllers.DeleteRecord)

	address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)

	log.Printf("arkd is serving the app '%s' on %s ...\n\n", webapp, address)

	if config.Conf.TLS.Enabled {
		if err = r.RunTLS(address, config.Conf.TLS.PemFile, config.Conf.TLS.KeyFile); err != nil {
			fatal(err)
		}
	} else {
		if err = r.Run(address); err != nil {
			fatal(err)
		}
	}
}
