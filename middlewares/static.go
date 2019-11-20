/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package middlewares

// This middleware is a variation of github.com/gin-gonic/contrib/static
// created because of this https://github.com/evilsocket/arc/issues/64
import (
	// "github.com/evilsocket/islazy/log"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path"
	"strings"
)

type ServeFileSystem interface {
	http.FileSystem
	Exists(prefix string, path string) bool
}

type localFileSystem struct {
	http.FileSystem
	root string
}

var IndexFile = ""

func Static(root, index string) *localFileSystem {
	IndexFile = index
	if len(IndexFile) > 0 && IndexFile[0] != '/' {
		IndexFile = "/" + IndexFile
	}

	return &localFileSystem{
		FileSystem: gin.Dir(root, false),
		root:       root,
	}
}

func (l *localFileSystem) Exists(prefix string, filepath string) bool {
	if p := strings.TrimPrefix(filepath, prefix); len(p) < len(filepath) {
		name := path.Join(l.root, p)
		if stats, err := os.Stat(name); err != nil || stats.IsDir() {
			return false
		}
		return true
	}
	return false
}

func ServeStatic(url, root, index string) gin.HandlerFunc {
	// log.Debug("Creating static middleware for path %s (index=%s)", tui.Bold(root), index)
	return Serve(url, Static(root, index))
}

// Static returns a middleware handler that serves static files in the given directory.
func Serve(url string, fs ServeFileSystem) gin.HandlerFunc {
	fileserver := http.FileServer(fs)
	if url != "" {
		fileserver = http.StripPrefix(url, fileserver)
	}
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		// Fixes https://github.com/evilsocket/arc/issues/64
		if path == "/" {
			// log.Debug("Fixing request path / to %s.", tui.Bold(IndexFile))
			path = IndexFile
		}

		if fs.Exists(url, path) {
			fileserver.ServeHTTP(c.Writer, c.Request)
			c.Abort()
		}
	}
}
