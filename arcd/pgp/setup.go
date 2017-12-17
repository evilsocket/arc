/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package pgp

import (
	_ "crypto/sha256"
	"github.com/evilsocket/arc/arcd/config"
	"github.com/evilsocket/arc/arcd/utils"
	_ "golang.org/x/crypto/ripemd160"
	"os"
	"path"
)

func Setup(pgp *config.PGPConfig) error {
	pgp.Keys.Public, _ = utils.ExpandPath(pgp.Keys.Public)
	if err := LoadKey(pgp.Keys.Public, false); err != nil {
		return err
	}

	if pgp.Keys.Private == "" {
		cwd, _ := os.Getwd()
		pgp.Keys.Private = path.Join(cwd, "arcd-pgp-private.key")
	}
	public := path.Join(path.Dir(pgp.Keys.Private), "arcd-pgp-public.key")

	pgp.Keys.Private, _ = utils.ExpandPath(pgp.Keys.Private)
	if utils.Exists(pgp.Keys.Private) == false {
		if err := GenerateKeys(pgp.Keys.Private, public); err != nil {
			return err
		}
	}

	if err := LoadKey(pgp.Keys.Private, true); err != nil {
		return err
	}

	return nil
}
