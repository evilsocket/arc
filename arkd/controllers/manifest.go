/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/ark/arkd/app"
	"github.com/evilsocket/ark/arkd/log"
	"github.com/gin-gonic/gin"
)

var App *app.App

func GetManifest(c *gin.Context) {
	log.Api(log.DEBUG, c, "Requested manifest.")
	c.JSON(200, App.Manifest)
}
