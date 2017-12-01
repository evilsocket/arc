package main

import (
	"flag"
	"fmt"
	"github.com/evilsocket/gosafe/config"
	"github.com/evilsocket/gosafe/controllers"
	"github.com/evilsocket/gosafe/middlewares"
	"github.com/evilsocket/gosafe/models"
	"github.com/gin-gonic/gin"
	"log"
	"os"
)

var (
	conf_file = ""
	no_auth   = false
)

func init() {
	flag.StringVar(&conf_file, "config", "", "JSON configuration file.")
	flag.BoolVar(&no_auth, "no-auth", no_auth, "Disable authenticaion.")
}

func main() {
	flag.Parse()

	if conf_file != "" {
		if err := config.Load(conf_file); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

	}

	if err := models.Setup(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	r := gin.Default()

	api := r.Group("/api")
	if no_auth == false {
		api.Use(middlewares.AuthHandler())
		r.POST("/auth", controllers.Auth)
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

	listen := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)
	log.Printf("Listening on %s ...\n", listen)
	r.Run(listen)
}
