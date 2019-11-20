/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/arc/utils"
	"github.com/gin-gonic/gin"
)

func ListRecords(c *gin.Context) {
	store_id := c.Params.ByName("id")
	records, err := db.Records(store_id)
	if err != nil {
		utils.NotFound(c)
	} else {
		utils.Api(log.DEBUG, c, "Requested records of store %s.", store_id)
		c.JSON(200, records)
	}
}

func CreateRecord(c *gin.Context) {
	var meta db.Meta
	store_id := c.Params.ByName("id")
	store, err := db.GetStore(store_id)
	if err != nil {
		utils.NotFound(c)
		return
	}

	reader, _, err := c.Request.FormFile("data")
	if err != nil {
		utils.BadRequest(c)
		return
	}

	raw := c.Request.Form.Get("meta")
	nbytes := int64(len(raw))
	if nbytes > config.Conf.MaxReqSize {
		log.Warning("Request meta field is %d bytes, while max request size is %d.", nbytes, config.Conf.MaxReqSize)
		utils.BadRequest(c)
		return
	}

	err = json.Unmarshal([]byte(raw), &meta)
	if err != nil {
		utils.BadRequest(c)
		return
	}

	record, err := store.New(&meta, reader)
	if err != nil {
		utils.ServerError(c, err)
	}

	utils.Api(log.DEBUG, c,
		"Created record %d (store %s) with %s of %s encrypted data.",
		record.Id(),
		store_id,
		utils.FormatBytes(record.Size()),
		record.Encryption())
	c.JSON(200, record.Meta())
}

func GetRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := db.GetRecordMeta(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
	} else {
		utils.Api(log.DEBUG, c, "Requested record %d of store %s.", record.Id, store_id)
		c.JSON(200, record)
	}
}

func GetRecordBuffer(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	record, err := db.GetRecord(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
		return
	}

	datapath := record.DataPath()
	if utils.Exists(datapath) == false {
		utils.NotFound(c)
	} else {
		meta := record.Meta()
		desc := ""
		if meta.Compressed {
			desc = "compressed "
		}

		log.Debug("Streaming %s (%d b) of %sbuffer to %s.", utils.FormatBytes(meta.Size), meta.Size, desc, c.Request.RemoteAddr)

		// Let the client handle the decompression :P
		if meta.Compressed {
			c.Writer.Header().Set("Content-Encoding", "gzip")
			c.Writer.Header().Set("Content-Type", "application/octet-stream")
			c.Writer.Header().Set("Vary", "Accept-Encoding")
		}

		c.Writer.Header().Set("Content-Length", fmt.Sprintf("%d", meta.Size))
		c.File(datapath)
	}
}

func DeleteRecord(c *gin.Context) {
	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")
	store, err := db.GetStore(store_id)

	if err != nil {
		utils.NotFound(c)
		return
	}

	id, err := db.ToID(record_id)
	if err != nil {
		utils.BadRequest(c)
	} else if _, err = store.Del(id); err != nil {
		utils.NotFound(c)
	} else {
		utils.Api(log.DEBUG, c, "Deleted record %s of store %s.", record_id, store_id)
		c.JSON(200, gin.H{"msg": "Record deleted."})
	}
}

func UpdateRecord(c *gin.Context) {
	var meta db.Meta

	store_id := c.Params.ByName("id")
	record_id := c.Params.ByName("r_id")

	record, err := db.GetRecord(store_id, record_id)
	if err != nil {
		utils.NotFound(c)
		return
	}

	reader, _, err := c.Request.FormFile("data")
	if err != nil {
		utils.BadRequest(c)
		return
	}

	raw := c.Request.Form.Get("meta")
	nbytes := int64(len(raw))
	if nbytes > config.Conf.MaxReqSize {
		log.Warning("Request meta field is %d bytes, while max request size is %d.", nbytes, config.Conf.MaxReqSize)
		utils.BadRequest(c)
		return
	}

	err = json.Unmarshal([]byte(raw), &meta)
	if err != nil {
		utils.BadRequest(c)
		return
	}

	err = record.Update(&meta)
	if err != nil {
		utils.ServerError(c, err)
		return
	}

	err = record.UpdateBuffer(reader)
	if err != nil {
		utils.ServerError(c, err)
		return
	}

	store, _ := db.GetStore(store_id)
	store.MarkUpdated()

	utils.Api(log.DEBUG, c, "Updated record %s of store %s.", record_id, store_id)
	c.JSON(200, record.Meta())
}
