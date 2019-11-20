/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package db

import (
	"archive/tar"
	"github.com/evilsocket/islazy/log"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func Export(filename string) error {
	Lock()
	defer Unlock()

	log.Warning("Exporting %d stores from %s ...", dbIndex.NumRecords(), dbIndex.path)

	out, err := os.Create(filename)
	if err != nil {
		return nil
	}

	archiver := tar.NewWriter(out)
	defer archiver.Close()

	return filepath.Walk(dbIndex.path, func(file string, fi os.FileInfo, err error) error {
		// return on any error
		if err != nil {
			return err
		}

		// create a new dir/file header
		header, err := tar.FileInfoHeader(fi, fi.Name())
		if err != nil {
			return err
		}

		// update the name to correctly reflect the desired destination when untaring
		header.Name = strings.TrimPrefix(strings.Replace(file, dbIndex.path, "", -1), string(filepath.Separator))

		if err := archiver.WriteHeader(header); err != nil {
			return err
		}

		// return on non-regular files
		if !fi.Mode().IsRegular() {
			return nil
		}

		log.Debug("Writing contents for %s ...", file)
		f, err := os.Open(file)
		if err != nil {
			return err
		}
		defer f.Close()

		// copy file data into tar writer
		if _, err := io.Copy(archiver, f); err != nil {
			return err
		}

		return nil
	})
}
