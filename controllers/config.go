package controllers

import (
	"github.com/evilsocket/vault/config"
	"github.com/gin-gonic/gin"
)

func GetConfig(c *gin.Context) {
	logEvent(c, "Requested configuration.")
	c.JSON(200, config.Conf)
}
