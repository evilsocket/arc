package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuth(t *testing.T) {
	Load("sample_config.json")

	result := Conf.Auth("test", "test")
	assert.Equal(t, false, result)

	result = Conf.Auth("arc", "test")
	assert.Equal(t, false, result)

	result = Conf.Auth("test", "arc")
	assert.Equal(t, false, result)

	result = Conf.Auth("arc", "arc")
	assert.Equal(t, true, result)
}
