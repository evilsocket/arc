package utils

import (
	"testing"
)

func TestInSlice(t *testing.T) {
	tests := []struct {
		description string
		a           string
		list        []string
		exp         bool
	}{
		{"Nil list", "aa", nil, false},
		{"Empty list", "aa", []string{""}, false},
		{"Not in list", "aa", []string{"accc", "aaa", "abb", "abbab"}, false},
		{"Found in list", "aa", []string{"accc", "aaa", "abb", "abbab", "aa", "aaa"}, true},
	}

	for _, test := range tests {
		got := InSlice(test.a, test.list)
		if got != test.exp {
			t.Errorf("Test %v :\nExpected %v for (a=%v,list=%v) , got %v",
				test.description, test.exp, test.a, test.list, got)
		}
	}
}
