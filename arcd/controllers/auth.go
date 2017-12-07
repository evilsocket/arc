/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/middlewares"
	"github.com/evilsocket/arc/arcd/utils"
	"github.com/gin-gonic/gin"
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

	if err := c.BindJSON(&auth); err != nil {
		utils.BadRequest(c)
	} else if auth.Username != config.Conf.Username || auth.Password != config.Conf.Password {
		utils.Forbidden(c)
	} else if token, err := middlewares.GenerateToken([]byte(config.Conf.Secret), auth.Username); err != nil {
		utils.ServerError(c, err)
	} else {
		log.Api(log.INFO, c, "User %s requested new API token", log.Bold(auth.Username))
		c.JSON(200, gin.H{"token": token})
	}
}
