/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"strings"
	"time"
)

func getAddress(c *gin.Context) string {
	return strings.Split(c.Request.RemoteAddr, ":")[0]
}

func logEvent(c *gin.Context, format string, args ...interface{}) {
	when := time.Now().UTC().Format("2006-01-02T15:04:05.999Z")
	who := getAddress(c)
	where := fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
	what := fmt.Sprintf(format, args...)

	log.Printf("[%s] [%s] (%s) %s", when, who, where, what)
}

func jError(c *gin.Context, code int, message string) {
	logEvent(c, "[%d] %s", code, message)
	c.JSON(code, gin.H{
		"code":    code,
		"message": message,
	})
}

func jNotFound(c *gin.Context) {
	jError(c, 404, "Record not found.")
}

func jBadRequest(c *gin.Context) {
	jError(c, 400, "Bad request.")
}

func jForbidden(c *gin.Context) {
	jError(c, 403, "Forbidden.")
}

func jServerError(c *gin.Context, err error) {
	jError(c, 500, "Error while performing operation: "+err.Error())
}
