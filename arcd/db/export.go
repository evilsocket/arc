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
	"github.com/evilsocket/arc/arcd/log"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func Export(filename string) error {
	log.Importantf("Exporting %d stores from %s ...", dbIndex.NumRecords(), dbIndex.path)

	out, err := os.Create(filename)
	if err != nil {
		return nil
	}

	tw := tar.NewWriter(out)
	defer tw.Close()

	Lock()
	defer Unlock()

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

		log.Debugf("Writing header for '%s'", header.Name)
		// write the header
		if err := tw.WriteHeader(header); err != nil {
			return err
		}

		// return on non-regular files
		if !fi.Mode().IsRegular() {
			return nil
		}

		log.Debugf("Writing contents for %s ...", file)
		// open files for taring
		f, err := os.Open(file)
		defer f.Close()
		if err != nil {
			return err
		}

		// copy file data into tar writer
		if _, err := io.Copy(tw, f); err != nil {
			return err
		}

		return nil
	})
}
