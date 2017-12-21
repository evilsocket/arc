/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package config

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io/ioutil"
)

const (
	defAddress         = "127.0.0.1"
	defPort            = 8443
	defCertificate     = "arcd-tls-cert.pem"
	defKey             = "arcd-tls-key.pem"
	defDatabaseName    = "arc.db"
	defHMacSecret      = ":°F_WQEùwqeflpùwa.pelfùkepwfùw,koefopwkepfwv"
	defUsername        = "arc"
	defPassword        = "404fcfb394d23199f6d95f1f36bd2beb6df8564f993f44517f6015fcd16101a9"
	defTokenDuration   = 60
	defSchedulerPeriod = 15
	defBackupsEnabled  = false
	defCompression     = true
	defRateLimit       = 60
)

// SMTP configuration.
type SMTPConfig struct {
	Address  string `json:"address"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type KeyPair struct {
	Public  string `json:"public"`
	Private string `json:"private"`
}

// PGP configuration.
type PGPConfig struct {
	Enabled bool    `json:"enabled"`
	Keys    KeyPair `json:"keys"`
}

// Reports configuration.
type rpConfig struct {
	Enabled   bool       `json:"enabled"`
	RateLimit int        `json:"rate_limit"`
	Filter    []string   `json:"filter"`
	To        string     `json:"to"`
	PGP       PGPConfig  `json:"pgp"`
	SMTP      SMTPConfig `json:"smtp"`
}

// Scheduler configuration.
type schConfig struct {
	Enabled bool     `json:"enabled"`
	Period  int      `json:"period"`
	Reports rpConfig `json:"reports"`
}

// Backups configuration.
type bkConfig struct {
	Enabled bool   `json:"enabled"`
	Period  int    `json:"period"`
	Folder  string `json:"folder"`
}

// Arc server configuration.
// swagger:response
type Configuration struct {
	Address       string    `json:"address"`
	Port          int       `json:"port"`
	Certificate   string    `json:"certificate"`
	Key           string    `json:"key"`
	Database      string    `json:"database"`
	Secret        string    `json:"secret"`
	Username      string    `json:"username"`
	Password      string    `json:"password"`
	TokenDuration int       `json:"token_duration"`
	Compression   bool      `json:"compression"`
	CheckExpired  int       `json:"check_expired"`
	Scheduler     schConfig `json:"scheduler"`
	Backups       bkConfig  `json:"backups"`
}

var Conf = Configuration{
	Address:       defAddress,
	Port:          defPort,
	Certificate:   defCertificate,
	Key:           defKey,
	Database:      defDatabaseName,
	Secret:        defHMacSecret,
	Username:      defUsername,
	Password:      defPassword,
	TokenDuration: defTokenDuration,
	Compression:   defCompression,
	Backups: bkConfig{
		Enabled: defBackupsEnabled,
	},
	Scheduler: schConfig{
		Enabled: true,
		Period:  defSchedulerPeriod,
		Reports: rpConfig{
			Enabled:   false,
			RateLimit: defRateLimit,
		},
	},
}

func Load(filename string) error {
	log.Infof("Loading configuration from %s ...", log.Bold(filename))
	raw, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	err = json.Unmarshal(raw, &Conf)
	if err != nil {
		return err
	}

	if Conf.Secret == defHMacSecret {
		return errors.New("HMAC secret not found, please fill the 'secret' configuration field.")
	}

	// fix path
	if Conf.Backups.Folder, err = utils.ExpandPath(Conf.Backups.Folder); err != nil {
		return err
	}

	return nil
}

func (c Configuration) Auth(username, password string) bool {
	if c.Username != username {
		return false
	}

	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:]) == c.Password
}
