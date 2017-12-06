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
		jNotFound(c)
	} else {
		// logEvent(c, "Requested stores.")
		c.JSON(200, stores)
	}
}

func CreateStore(c *gin.Context) {
	var store models.Store
	if err := c.BindJSON(&store); err != nil {
		jBadRequest(c)
	} else if err := models.Create(&store); err != nil {
		jServerError(c, err)
	} else {
		logEvent(c, "Created store %d.", store.ID)
		c.JSON(200, store)
	}
}

func GetStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		jNotFound(c)
	} else {
		// logEvent(c, "Requested store %s.", c.Params.ByName("id"))
		c.JSON(200, store)
	}
}

func DeleteStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		jNotFound(c)
	} else if err := models.Delete(&store); err != nil {
		jServerError(c, err)
	} else {
		logEvent(c, "Deleted store %s.", c.Params.ByName("id"))
		c.JSON(200, gin.H{"msg": "Store deleted."})
	}
}

func UpdateStore(c *gin.Context) {
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		jNotFound(c)
	} else if err := c.BindJSON(&store); err != nil {
		jBadRequest(c)
	} else if err := models.Save(&store); err != nil {
		jServerError(c, err)
	} else {
		logEvent(c, "Updated store %s.", c.Params.ByName("id"))
		c.JSON(200, gin.H{"msg": "Store updated."})
	}
}
