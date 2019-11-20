/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package events

import (
	"bytes"
	"github.com/evilsocket/islazy/log"
	"html/template"
)

// golang, seriously?
func T(name, value string) *template.Template {
	return template.Must(template.New(name).Parse(value))
}

func Populate(t *template.Template, data interface{}) string {
	var b bytes.Buffer
	if err := t.Execute(&b, data); err != nil {
		log.Fatal("%v", err)
	}
	return b.String()
}

const TPL_DATE_FORMAT = "Mon Jan 2 15:04:05 2006"

var TPL_LOGIN_OK = T("login_ok",
	"On {{.When}} address {{.Address}} successfully logged into the Arc server.")

var TPL_LOGIN_KO = T("login_ko",
	`On {{.When}} address <b>{{.Address}}</b> tried to log into the Arc server with username 
<b>{{.Username}}</b> and password <b>{{.Password}}</b>.`)

var TPL_TOKEN_KO = T("token_ko",
	`On {{.When}} address <b>{{.Address}}</b> tried to authenticate with an invalid token 
( {{.Reason}} ).
<br/><br/>
<label>Token</label><br/>
<small>{{.Token}}</small>`)

var TPL_RECORD_EXPIRED = T("record_expired",
	`On {{.When}} the record <b>{{.Title}}</b> which was created on {{.CreatedAt}} and updated 
on {{.UpdatedAt}} expired, it was made of {{.Size}} bytes of {{.Encryption}} encrypted 
{{if .Compressed}}(and compressed) {{end}}data.{{if .Deleted}}<br/>The record has been deleted.{{end}}`)

var TPL_UPDATE = T("update",
	"You are running Arc v{{.Version}} but v{{.NewVersion}} is available <a href=\"{{.Link}}\">for download</a>.")
