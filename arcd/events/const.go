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
	"github.com/evilsocket/arc/arcd/db"
	"html"
)

func Login(successful bool, address string, username string, password string) Event {
	if successful {
		desc := fmt.Sprintf("Address %s successfully logged into Arc server.", address)
		return New("login_ok", "Successful login.", desc)
	} else {
		desc := fmt.Sprintf("Address <b>%s</b> tried to log into Arc server with username <b>%s</b> and password <b>%s</b>.",
			html.EscapeString(address),
			html.EscapeString(username),
			html.EscapeString(password))
		return New("login_ko", "Failed login attempt.", desc)
	}
}

func RecordExpired(r *db.Record) Event {
	meta := r.Meta()

	title := fmt.Sprintf("'%s' just expired.", meta.Title)
	compressed := ""
	deleted := ""

	if meta.Compressed {
		compressed = "(and gzipped) "
	}

	if meta.Prune {
		deleted = "It has been deleted from the system."
	}

	desc := fmt.Sprintf("The record <b>%s</b> which was created on %s and updated on %s just expired, it was made of %d bytes of %s encrypted %sdata.%s",
		html.EscapeString(meta.Title),
		meta.CreatedAt,
		meta.UpdatedAt,
		meta.Size,
		meta.Encryption,
		compressed,
		deleted)

	return New("record_expired", title, desc)
}
