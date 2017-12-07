/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/arc/arcd/app"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/gin-gonic/gin"
)

var App *app.App

// swagger:route GET /api/manifest manifest getManifest
//
// Handler returning the current web application manifest.
//
// Produces:
//     - application/json
//
// Responses:
//        200: Manifest
func GetManifest(c *gin.Context) {
	log.Api(log.DEBUG, c, "Requested manifest.")
	c.JSON(200, App.Manifest)
}
