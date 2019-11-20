/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package pgp

import (
	"crypto/rand"
	"crypto/rsa"
	_ "crypto/sha256"
	"fmt"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"golang.org/x/crypto/openpgp/packet"
	_ "golang.org/x/crypto/ripemd160"
	"io"
	"os"
	"time"
)

const RSA_BITS = 4096

var (
	// Server private key.
	PrivateKey = (*packet.PrivateKey)(nil)
	// Recipient public key.
	PublicKey = (*packet.PublicKey)(nil)
)

func LoadKey(filename string, private bool) error {
	desc := "public"
	if private {
		desc = "private"
	}

	log.Info("Loading PGP %s key from %s ...", desc, tui.Bold(filename))

	in, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer in.Close()

	block, err := armor.Decode(in)
	if err != nil {
		return err
	}

	if private && block.Type != openpgp.PrivateKeyType {
		return fmt.Errorf("Invalid private key.")
	} else if !private && block.Type != openpgp.PublicKeyType {
		return fmt.Errorf("Invalid public key.")
	}

	reader := packet.NewReader(block.Body)
	pkt, err := reader.Next()
	if err != nil {
		return err
	}

	var ok bool

	if private {
		PrivateKey, ok = pkt.(*packet.PrivateKey)
	} else {
		PublicKey, ok = pkt.(*packet.PublicKey)
	}

	if ok == false {
		return fmt.Errorf("Error parsing public key.")
	}

	return nil
}

func SaveKey(out io.Writer, key *rsa.PrivateKey, private bool) (err error) {
	keyType := openpgp.PrivateKeyType
	if private == false {
		keyType = openpgp.PublicKeyType
	}

	w, err := armor.Encode(out, keyType, make(map[string]string))
	if err != nil {
		return err
	}

	if private {
		pgpKey := packet.NewRSAPrivateKey(time.Now(), key)
		err = pgpKey.Serialize(w)
	} else {
		pgpKey := packet.NewRSAPublicKey(time.Now(), &key.PublicKey)
		err = pgpKey.Serialize(w)
	}

	if err != nil {
		return err
	}

	return w.Close()
}

func GenerateKeys(private, public string) error {
	log.Warning("Generating %d bits RSA key (this may take a few seconds) ...", RSA_BITS)

	key, err := rsa.GenerateKey(rand.Reader, RSA_BITS)
	if err != nil {
		return err
	}

	priv, err := os.Create(private)
	if err != nil {
		return err
	}
	defer priv.Close()

	pub, err := os.Create(public)
	if err != nil {
		return err
	}
	defer pub.Close()

	if err := SaveKey(priv, key, true); err != nil {
		return err
	}

	log.Info("RSA private key saved to %s.", tui.Bold(private))

	if err := SaveKey(pub, key, false); err != nil {
		return err
	}

	log.Info("RSA public key saved to %s.", tui.Bold(public))

	return nil
}
