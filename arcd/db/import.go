/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io/ioutil"
)

func Import(filename string) error {
	var stores []ExportedStore
	var buffer []byte
	var err error

	if buffer, err = ioutil.ReadFile(filename); err != nil {
		return err
	}

	log.Infof("Read %d bytes from %s ...", len(buffer), filename)

	if err = json.Unmarshal(buffer, &stores); err != nil {
		return err
	}

	log.Infof("Importing %d stores ...", len(stores))

	Lock()
	defer Unlock()

	for _, store := range stores {
		ms := Meta{
			Id:        store.ID,
			Title:     store.Title,
			CreatedAt: store.CreatedAt,
			UpdatedAt: store.UpdatedAt,
		}
		log.Infof("Creating store %d:'%s' ...", store.ID, store.Title)
		new_store, err := Create(&ms)
		if err != nil {
			return err
		}

		nstore, _ := dbIndex.records[new_store.Id]
		for _, er := range store.Records {
			// log.Debugf("nstore = %v", nstore)
			meta := Meta{
				Id:         er.ID,
				Title:      er.Title,
				Encryption: er.Buffer.Encryption,
				CreatedAt:  er.CreatedAt,
				UpdatedAt:  er.UpdatedAt,
				ExpiredAt:  er.ExpiredAt,
				Prune:      er.Prune,
			}

			data := er.Buffer.Data
			if er.Buffer.Compressed {
				log.Debugf("Decompressing %s of data ...", utils.FormatBytes(uint64(len(data))))

				rdata := bytes.NewReader(data)
				reader, _ := gzip.NewReader(rdata)
				data, _ = ioutil.ReadAll(reader)
			}

			log.Infof("Creating record %d:'%s' of %s ...", meta.Id, meta.Title, utils.FormatBytes(uint64(len(data))))
			reader := bytes.NewReader(data)
			_, err := nstore.New(&meta, reader)
			if err != nil {
				return err
			}
		}

		nstore.Close()
	}

	return nil
}
