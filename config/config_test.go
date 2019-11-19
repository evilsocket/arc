package config

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// testConf contains test configurations
var testConf = Configuration{
	Address:       "127.0.0.1",
	Port:          8443,
	MaxReqSize:    int64(512 * 1024),
	Certificate:   "arc-tls-cert.pem",
	Key:           "arc-tls-key.pem",
	Database:      "arc.db",
	Secret:        "changeme",
	Username:      "arc",
	Password:      "$2a$10$gwnHUhLVV9tgPtZfX4.jDOz6qzGgRHZmtE2YpMr9K1RpIO71YJViO",
	TokenDuration: 60,
	Compression:   true,
	Backups: BackupsConfig{
		Enabled: false,
	},
	Scheduler: SchedulerConfig{
		Enabled: true,
		Period:  15,
		Reports: ReportsConfig{
			Enabled:   false,
			RateLimit: 60,
		},
	},
}

// TestAuth test Auth function
func TestAuth(t *testing.T) {
	tests := []struct {
		name     string
		username string
		password string
		exp      bool
	}{
		{"Incorrect login and pass", "test", "test", false},
		{"Correct login and incorrect pass", "arc", "test", false},
		{"Incorrect login and correct pass", "test", "arc", false},
		{"Correct login and pass", "arc", "arc", true},
		{"Empty credantials", "", "", false},
	}

	for _, tt := range tests {
		got := testConf.Auth(tt.username, tt.password)
		if got != tt.exp {
			t.Errorf("Test -- %v -- failed:\n Got %v \n Expected %v", tt.name, got, tt.exp)
		}
	}
}

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		cost     int
		exp      string
	}{
		//bcrypt cost can be between 4 and 31. 10 is the default value
		{"Empty password", "", 10, "$2a$10$4UW2Nvp9QglqZZDDayfJcOfk7shblk3a9/voRPPt8dmK4mTiKBr9q"},
		{"arc password", "arc", 10, "$2a$10$RuOcSEwPNNFlA/lxjpRY3.3J0tR0LG/FyfG/IXolgdDxPh7.urgGe"},
		// NOTE: same password can have different hashes
		{"arc password with another hash", "arc", 10, "$2a$10$Z/YHAyjeJk47AbnpEZ/xneqFYioTKZlQiSB3W5OEe6MKNHQxT2vbS"},
	}

	for _, tt := range tests {
		got := testConf.HashPassword(tt.password, tt.cost)
		if err := bcrypt.CompareHashAndPassword([]byte(tt.exp), []byte(tt.password)); err != nil {
			t.Errorf("Test -- %v -- failed.\n err: %v \nGot %v \n Expected %v", tt.name, err, got, tt.exp)
		}
	}
}
