package main

import (
	"flag"
	"fmt"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/arc/log"
	"golang.org/x/crypto/bcrypt"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"syscall"
)

func arcSignalHandler() {
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	s := <-signals
	log.Raw("\n")
	log.Importantf("RECEIVED SIGNAL: %s", s)
	db.Flush()
	os.Exit(1)
}

func main() {
	if len(os.Args) >= 3 && os.Args[1] == "password" {
		password := os.Args[2]
		cost := bcrypt.DefaultCost
		if len(os.Args) == 4 {
			n, err := strconv.Atoi(os.Args[3])
			if err != nil {
				log.Fatal(err)
			}
			cost = n
		}
		fmt.Println(config.Conf.HashPassword(password, cost))
		return
	}

	flag.Parse()

	go arcSignalHandler()

	setupLogging()

	log.Infof("%s (%s %s) is starting ...", log.Bold(config.APP_NAME+" v"+config.APP_VERSION), runtime.GOOS, runtime.GOARCH)
	if confFile != "" {
		if err := config.Load(confFile); err != nil {
			log.Fatal(err)
		}
	}

	setupDatabase()
	setupScheduler()
	setupBackups()
	setupUpdates()
	setupTLS()
	setupRouter()

	address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)
	if address[0] == ':' {
		address = "0.0.0.0" + address
	}

	log.Infof("Running on %s ...", log.Bold("https://"+address+"/"))
	if err := router.RunTLS(address, config.Conf.Certificate, config.Conf.Key); err != nil {
		log.Fatal(err)
	}
}
