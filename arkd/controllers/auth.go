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
	"github.com/evilsocket/ark/arkd/config"
	"github.com/evilsocket/ark/arkd/middlewares"
	"github.com/gin-gonic/gin"
)

type AuthRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (auth AuthRequest) String() string {
	return fmt.Sprintf("username='%s' password='%s'", auth.Username, auth.Password)
}

func Auth(c *gin.Context) {
	var auth AuthRequest

	if err := c.BindJSON(&auth); err != nil {
		jBadRequest(c)
	} else if auth.Username != config.Conf.Username || auth.Password != config.Conf.Password {
		jForbidden(c)
	} else if token, err := middlewares.GenerateToken([]byte(config.Conf.Secret), auth.Username); err != nil {
		jServerError(c, err)
	} else {
		logEvent(c, "User '%s' requested new API token (will expire in %d minutes).", auth.Username, config.Conf.TokenDuration)
		c.JSON(200, gin.H{"token": token})
	}
}
