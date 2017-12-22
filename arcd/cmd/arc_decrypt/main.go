/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package main

import (
	"compress/gzip"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"flag"
	"fmt"
	"github.com/evilsocket/arc/arcd/db"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"golang.org/x/crypto/pbkdf2"
	"io"
	"os"
	"path"
	"path/filepath"
	"unicode/utf8"
)

var (
	basePath        = ""
	key             = ""
	authMessage     = "Thanks to JP Aumasson > https://twitter.com/veorq/status/943506635317825536/////////////////////////////////////////////////////"
	saltSize        = int64(16)
	ivSize          = int64(16)
	pbkdfIterations = int(10000)
)

func init() {
	flag.StringVar(&basePath, "record", "", "Path containing the data and meta.json files of the basePath to decrypt.")
	flag.StringVar(&key, "key", "", "Decryption key.")

	flag.Int64Var(&saltSize, "salt-size", saltSize, "Salt size.")
	flag.Int64Var(&ivSize, "iv-size", ivSize, "IV size.")
	flag.IntVar(&pbkdfIterations, "iterations", pbkdfIterations, "PBKDF2 iterations.")
}

func main() {
	var err error
	flag.Parse()

	basePath, err := filepath.Abs(basePath)
	if err != nil {
		log.Fatal(err)
	}

	metaFile := path.Join(basePath, "meta.json")
	dataFile := path.Join(basePath, "data")

	if utils.Exists(metaFile) == false {
		log.Fatal(fmt.Errorf("File %s not found.", metaFile))
	} else if utils.Exists(dataFile) == false {
		log.Fatal(fmt.Errorf("File %s not found.", dataFile))
	}

	log.Infof("Decrypting record %s ...", log.Bold(basePath))

	meta, err := db.OpenMeta(metaFile)
	if err != nil {
		log.Fatal(err)
	}

	if meta.Encryption != "aes" {
		log.Fatal(fmt.Errorf("This tool only supports AES256 encrypted records."))
	}

	log.Infof("")

	log.Infof("(%d) %s", meta.Id, log.Bold(meta.Title))
	log.Infof("Created: %s", meta.CreatedAt)
	if meta.Compressed {
		log.Infof("Compression: %s", log.Bold("on"))
	} else {
		log.Infof("Compression: %s", "off")
	}
	log.Infof("Size: %s ( %d B )", utils.FormatBytes(meta.Size), meta.Size)
	log.Infof("")

	if meta.Compressed {
		tmpFile := "/tmp/data.tmp"
		log.Infof("Decompressing %s to %s ...", log.Bold(dataFile), tmpFile)

		in, err := os.Open(dataFile)
		if err != nil {
			log.Fatal(err)
		}
		defer in.Close()

		reader, err := gzip.NewReader(in)
		if err != nil {
			log.Fatal(err)
		}

		out, err := os.Create(tmpFile)
		if err != nil {
			log.Fatal(err)
		}
		defer out.Close()

		if written, err := io.Copy(out, reader); err != nil {
			log.Fatal(err)
		} else {
			log.Infof("Extracted file is %s ( %d B ).", utils.FormatBytes(uint64(written)), written)
		}

		dataFile = tmpFile
	}

	err, fileSize := utils.FileSize(dataFile)
	if err != nil {
		log.Fatal(err)
	}

	log.Infof("Decrypting %s ...", log.Bold(dataFile))
	in, err := os.Open(dataFile)
	if err != nil {
		log.Fatal(err)
	}
	defer in.Close()

	file := make([]byte, fileSize)
	read, err := io.ReadFull(in, file[:])
	if err != nil {
		log.Fatal(err)
	}

	/*
	 * Needed for converting javascript binary strings to golang strings.
	 */
	buffer := make([]rune, 0)
	sfile := string(file)
	for len(sfile) > 0 {
		r, size := utf8.DecodeRuneInString(sfile)
		buffer = append(buffer, r)
		sfile = sfile[size:]
		l := len(sfile)

		if l%1000 == 0 {
			log.Infof("size: %d", l)
		}
	}
	file = []byte(string(buffer))

	log.Infof("Read %d bytes of file.", read)
	log.Infof("runes %d", utf8.RuneCountInString(string(file)))

	salt := file[0:saltSize]
	iv := file[saltSize : saltSize+ivSize]
	cipherText := file[saltSize+ivSize:]

	cipherSize := fileSize - ivSize - saltSize
	derivedKey := pbkdf2.Key([]byte(key), salt, pbkdfIterations, 32, sha256.New)
	authData := []byte(authMessage)

	log.Infof("")
	log.Infof("SALT : %X", salt)
	log.Infof("IV   : %X", iv)
	log.Infof("KEY  : %X", derivedKey)
	log.Infof("")
	log.Infof("Decrypting ciphertext of %s ( %d B ) ...", utils.FormatBytes(uint64(cipherSize)), cipherSize)

	block, _ := aes.NewCipher(derivedKey)
	gcm, _ := cipher.NewGCMWithNonceSize(block, int(ivSize))

	plain, err := gcm.Open(nil, iv, cipherText, authData)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\n%s\n", string(plain))
}
