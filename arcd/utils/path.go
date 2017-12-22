/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package utils

import (
	"os"
	"os/user"
	"path/filepath"
	"strings"
)

func Exists(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func FileSize(filename string) (error, int64) {
	s, e := os.Stat(filename)
	if e != nil {
		return e, 0
	}
	return nil, s.Size()
}

func ExpandPath(path string) (string, error) {
	if strings.HasPrefix(path, "~") {
		usr, err := user.Current()
		if err != nil {
			return "", err
		}
		path = strings.Replace(path, "~", usr.HomeDir, -1)
	}
	return filepath.Abs(path)
}
