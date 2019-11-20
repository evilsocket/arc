/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package middlewares

import (
	"fmt"
	"github.com/evilsocket/islazy/log"
	"github.com/gin-gonic/gin"
	"gopkg.in/unrolled/secure.v1"
	"strings"
)

func Security(tlsFingerprint string) gin.HandlerFunc {
	rules := secure.New(secure.Options{
		FrameDeny:          true,
		ContentTypeNosniff: true,
		BrowserXssFilter:   true,
		ReferrerPolicy:     "same-origin",
		// PublicKey:          fmt.Sprintf("pin-sha256=\"%s\"; max-age=5184000", tlsFingerprint),
	})

	return func(c *gin.Context) {
		err := rules.Process(c.Writer, c.Request)
		if err != nil {
			who := strings.Split(c.Request.RemoteAddr, ":")[0]
			req := fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
			log.Warning("%s > %s | Security exception: %s", who, req, err)
			c.Abort()
			return
		}

		if status := c.Writer.Status(); status > 300 && status < 399 {
			c.Abort()
		}
	}
}
