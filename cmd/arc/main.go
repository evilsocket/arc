package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"syscall"

	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/db"
	"github.com/evilsocket/islazy/log"
	"github.com/evilsocket/islazy/tui"
	"golang.org/x/crypto/bcrypt"
	"tailscale.com/tsnet"
)

func arcSignalHandler() {
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	s := <-signals
	log.Raw("\n")
	log.Warning("RECEIVED SIGNAL: %s", s)
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
				log.Fatal("%v", err)
			}
			cost = n
		}
		fmt.Println(config.Conf.HashPassword(password, cost))
		return
	}

	flag.Parse()

	go arcSignalHandler()

	setupLogging()

	log.Info("%s (%s %s) is starting ...", tui.Bold(config.APP_NAME+" v"+config.APP_VERSION), runtime.GOOS, runtime.GOARCH)
	if confFile != "" {
		if err := config.Load(confFile); err != nil {
			log.Fatal("%v", err)
		}
	}

	setupDatabase()
	setupScheduler()
	setupBackups()
	setupUpdates()
	setupTLS()
	setupRouter()

	if config.Conf.Tailscale.Enabled {
		// run as a tailscale network server
		if config.Conf.Tailscale.Hostname == "" {
			log.Warning("tailscale hostname not provided, defaulting to system hostname")
			hostName, err := os.Hostname()
			if err != nil {
				log.Fatal("%v", err)
			}
			hostName = strings.ReplaceAll(hostName, ".local", "")

			config.Conf.Tailscale.Hostname = hostName
		}

		justPort := fmt.Sprintf(":%d", config.Conf.Port)
		address := fmt.Sprintf("%s%s", config.Conf.Tailscale.Hostname, justPort)

		log.Info("running on %s %s ...", tui.Bold(tui.Yellow("<tailscale>")), tui.Bold("https://"+address+"/"))

		tsListener := new(tsnet.Server)
		tsListener.Hostname = config.Conf.Tailscale.Hostname
		defer tsListener.Close()

		tcpListener, err := tsListener.ListenTLS("tcp", justPort)
		if err != nil {
			log.Fatal("%v", err)
		}
		defer tcpListener.Close()

		if err := http.Serve(tcpListener, router); err != nil {
			log.Fatal("%v", err)
		}
	} else {
		// run as a normal tcp server
		address := fmt.Sprintf("%s:%d", config.Conf.Address, config.Conf.Port)
		if address[0] == ':' {
			address = "0.0.0.0" + address
		}

		log.Info("running on %s ...", tui.Bold("https://"+address+"/"))
		if err := router.RunTLS(address, config.Conf.Certificate, config.Conf.Key); err != nil {
			log.Fatal("%v", err)
		}
	}
}
