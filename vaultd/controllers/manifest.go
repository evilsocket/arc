/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/vault/vaultd/app"
	"github.com/gin-gonic/gin"
)

var App *app.App

func GetManifest(c *gin.Context) {
	logEvent(c, "Requested manifest.")
	c.JSON(200, App.Manifest)
}
