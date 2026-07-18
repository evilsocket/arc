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
	"os"
	"path/filepath"
	"testing"
)

func writeTar(t *testing.T, filename string, entries map[string][]byte) {
	t.Helper()

	f, err := os.Create(filename)
	if err != nil {
		t.Fatalf("could not create tar: %s", err)
	}
	defer f.Close()

	tw := tar.NewWriter(f)
	defer tw.Close()

	for name, data := range entries {
		hdr := &tar.Header{
			Name:     name,
			Size:     int64(len(data)),
			Mode:     0644,
			Typeflag: tar.TypeReg,
		}
		if err := tw.WriteHeader(hdr); err != nil {
			t.Fatalf("could not write header: %s", err)
		}
		if _, err := tw.Write(data); err != nil {
			t.Fatalf("could not write data: %s", err)
		}
	}
}

// TestImportRejectsPathTraversal ensures a malicious archive containing a
// "../" entry cannot write outside of the database directory (CWE-22).
func TestImportRejectsPathTraversal(t *testing.T) {
	tmp := t.TempDir()
	dbDir := filepath.Join(tmp, "store")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		t.Fatalf("could not create db dir: %s", err)
	}

	// point the package-level index at our temporary database directory
	dbIndex = &Index{path: dbDir}

	escapeTarget := filepath.Join(tmp, "escaped.txt")
	archive := filepath.Join(tmp, "malicious.tar")
	writeTar(t, archive, map[string][]byte{
		"../escaped.txt": []byte("PWNED"),
	})

	if err := Import(archive); err == nil {
		t.Fatalf("expected import to reject path traversal, got nil error")
	}

	if _, err := os.Stat(escapeTarget); !os.IsNotExist(err) {
		t.Fatalf("path traversal succeeded: %s was written outside the db dir", escapeTarget)
	}
}

// TestImportAcceptsLegitimateEntries ensures the traversal guard does not
// break normal, well-formed archives.
func TestImportAcceptsLegitimateEntries(t *testing.T) {
	tmp := t.TempDir()
	dbDir := filepath.Join(tmp, "store")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		t.Fatalf("could not create db dir: %s", err)
	}

	dbIndex = &Index{path: dbDir}

	archive := filepath.Join(tmp, "good.tar")
	writeTar(t, archive, map[string][]byte{
		"data.json": []byte("test"),
	})

	if err := Import(archive); err != nil {
		t.Fatalf("expected import to succeed, got: %s", err)
	}

	got, err := os.ReadFile(filepath.Join(dbDir, "data.json"))
	if err != nil {
		t.Fatalf("expected file to be extracted: %s", err)
	}
	if string(got) != "test" {
		t.Fatalf("unexpected contents: %q", string(got))
	}
}
