/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package config

import (
	"encoding/json"
	"errors"
	"github.com/evilsocket/arc/utils"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"golang.org/x/crypto/bcrypt"
	"io/ioutil"
)

const (
	defAddress         = "127.0.0.1"
	defPort            = 8443
	defMaxReqSize      = int64(512 * 1024)
	defCertificate     = "arc-tls-cert.pem"
	defKey             = "arc-tls-key.pem"
	defDatabaseName    = "arc.db"
	defUsername        = "arc"
	defPassword        = "$2a$10$gwnHUhLVV9tgPtZfX4.jDOz6qzGgRHZmtE2YpMr9K1RpIO71YJViO"
	defSecret          = ""
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
type ReportsConfig struct {
	Enabled   bool       `json:"enabled"`
	RateLimit int        `json:"rate_limit"`
	Filter    []string   `json:"filter"`
	To        string     `json:"to"`
	PGP       PGPConfig  `json:"pgp"`
	SMTP      SMTPConfig `json:"smtp"`
}

// Scheduler configuration.
type SchedulerConfig struct {
	Enabled bool          `json:"enabled"`
	Period  int           `json:"period"`
	Reports ReportsConfig `json:"reports"`
}

// Backups configuration.
type BackupsConfig struct {
	Enabled bool   `json:"enabled"`
	Period  int    `json:"period"`
	Folder  string `json:"folder"`
	Run     string `json:"run"`
}

// Arc server configuration.
// swagger:response
type Configuration struct {
	Address       string          `json:"address"`
	Port          int             `json:"port"`
	MaxReqSize    int64           `json:"max_req_size"`
	Certificate   string          `json:"certificate"`
	Key           string          `json:"key"`
	Database      string          `json:"database"`
	Secret        string          `json:"secret"`
	Username      string          `json:"username"`
	Password      string          `json:"password"`
	TokenDuration int             `json:"token_duration"`
	Compression   bool            `json:"compression"`
	CheckExpired  int             `json:"check_expired"`
	Scheduler     SchedulerConfig `json:"scheduler"`
	Backups       BackupsConfig   `json:"backups"`
}

var Conf = Configuration{
	Address:       defAddress,
	Port:          defPort,
	MaxReqSize:    defMaxReqSize,
	Certificate:   defCertificate,
	Key:           defKey,
	Database:      defDatabaseName,
	Secret:        defSecret,
	Username:      defUsername,
	Password:      defPassword,
	TokenDuration: defTokenDuration,
	Compression:   defCompression,
	Backups: BackupsConfig{
		Enabled: defBackupsEnabled,
	},
	Scheduler: SchedulerConfig{
		Enabled: true,
		Period:  defSchedulerPeriod,
		Reports: ReportsConfig{
			Enabled:   false,
			RateLimit: defRateLimit,
		},
	},
}

// Load function convert a loaded JSON config file to a config struct
// return err if secret param is empty
func Load(filename string) error {
	log.Info("Loading configuration from %s ...", tui.Bold(filename))
	raw, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	err = json.Unmarshal(raw, &Conf)
	if err != nil {
		return err
	}

	if Conf.Secret == "" {
		return errors.New("HMAC secret not found, please fill the 'secret' configuration field.")
	}

	// fix path
	if Conf.Backups.Folder, err = utils.ExpandPath(Conf.Backups.Folder); err != nil {
		return err
	}

	return nil
}

// HashPassword function return hashed string from a given password and cost
func (c Configuration) HashPassword(password string, cost int) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		log.Fatal("%v", err)
	}
	return string(hash)
}

// Auth function return true if the provided username and password
// are valid and false if not.
func (c Configuration) Auth(username, password string) bool {
	if c.Username != username {
		return false
	}

	if e := bcrypt.CompareHashAndPassword([]byte(c.Password), []byte(password)); e != nil {
		return false
	}

	return true
}
