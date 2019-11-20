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
)

func Import(filename string) error {
	log.Info("Importing %s into %s ...", filename, dbIndex.path)

	in, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer in.Close()

	archiver := tar.NewReader(in)
	for {
		header, err := archiver.Next()
		switch {
		// if no more files are found return
		case err == io.EOF:
			return nil
			// return any other error
		case err != nil:
			return err
			// if the header is nil, just skip it (not sure how this happens)
		case header == nil:
			continue
		}

		// the target location where the dir/file should be created
		target := filepath.Join(dbIndex.path, header.Name)
		log.Info("Creating %s ...", target)

		// check the file type
		switch header.Typeflag {
		// if its a dir and it doesn't exist create it
		case tar.TypeDir:
			if _, err := os.Stat(target); err != nil {
				if err := os.MkdirAll(target, 0755); err != nil {
					return err
				}
			}

			// if it's a file create it
		case tar.TypeReg:
			f, err := os.OpenFile(target, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
			defer f.Close()

			// copy over contents
			if _, err := io.Copy(f, archiver); err != nil {
				return err
			}
		}
	}
}
