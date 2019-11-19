/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package events

import (
	"fmt"
	"github.com/evilsocket/arc/db"
	"time"
)

func Login(successful bool, address string, username string, password string) Event {
	if successful {
		desc := Populate(TPL_LOGIN_OK, struct {
			When    string
			Address string
		}{
			time.Now().Format(TPL_DATE_FORMAT),
			address,
		})

		return New("login_ok", "Successful login.", desc)
	} else {
		desc := Populate(TPL_LOGIN_KO, struct {
			When     string
			Address  string
			Username string
			Password string
		}{
			time.Now().Format(TPL_DATE_FORMAT),
			address,
			username,
			password,
		})

		return New("login_ko", "Failed login attempt.", desc)
	}
}

func InvalidToken(address, auth string, err error) Event {
	title := "Invalid token authentication."
	reason := ""
	if err != nil {
		reason = err.Error()
	}

	desc := Populate(TPL_TOKEN_KO, struct {
		When    string
		Address string
		Reason  string
		Token   string
	}{
		time.Now().Format(TPL_DATE_FORMAT),
		address,
		reason,
		auth,
	})

	return New("token_ko", title, desc)
}

func RecordExpired(r *db.Record) Event {
	meta := r.Meta()

	title := fmt.Sprintf("'%s' just expired.", meta.Title)
	desc := Populate(TPL_RECORD_EXPIRED, struct {
		When       string
		Title      string
		CreatedAt  string
		UpdatedAt  string
		Size       uint64
		Encryption string
		Compressed bool
		Deleted    bool
	}{
		time.Now().Format(TPL_DATE_FORMAT),
		meta.Title,
		meta.CreatedAt.Format(TPL_DATE_FORMAT),
		meta.UpdatedAt.Format(TPL_DATE_FORMAT),
		meta.Size,
		meta.Encryption,
		meta.Compressed,
		meta.Prune,
	})

	return New("record_expired", title, desc)
}

func UpdateAvailable(curr_ver, new_ver, url string) Event {
	title := fmt.Sprintf("Arc v%s is available.", new_ver)
	desc := Populate(TPL_UPDATE, struct {
		Version    string
		NewVersion string
		Link       string
	}{
		curr_ver,
		new_ver,
		url,
	})
	return New("update", title, desc)
}
