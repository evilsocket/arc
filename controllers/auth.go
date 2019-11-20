/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/events"
	"github.com/evilsocket/arc/middlewares"
	"github.com/evilsocket/arc/utils"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"github.com/gin-gonic/gin"
	"strings"
)

// Authentication credentials.
// swagger:model Auth
type AuthRequest struct {
	// API server username ( as per config.json ).
	// in: body
	// required: true
	Username string `json:"username"`
	// API server password ( as per config.json ).
	// in: body
	// required: true
	Password string `json:"password"`
}

// Authentication response.
// swagger:response authResponse
type AuthResponse struct {
	// The bearer token to use for API requests.
	// in: body
	Token string `json:"token"`
}

// swagger:route POST /auth authentication doAuth
//
// Handler authenticating a user and returning a bearer token for API requests.
//
// Consumes:
//     - application/json
// Produces:
//     - application/json
//
// Responses:
//        200: authResponse
//		  400: errorResponse
//		  403: errorResponse
//		  500: errorResponse
func Auth(c *gin.Context) {
	var auth AuthRequest

	if err := SafeBind(c, &auth); err != nil {
		utils.BadRequest(c)
	} else if config.Conf.Auth(auth.Username, auth.Password) == false {
		log.Warning("Invalid login credentials provided.")
		events.Add(
			events.Login(false,
				strings.Split(c.Request.RemoteAddr, ":")[0],
				auth.Username,
				auth.Password,
			))
		utils.Forbidden(c, "Invalid login credentials.")
	} else if token, err := middlewares.GenerateToken([]byte(config.Conf.Secret), auth.Username); err != nil {
		utils.ServerError(c, err)
	} else {
		events.Add(
			events.Login(true,
				strings.Split(c.Request.RemoteAddr, ":")[0],
				auth.Username,
				auth.Password,
			))
		utils.Api(log.INFO, c, "User %s requested new API token", tui.Bold(auth.Username))
		c.JSON(200, gin.H{"token": token})
	}
}
