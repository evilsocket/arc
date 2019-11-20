/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package utils

import (
	"fmt"
	"github.com/evilsocket/islazy/log"
	"github.com/gin-gonic/gin"
	"strings"
)

// ErrorResponse is used when sending a HTTP status response different than 200
// swagger:response errorResponse
// Code reference  http://www.restapitutorial.com/httpstatuscodes.html
type ErrorResponse struct {
	// The error description.
	// in: body
	// Error code.
	Code int `json:"code"`
	// Error message.
	// in: body
	Message string `json:"message"`
}

func Api(level log.Verbosity, c *gin.Context, format string, args ...interface{}) {
	who := strings.Split(c.Request.RemoteAddr, ":")[0]
	req := fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
	format = fmt.Sprintf("%s '%s' > %s", who, req, format)
	if level == log.WARNING {
		log.Warning(format, args...)

	} else {
		log.Error(format, args...)
	}
}

func jError(level log.Verbosity, c *gin.Context, code int, message string) {
	Api(level, c, "[%d] %s", code, message)
	c.JSON(code, ErrorResponse{
		Code:    code,
		Message: message,
	})
	c.Abort()
}

// NotFound log 404 error message in JSON format
func NotFound(c *gin.Context, opt_msg ...string) {
	msg := "Not found."
	if len(opt_msg) > 0 {
		msg = opt_msg[0]
	}
	jError(log.WARNING, c, 404, msg)
}

// BadRequest log 400 eror message in JSON format
func BadRequest(c *gin.Context, opt_msg ...string) {
	msg := "Bad request."
	if len(opt_msg) > 0 {
		msg = opt_msg[0]
	}
	jError(log.WARNING, c, 400, msg)
}

// Forbidden log 403 error message in JSON format
func Forbidden(c *gin.Context, opt_msg ...string) {
	msg := "Forbidden"
	if len(opt_msg) > 0 {
		msg = opt_msg[0]
	}
	jError(log.WARNING, c, 403, msg)
}

// ServerError log 500 error message in JSON format
func ServerError(c *gin.Context, err error) {
	jError(log.ERROR, c, 500, "Error while performing operation: "+err.Error())
}
