package utils

import (
	"os/user"
	"testing"
)

func TestExists(t *testing.T) {
	tests := []struct {
		description string
		path        string
		exp         bool
	}{
		{"Empty path", "", false},
		{"Home dir path", "/home", true},
		{"Current directory", ".", true},
		{"Root directory", "/", true},
		{"~ directory", "~", false},
	}

	for _, test := range tests {
		got := Exists(test.path)
		if got != test.exp {
			t.Errorf("Exists test: %v :\nExpected %v for path=%v , got %v",
				test.description, test.exp, test.path, got)
		}
	}
}

func TestExpandPath(t *testing.T) {
	usr, err := user.Current()
	if err != nil {
		t.Errorf("Error getting home directory: %v", err)
	}

	tests := []struct {
		description string
		path        string
		exp         string
	}{
		{"Empty path", "", ""},
		{"Home dir path", "/home", "/home"},
		{"Root directory", "/", "/"},
		{"User Home directory", "~", usr.HomeDir},
	}

	for _, test := range tests {
		got, err := ExpandPath(test.path)
		if err != nil {
			t.Logf("Error ExpandPath test for %v, err=%v", test.description, err)
		}
		if got != test.exp {
			t.Errorf("ExpandPath test: %v :\nExpected %v for path=%v , got %v\n",
				test.description, test.exp, test.path, got)
		}
	}
}
