package controllers

import (
	"github.com/evilsocket/vault/models"
	"github.com/gin-gonic/gin"
)

func ListRecords(c *gin.Context) {
	records, err := models.Records(c.Params.ByName("id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, records)
	}
}

func CreateRecord(c *gin.Context) {
	var record models.Record
	store, err := models.GetStore(c.Params.ByName("id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		c.AbortWithStatus(404)
	} else {
		record.Store = store
		if err := models.Create(&record); err != nil {
			c.AbortWithError(444, err)
		} else {
			c.JSON(200, record)
		}
	}
}

func GetRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, record)
	}
}

func DeleteRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else if err := models.Delete(&record); err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, gin.H{"msg": "Record deleted."})
	}
}

func UpdateRecord(c *gin.Context) {
	record, err := models.GetRecord(c.Params.ByName("id"), c.Params.ByName("r_id"))
	if err != nil {
		c.AbortWithStatus(404)
	} else if err := c.BindJSON(&record); err != nil {
		c.AbortWithStatus(404)
	} else if err := models.Save(&record); err != nil {
		c.AbortWithStatus(404)
	} else {
		c.JSON(200, gin.H{"msg": "Record updated."})
	}
}
