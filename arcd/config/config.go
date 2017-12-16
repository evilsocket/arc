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
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io/ioutil"
)

const (
	defAddress         = "127.0.0.1"
	defPort            = 8080
	defDatabaseName    = "arc.db"
	defHMacSecret      = ":°F_WQEùwqeflpùwa.pelfùkepwfùw,koefopwkepfwv"
	defUsername        = "arc"
	defPassword        = "arc"
	defTokenDuration   = 60
	defSchedulerPeriod = 15
	defBackupsEnabled  = false
	defCompression     = true
)

// Server TLS configuration.
type tlsConfig struct {
	Enabled     bool   `json:"enabled"`
	Certificate string `json:"certificate"`
	Key         string `json:"key"`
}

// SMTP configuration.
type SMTPConfig struct {
	Address  string `json:"address"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// Reports configuration.
type rpConfig struct {
	Enabled bool       `json:"enabled"`
	Filter  []string   `json:"filter"`
	To      string     `json:"to"`
	SMTP    SMTPConfig `json:"smtp"`
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
	Database      string    `json:"database"`
	Secret        string    `json:"secret"`
	Username      string    `json:"username"`
	Password      string    `json:"password"`
	TokenDuration int       `json:"token_duration"`
	Compression   bool      `json:"compression"`
	CheckExpired  int       `json:"check_expired"`
	Scheduler     schConfig `json:"scheduler"`
	Backups       bkConfig  `json:"backups"`
	TLS           tlsConfig `json:"tls"`
}

var Conf = Configuration{
	Address:       defAddress,
	Port:          defPort,
	Database:      defDatabaseName,
	Secret:        defHMacSecret,
	Username:      defUsername,
	Password:      defPassword,
	TokenDuration: defTokenDuration,
	Compression:   defCompression,
	TLS: tlsConfig{
		Enabled: false,
	},
	Backups: bkConfig{
		Enabled: defBackupsEnabled,
	},
	Scheduler: schConfig{
		Enabled: true,
		Period:  defSchedulerPeriod,
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
