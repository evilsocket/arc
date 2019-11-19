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

// Exists returns if a path to a file or directory exist or not
func Exists(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func IsFolder(path string) bool {
	stat, err := os.Stat(path)
	if err != nil {
		return false
	}
	return stat.IsDir()
}

// ExpandPath return Absolute path
// replace ~ by the path to home directory
func ExpandPath(path string) (string, error) {
	// Check if path is empty
	if path != "" {
		if strings.HasPrefix(path, "~") {
			usr, err := user.Current()
			if err != nil {
				return "", err
			}
			// Replace only the first occurence of ~
			path = strings.Replace(path, "~", usr.HomeDir, 1)
		}
		return filepath.Abs(path)
	}
	return "", nil
}
