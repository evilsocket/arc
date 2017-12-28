/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package app

import (
	"encoding/json"
	"fmt"
	"github.com/evilsocket/arc/arcd/log"
	"github.com/evilsocket/arc/arcd/utils"
	"io/ioutil"
)

const (
	kManifestFileName = "manifest.json"
)

// Information about the author of the web application.
type Author struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	License string `json:"license"`
}

// Information about the web application.
// swagger:response
type Manifest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
	Author      Author `json:"author"`
	Index       string `json:"index"`
}

type App struct {
	Path     string
	Manifest Manifest
}

func Open(path string) (err error, app *App) {
	if path, err = utils.ExpandPath(path); err != nil {
		return
	}

	log.Debugf("Loading web application from %s ...", log.Bold(path))

	if utils.IsFolder(path) == false {
		err = fmt.Errorf("Path %s is not a folder.", path)
		return
	}

	manifest_fn := path + "/" + kManifestFileName
	manifest := Manifest{
		Name:        "?",
		Version:     "0.0.0",
		Description: "",
	}

	if utils.Exists(manifest_fn) {
		log.Debugf("Loading manifest from %s ...", log.Bold(manifest_fn))
		raw, ferr := ioutil.ReadFile(manifest_fn)
		if ferr != nil {
			err = ferr
			return
		}

		if err = json.Unmarshal(raw, &manifest); err != nil {
			return
		}
	}

	app = &App{
		Path:     path,
		Manifest: manifest,
	}

	return nil, app
}

func (app *App) String() string {
	return fmt.Sprintf("%s v%s", app.Manifest.Name, app.Manifest.Version)
}
