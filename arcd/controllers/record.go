/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/models"
	"github.com/evilsocket/arc/arcd/utils"
	"github.com/gin-gonic/gin"
)

func ListRecords(c *gin.Context) {
	store_id := c.Params.ByName("id")
	records, err := models.Records(store_id)
	if err != nil {
		utils.NotFound(c)
	} else {
		log.Api(log.DEBUG, c, "Requested records of store %s.", store_id)
		c.JSON(200, records)
	}
}

func CreateRecord(c *gin.Context) {
	var record models.Record

	store_id := c.Params.ByName("id")
	store, err := models.GetStore(store_id)

	if err != nil {
		utils.NotFound(c)
	} else if err := c.BindJSON(&record); err != nil {
		utils.BadRequest(c)
	} else {
		record.Store = store
		record.Buffer = models.NewBuffer(record.Encryption, record.Data)

		if err := models.Create(&record); err != nil {
			utils.ServerError(c, err)
		} else {
			log.Api(log.INFO, c,
				"Created record %d (store %s) with %s of %s encrypted data.",
				record.ID,
				store_id,
				utils.FormatBytes(record.Size),
				record.Encryption)
			c.JSON(200, record)
		}
	}
}

func GetRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
	} else {
		log.Api(log.DEBUG, c, "Requested record %d of store %s.", record.ID, store_id)
		c.JSON(200, record)
	}
}

func GetRecordBuffer(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	buffer, err := models.GetBuffer(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
	} else {
		size := uint64(len(buffer.Data))
		log.Api(log.DEBUG, c, "Streaming %s of buffer %d.", utils.FormatBytes(size), buffer.ID)
		c.Data(200, "application/octect-stream", []byte(buffer.Data))
	}
}

func DeleteRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
	} else if err := models.Delete(&record); err != nil {
		utils.ServerError(c, err)
	} else {
		log.Api(log.INFO, c, "Deleted record %s of store %s.", record_id, store_id)
		c.JSON(200, gin.H{"msg": "Record deleted."})
	}
}

func UpdateRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := models.GetRecord(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
	} else if err := c.BindJSON(&record); err != nil {
		utils.BadRequest(c)
	}

	record.Buffer = models.NewBuffer(record.Encryption, record.Data)
	if err := models.Save(&record); err != nil {
		utils.ServerError(c, err)
	} else {
		log.Api(log.INFO, c, "Updated record %s of store %s.", record_id, store_id)
		c.JSON(200, record)
	}
}
