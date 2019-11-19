/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
package utils

import (
	"fmt"
	"math"
)

/*
 * The following code has been taken from
 * https://github.com/dustin/go-humanize/blob/master/bytes.go
 * in order to avoid including the whole library.
 */
func logn(n, b float64) float64 {
	return math.Log(n) / math.Log(b)
}

func FormatBytes(s uint64) string {
	if s < 10 {
		return fmt.Sprintf("%d B", s)
	}

	sizes := []string{"B", "KB", "MB", "GB", "TB", "PB", "EB"}
	base := float64(1024)
	e := math.Floor(logn(float64(s), base))
	suffix := sizes[int(e)]
	val := math.Floor(float64(s)/math.Pow(base, e)*10+0.5) / 10
	f := "%.0f %s"
	if val < 10 {
		f = "%.1f %s"
	}

	return fmt.Sprintf(f, val, suffix)

}
