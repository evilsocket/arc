package controllers

import (
	"fmt"
	"github.com/evilsocket/vault/vaultd/config"
	"github.com/evilsocket/vault/vaultd/middlewares"
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
		logEvent(c, "Invalid auth request.")
		c.AbortWithStatus(444)
		return
	} else if auth.Username != config.Conf.Username || auth.Password != config.Conf.Password {
		logEvent(c, "Invalid auth credentials: %s.", auth)
		c.AbortWithStatus(403)
		return
	}

	token, err := middlewares.GenerateToken([]byte(config.Conf.Secret), auth.Username)
	if err != nil {
		logEvent(c, "Error generating token: %s.", err)
		panic(err)
	}

	logEvent(c, "User '%s' requested new API token (will expire in %d minutes).", auth.Username, config.Conf.TokenDuration)
	c.JSON(200, gin.H{"token": token})
}
