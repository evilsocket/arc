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
	"github.com/evilsocket/arc/arcd/log"
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
)

// Server TLS configuration.
type tlsConfig struct {
	Enabled     bool   `json:"enabled"`
	Certificate string `json:"certificate"`
	Key         string `json:"key"`
}

// Scheduler configuration.
type schConfig struct {
	Enabled bool `json:"enabled"`
	Period  int  `json:"period"`
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
	CheckExpired  int       `json:"check_expired"`
	Scheduler     schConfig `json:"scheduler"`
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
	TLS:           tlsConfig{Enabled: false},
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

	return json.Unmarshal(raw, &Conf)
}
