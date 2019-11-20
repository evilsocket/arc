/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package tls

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"io/ioutil"
	"math/big"
	"os"
	"time"
)

func Generate(conf *config.Configuration) error {
	keyfile, err := os.Create(conf.Key)
	if err != nil {
		return err
	}
	defer keyfile.Close()

	certfile, err := os.Create(conf.Certificate)
	if err != nil {
		return err
	}
	defer certfile.Close()

	log.Debug("Generating RSA key ...")

	priv, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return err
	}

	log.Debug("Creating X509 certificate ...")

	notBefore := time.Now()
	notAfter := notBefore.Add(time.Duration(24*365) * time.Hour)
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return err
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			CommonName:         "Arc Server",
			Organization:       []string{"Arc Project"},
			OrganizationalUnit: []string{"RSA key generation module"},
		},
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	cert_raw, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return err
	}

	log.Warning("Saving key to %s ...", tui.Bold(conf.Key))
	if err := pem.Encode(keyfile, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(priv)}); err != nil {
		return err
	}

	log.Warning("Saving certificate to %s ...", tui.Bold(conf.Certificate))
	return pem.Encode(certfile, &pem.Block{Type: "CERTIFICATE", Bytes: cert_raw})
}

func Fingerprint(filename string) (string, error) {
	contents, err := ioutil.ReadFile(filename)
	if err != nil {
		return "", err
	}

	var block *pem.Block
	for len(contents) > 0 {
		block, contents = pem.Decode(contents)
		if block == nil {
			break
		}

		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return "", err
		}

		digest := sha256.Sum256(cert.RawSubjectPublicKeyInfo)
		return base64.StdEncoding.EncodeToString(digest[:]), nil
	}

	return "", errors.New("No PEM block found.")
}
