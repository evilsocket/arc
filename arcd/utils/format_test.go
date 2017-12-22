package utils

import (
	"math"
	"testing"
)

// TestLogn run a defined list of tests on logn function
func TestLogn(t *testing.T) {
	tests := []struct {
		n   float64
		b   float64
		exp float64
	}{
		{1, math.E, 0},
		{8, 4, 1.5},
		{math.E, math.E, 1},
	}

	for _, test := range tests {
		got := logn(test.n, test.b)
		if got != test.exp {
			t.Errorf("Expected %v for (n=%v,b=%v) , got %v",
				test.exp, test.n, test.b, got)
		}
	}
}

// TestFormatBytes run tests on FormatBytes function
func TestFormatBytes(t *testing.T) {
	tests := []struct {
		exp string
		in  uint64
	}{
		{"0 B", 0},
		{"1 B", 1},
		{"1 B", 001},
		{"3 B", 3},
		{"42 B", 42},
		{"40 MB", 42000000},
		{"42 MB", 44040192},
		{"42 KB", 43008},
		{"33 GB", 35433480192},
		{"33 TB", 36283883720000},
		{"33 PB", 37154696930000000},
	}

	for _, test := range tests {
		got := FormatBytes(test.in)
		if got != test.exp {
			t.Errorf("Expected %v for %v, got %v",
				test.exp, test.in, got)
		}
	}
}
