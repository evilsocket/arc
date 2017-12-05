/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
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
	now := time.Now().UTC().Format("2006-01-02T15:04:05.999Z")
	log.Printf("[%s] [%s] %s", now, getAddress(c), fmt.Sprintf(format, args...))
}
