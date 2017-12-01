package main

import (
	"flag"
	"fmt"
	"github.com/evilsocket/gosafe/config"
	"github.com/evilsocket/gosafe/controllers"
	"github.com/evilsocket/gosafe/middlewares"
	"github.com/evilsocket/gosafe/models"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"log"
	"os"
	"sync"
)

var (
	webapp    = ""
	conf_file = ""
	no_auth   = false
)

func init() {
	flag.StringVar(&webapp, "app", ".", "Path of the web application to serve.")
	flag.StringVar(&conf_file, "config", "", "JSON configuration file.")
	flag.BoolVar(&no_auth, "no-auth", no_auth, "Disable authenticaion.")
}

func fatal(err error) {
	log.Println(err)
	os.Exit(1)
}

func main() {
	flag.Parse()

	if conf_file != "" {
		if err := config.Load(conf_file); err != nil {
			fatal(err)
		}

	}

	if err := models.Setup(); err != nil {
		fatal(err)
	}

	web_router := gin.Default()
	web_router.Use(static.ServeRoot("/", webapp))

	api_router := gin.Default()
	api := api_router.Group("/api")
	api_router.POST("/auth", controllers.Auth)

	if no_auth == false {
		api.Use(middlewares.AuthHandler())
	} else {
		log.Printf("WARNING - API authentication is disabled - WARNING\n")
	}

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

	log.Printf("API server starting on %s:%d\n", config.Conf.Api.Address, config.Conf.Api.Port)
	log.Printf("Web server starting on %s:%d for %s\n", config.Conf.Web.Address, config.Conf.Web.Port, webapp)

	var wg sync.WaitGroup

	wg.Add(2)

	go func() {
		defer wg.Done()
		api_router.Run(fmt.Sprintf("%s:%d", config.Conf.Api.Address, config.Conf.Api.Port))
	}()

	go func() {
		defer wg.Done()
		web_router.Run(fmt.Sprintf("%s:%d", config.Conf.Web.Address, config.Conf.Web.Port))
	}()

	wg.Wait()
}
