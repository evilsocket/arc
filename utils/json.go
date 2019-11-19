/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package utils

import (
	"github.com/evilsocket/arc/log"
	"github.com/gin-gonic/gin"
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

func jError(level int, c *gin.Context, code int, message string) {
	log.Api(level, c, "[%d] %s", code, message)
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
