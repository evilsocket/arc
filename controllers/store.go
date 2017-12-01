package controllers

import (
	"github.com/evilsocket/gosafe/models"
	"github.com/gin-gonic/gin"
)

func ListStores(c *gin.Context) {
	stores, err := models.Stores()
	if err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, stores)
	}
}

func CreateStore(c *gin.Context) {
	var store models.Store
	if err := c.BindJSON(&store); err != nil {
		c.AbortWithStatus(404)
	} else if err := models.Create(&store); err != nil {
		c.AbortWithError(444, err)
	} else {
		c.JSON(200, store)
	}
}

func GetStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, store)
	}
}

func DeleteStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else if err := models.Delete(&store); err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, gin.H{"msg": "Store deleted."})
	}
}

func UpdateStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&store); err != nil {
		c.AbortWithStatus(404)
	} else if err := models.Save(&store); err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, gin.H{"msg": "Store updated."})
	}
}
