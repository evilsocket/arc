/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/ark/arkd/models"
	"github.com/gin-gonic/gin"
)

func ListStores(c *gin.Context) {
	stores, err := models.Stores()
	if err != nil {
		logEvent(c, "Error requesting stores: %s.", err)
		c.AbortWithStatus(404)
	} else {
		// logEvent(c, "Requested stores.")
		c.JSON(200, stores)
	}
}

func CreateStore(c *gin.Context) {
	var store models.Store
	if err := c.BindJSON(&store); err != nil {
		logEvent(c, "Tried to create store with bad data: %s.", err)
		c.AbortWithStatus(404)
	} else if err := models.Create(&store); err != nil {
		logEvent(c, "Failed to create store: %s.", err)
		c.AbortWithError(444, err)
	} else {
		logEvent(c, "Created store %d.", store.ID)
		c.JSON(200, store)
	}
}

func GetStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		logEvent(c, "Requested not existing store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else {
		// logEvent(c, "Requested store %s.", c.Params.ByName("id"))
		c.JSON(200, store)
	}
}

func DeleteStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		logEvent(c, "Tried to delete not existing store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := models.Delete(&store); err != nil {
		logEvent(c, "Failed to delete store %s: %s.", c.Params.ByName("id"), err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Deleted store %s.", c.Params.ByName("id"))
		c.JSON(200, gin.H{"msg": "Store deleted."})
	}
}

func UpdateStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		logEvent(c, "Tried to update not existing store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&store); err != nil {
		logEvent(c, "Tried to update store %s with bad data: %s.", c.Params.ByName("id"), err)
		c.AbortWithStatus(404)
	} else if err := models.Save(&store); err != nil {
		logEvent(c, "Failed to update store %s: %s.", c.Params.ByName("id"), err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Updated store %s.", c.Params.ByName("id"))
		c.JSON(200, gin.H{"msg": "Store updated."})
	}
}
