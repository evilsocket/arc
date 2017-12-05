/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package middlewares

import (
	"github.com/dgrijalva/jwt-go"
	"github.com/evilsocket/vault/vaultd/config"
	"github.com/gin-gonic/gin"
	"strings"
)

func AuthHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		user_id := c.GetString("user_id")
		if user_id != config.Conf.Username {
			token := c.Request.Header.Get("Authorization")
			// Check if toke in correct format
			// ie Bearer: xx03xllasx
			b := "Bearer: "
			if !strings.Contains(token, b) {
				c.JSON(403, gin.H{"message": "Your request is not authorized"})
				c.Abort()
				return
			}
			t := strings.Split(token, b)
			if len(t) < 2 {
				c.JSON(403, gin.H{"message": "An authorization token was not supplied"})
				c.Abort()
				return
			}
			// Validate token
			valid, err := ValidateToken(t[1], config.Conf.Secret)
			if err != nil {
				c.JSON(403, gin.H{"message": "Invalid authorization token"})
				c.Abort()
				return
			}

			// set user_id Variable
			c.Set("user_id", valid.Claims.(jwt.MapClaims)["user_id"])
		}

		c.Next()
	}
}
