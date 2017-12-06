/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/ark/arkd/config"
	"github.com/evilsocket/ark/arkd/log"
	"github.com/gin-gonic/gin"
)

// swagger:route GET /api/config configuration getConfig
//
// Handler returning the current server configuration.
//
// Produces:
//     - application/json
//
// Responses:
//        200: Configuration
func GetConfig(c *gin.Context) {
	log.Api(log.DEBUG, c, "Requested configuration.")
	c.JSON(200, config.Conf)
}
