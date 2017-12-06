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

func GetConfig(c *gin.Context) {
	log.Api(log.DEBUG, c, "Requested configuration.")
	c.JSON(200, config.Conf)
}
