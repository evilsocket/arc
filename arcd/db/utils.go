/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"errors"
	"strconv"
)

var (
	ERR_INVALID_ID       = errors.New("Invalid ID specified.")
	ERR_STORE_NOT_FOUND  = errors.New("Store not found.")
	ERR_RECORD_NOT_FOUND = errors.New("Record not found.")
)

func ToID(value string) (id uint64, err error) {
	return strconv.ParseUint(value, 0, 64)
}
