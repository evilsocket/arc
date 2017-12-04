package controllers

import (
	"github.com/evilsocket/vault/app"
	"github.com/gin-gonic/gin"
)

var App *app.App

func GetManifest(c *gin.Context) {
	logEvent(c, "Requested manifest.")
	c.JSON(200, App.Manifest)
}
