package controllers

import (
	"github.com/evilsocket/vault/config"
	"github.com/gin-gonic/gin"
)

func GetConfig(c *gin.Context) {
	c.JSON(200, config.Conf)
}
