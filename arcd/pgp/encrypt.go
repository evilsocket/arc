/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package pgp

import (
	"bytes"
	"crypto"
	_ "crypto/sha256"
	"fmt"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"golang.org/x/crypto/openpgp/packet"
	_ "golang.org/x/crypto/ripemd160"
	"io"
	"strings"
)

func createEntity() *openpgp.Entity {
	config := packet.Config{
		DefaultHash:            crypto.SHA256,
		DefaultCipher:          packet.CipherAES256,
		DefaultCompressionAlgo: packet.CompressionZLIB,
		CompressionConfig: &packet.CompressionConfig{
			Level: 9,
		},
		RSABits: RSA_BITS,
	}
	currentTime := config.Now()
	uid := packet.NewUserId("", "", "")

	e := openpgp.Entity{
		PrimaryKey: PublicKey,
		PrivateKey: PrivateKey,
		Identities: make(map[string]*openpgp.Identity),
	}
	isPrimaryId := false

	e.Identities[uid.Id] = &openpgp.Identity{
		Name:   uid.Name,
		UserId: uid,
		SelfSignature: &packet.Signature{
			CreationTime: currentTime,
			SigType:      packet.SigTypePositiveCert,
			PubKeyAlgo:   packet.PubKeyAlgoRSA,
			Hash:         config.Hash(),
			IsPrimaryId:  &isPrimaryId,
			FlagsValid:   true,
			FlagSign:     true,
			FlagCertify:  true,
			IssuerKeyId:  &e.PrimaryKey.KeyId,
		},
	}

	keyLifetimeSecs := uint32(86400 * 365)

	e.Subkeys = make([]openpgp.Subkey, 1)
	e.Subkeys[0] = openpgp.Subkey{
		PublicKey:  PublicKey,
		PrivateKey: PrivateKey,
		Sig: &packet.Signature{
			CreationTime:              currentTime,
			SigType:                   packet.SigTypeSubkeyBinding,
			PubKeyAlgo:                packet.PubKeyAlgoRSA,
			Hash:                      config.Hash(),
			PreferredHash:             []uint8{8}, // SHA-256
			FlagsValid:                true,
			FlagEncryptStorage:        true,
			FlagEncryptCommunications: true,
			IssuerKeyId:               &e.PrimaryKey.KeyId,
			KeyLifetimeSecs:           &keyLifetimeSecs,
		},
	}
	return &e
}

func EncryptStream(r io.Reader, w io.Writer) error {
	if PrivateKey == nil || PublicKey == nil {
		return fmt.Errorf("One or both PGP keys has not been loaded.")
	}

	armorer, err := armor.Encode(w, "PGP MESSAGE", make(map[string]string))
	if err != nil {
		return err
	}

	toEntity := createEntity()
	crypter, err := openpgp.Encrypt(armorer, []*openpgp.Entity{toEntity}, nil, nil, nil)
	if err != nil {
		return err
	}

	_, err = io.Copy(crypter, r)
	if err != nil {
		return err
	}

	crypter.Close()
	armorer.Close()

	return nil
}

func Encrypt(message string) (err error, ciphertext string) {
	writer := new(bytes.Buffer)
	reader := strings.NewReader(message)

	if err := EncryptStream(reader, writer); err != nil {
		return err, ""
	}

	return nil, writer.String()
}
