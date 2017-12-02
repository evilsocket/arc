package config

import (
	"encoding/json"
	"io/ioutil"
)

const (
	defWebAddress   = "127.0.0.1"
	defWebPort      = 8080
	defApiAddress   = "127.0.0.1"
	defApiPort      = 8081
	defDatabaseName = "vault.db"
	defHMacSecret   = ":°F_WQEùwqeflpùwa.pelfùkepwfùw,koefopwkepfwv"
	defUsername     = "vault"
	defPassword     = "vault"
)

type Listener struct {
	Address string `json:"address"`
	Port    int    `json:"port"`
}

type Configuration struct {
	Api      Listener `json:"api"`
	Web      Listener `json:"web"`
	Database string   `json:"database"`
	Secret   string   `json:"secret"`
	Username string   `json:"username"`
	Password string   `json:"password"`
}

var Conf = Configuration{
	Api:      Listener{defApiAddress, defApiPort},
	Web:      Listener{defWebAddress, defWebPort},
	Database: defDatabaseName,
	Secret:   defHMacSecret,
	Username: defUsername,
	Password: defPassword,
}

func Load(filename string) error {
	raw, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	return json.Unmarshal(raw, &Conf)
}
