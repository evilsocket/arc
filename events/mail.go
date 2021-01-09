package events

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"github.com/evilsocket/arc/config"
	"github.com/evilsocket/arc/pgp"
	"github.com/evilsocket/islazy/log"
	"gopkg.in/gomail.v2"
	"os"
	"os/exec"
)

func doEmailReport(event Event) (err error) {
	smtp := config.Conf.Scheduler.Reports.SMTP

	contentType := "text/html"
	reportType := "plaintext"
	if pgpConf.Enabled {
		reportType = "PGP encrypted"
	}

	body := event.Description
	if pgpConf.Enabled {
		contentType = "text/plain"
		if err, body = pgp.Encrypt(body); err != nil {
			return fmt.Errorf("could not PGP encrypt the message: %v", err)
		}
	}

	log.Info("reporting %s event '%s' to %s ...",
		reportType,
		event.Title,
		config.Conf.Scheduler.Reports.To)

	if smtp.Filled() {
		log.Info("using smtp server")

		d := gomail.NewDialer(smtp.Address, smtp.Port, smtp.Username, smtp.Password)
		d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

		m := gomail.NewMessage()
		m.SetHeader("From", fmt.Sprintf("Arc Reporting System <%s>", smtp.Username))
		m.SetHeader("To", config.Conf.Scheduler.Reports.To)
		m.SetHeader("Subject", event.Title)

		m.SetBody(contentType, body)

		if err := d.DialAndSend(m); err != nil {
			return err
		}
	} else if sendmailPath, err := exec.LookPath("sendmail"); err != nil {
		return fmt.Errorf("error searching sendmail binary: %v", err)
	} else {
		log.Info("using %s", sendmailPath)

		cmd := exec.Command(sendmailPath, "-t")

		body = "From: arc@localhost\n" +
			fmt.Sprintf("To: %s", config.Conf.Scheduler.Reports.To ) + "\n" +
			fmt.Sprintf("Subject: %s", event.Title ) + "\n" +
			fmt.Sprintf("Content-Type: %s", contentType ) + "\n" +
			"Content-Transfer-Encoding: 7BIT\n" +
			"Content-Disposition: inline\n" +
			"MIME-Version: 1.0\n" +
			"\n" +
			body

		buffer := bytes.Buffer{}
		buffer.Write([]byte(body))

		cmd.Stdin = &buffer
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		return cmd.Run()
	}

	return nil
}
