/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package utils

import (
	"github.com/evilsocket/ark/arkd/log"
	"github.com/gin-gonic/gin"
)

func jError(level int, c *gin.Context, code int, message string) {
	log.Api(level, c, "[%d] %s", code, message)
	c.JSON(code, gin.H{
		"code":    code,
		"message": message,
	})
	c.Abort()
}

// http://www.restapitutorial.com/httpstatuscodes.html
func NotFound(c *gin.Context) {
	jError(log.WARNING, c, 404, "Record not found.")
}

func BadRequest(c *gin.Context) {
	jError(log.WARNING, c, 400, "Bad request.")
}

func Forbidden(c *gin.Context) {
	jError(log.ERROR, c, 403, "Forbidden.")
}

func ServerError(c *gin.Context, err error) {
	jError(log.ERROR, c, 500, "Error while performing operation: "+err.Error())
}
