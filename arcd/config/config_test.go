package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuth(t *testing.T) {
	// The test should fail if the Load failed
	err := Load("../sample_config.json")
	if err != nil {
		t.Errorf("Failed to load sample_config.json: %v", err)
	}

	result := Conf.Auth("test", "test")
	assert.Equal(t, false, result)

	result = Conf.Auth("arc", "test")
	assert.Equal(t, false, result)

	result = Conf.Auth("test", "arc")
	assert.Equal(t, false, result)

	result = Conf.Auth("arc", "arc")
	assert.Equal(t, true, result)
}
