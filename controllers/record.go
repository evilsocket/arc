package controllers

import (
	"github.com/evilsocket/vault/models"
	"github.com/gin-gonic/gin"
)

func ListRecords(c *gin.Context) {
	records, err := models.Records(c.Params.ByName("id"))
	if err != nil {
		logEvent(c, "Requested records of not existing store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Requested records of store %s.", c.Params.ByName("id"))
		c.JSON(200, records)
	}
}

func CreateRecord(c *gin.Context) {
	var record models.Record
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		logEvent(c, "Tried to create a record of a not existing store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		logEvent(c, "Tried to create a corrupted record of the store %s.", c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else {
		record.Store = store
		if err := models.Create(&record); err != nil {
			c.AbortWithError(444, err)
		} else {
			logEvent(c, "Created the record %d for the store %s with %d bytes of data encrypted with %s.", record.ID, c.Params.ByName("id"), len(record.Data), record.Encryption)
			c.JSON(200, record)
		}
	}
}

func GetRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		logEvent(c, "Requested a non existing record %s for store %s.", c.Params.ByName("r_id"), c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Requested record %d of store %s.", record.ID, c.Params.ByName("id"))
		c.JSON(200, record)
	}
}

func DeleteRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		logEvent(c, "Tried to delete a non existing record %s of store %s.", c.Params.ByName("r_di"), c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := models.Delete(&record); err != nil {
		logEvent(c, "Failed to delete record %s of store %s: %s.", c.Params.ByName("r_di"), c.Params.ByName("id"), err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Deleted record %s of store %s.", c.Params.ByName("r_di"), c.Params.ByName("id"))
		c.JSON(200, gin.H{"msg": "Record deleted."})
	}
}

func UpdateRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		logEvent(c, "Tried to update a non existing record %s of store %s.", c.Params.ByName("r_di"), c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		logEvent(c, "Tried to update the record %s of the store %s with invalid data.", c.Params.ByName("r_di"), c.Params.ByName("id"))
		c.AbortWithStatus(404)
	} else if err := models.Save(&record); err != nil {
		logEvent(c, "Failed to udate record %s of store %s: %s.", c.Params.ByName("r_di"), c.Params.ByName("id"), err)
		c.AbortWithStatus(404)
	} else {
		logEvent(c, "Updated record %s of store %s.", c.Params.ByName("r_di"), c.Params.ByName("id"))
		c.JSON(200, record)
	}
}
