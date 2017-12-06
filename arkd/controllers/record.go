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

func ListRecords(c *gin.Context) {
	store_id := c.Params.ByName("id")
	records, err := models.Records(store_id)
	if err != nil {
		logEvent(c, "Requested records of not existing store %s.", store_id)
		c.AbortWithStatus(404)
	} else {
		// logEvent(c, "Requested records of store %s.", store_id)
		c.JSON(200, records)
	}
}

func CreateRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	var record models.Record
	store, err := models.GetStore(store_id)
	if err != nil {
		logEvent(c, "Tried to create a record of a not existing store %s.", store_id)
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		logEvent(c, "Tried to create a corrupted record of the store %s.", store_id)
		c.AbortWithStatus(404)
	} else {
		record.Store = store
		if err := models.Create(&record); err != nil {
			c.AbortWithError(444, err)
		} else {
			logEvent(c, "Created the record %d for the store %s with %d bytes of data encrypted with %s.", record.ID, store_id, len(record.Data), record.Encryption)
			c.JSON(200, record)
		}
	}
}

func GetRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		logEvent(c, "Requested a non existing record %s for store %s.", record_id, store_id)
		c.AbortWithStatus(404)
	} else {
		// logEvent(c, "Requested record %d of store %s.", record.ID, store_id)
		c.JSON(200, record)
	}
}

func DeleteRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		logEvent(c, "Tried to delete a non existing record %s of store %s.", record_id, store_id)
		c.AbortWithStatus(404)
	} else if err := models.Delete(&record); err != nil {
		logEvent(c, "Failed to delete record %s of store %s: %s.", record_id, store_id, err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Deleted record %s of store %s.", record_id, store_id)
		c.JSON(200, gin.H{"msg": "Record deleted."})
	}
}

func UpdateRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		logEvent(c, "Tried to update a non existing record %s of store %s.", record_id, store_id)
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		logEvent(c, "Tried to update the record %s of the store %s with invalid data.", record_id, store_id)
		c.AbortWithStatus(404)
	} else if err := models.Save(&record); err != nil {
		logEvent(c, "Failed to udate record %s of store %s: %s.", record_id, store_id, err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Updated record %s of store %s.", record_id, store_id)
		c.JSON(200, record)
	}
}
