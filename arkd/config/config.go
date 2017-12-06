/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package config

import (
	"encoding/json"
	"github.com/evilsocket/ark/arkd/log"
	"io/ioutil"
)

const (
	defAddress       = "127.0.0.1"
	defPort          = 8080
	defDatabaseName  = "ark.db"
	defHMacSecret    = ":°F_WQEùwqeflpùwa.pelfùkepwfùw,koefopwkepfwv"
	defUsername      = "ark"
	defPassword      = "ark"
	defTokenDuration = 60
)

type tlsConfig struct {
	Enabled bool   `json:"enabled"`
	PemFile string `json:"pem"`
	KeyFile string `json:"key"`
}

type Configuration struct {
	Address       string    `json:"address"`
	Port          int       `json:"port"`
	Database      string    `json:"database"`
	Secret        string    `json:"secret"`
	Username      string    `json:"username"`
	Password      string    `json:"password"`
	TokenDuration int       `json:"token_duration"`
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
}

func Load(filename string) error {
	log.Infof("Loading configuration from %s ...", log.Bold(filename))
	raw, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	return json.Unmarshal(raw, &Conf)
}
