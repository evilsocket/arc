package controllers

import (
	"github.com/evilsocket/vault/config"
	"github.com/evilsocket/vault/middlewares"
	"github.com/gin-gonic/gin"
)

type AuthRequest struct {
	Username string `json:"user"`
	Password string `json:"password"`
}

func Auth(c *gin.Context) {
	var auth AuthRequest

	if err := c.BindJSON(&auth); err != nil {
		c.AbortWithStatus(444)
		return
	} else if auth.Username != config.Conf.Username || auth.Password != config.Conf.Password {
		c.AbortWithStatus(403)
		return
	}

	token, err := middlewares.GenerateToken([]byte(config.Conf.Secret), auth.Username)
	if err != nil {
		panic(err)
	}
	c.JSON(200, gin.H{"token": token})
}
