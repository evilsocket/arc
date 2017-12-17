# Arc

Arc is a manager for your secrets made of `arcd`, a RESTful API server written in Go which exposes read and write primitives for encrypted records, and `arc`, the client application implemented in HTML5 and javascript, which runs in every modern browser and  it is served by `arcd` itself.

Records are generated, encrypted and decrypted **client side only** by `arc` (with AES256, using 10000 iterations for the PBKDF2 key derivation function, everything [WebCrypto](https://www.w3.org/TR/WebCryptoAPI/) based ), which offers an intuitive management system equipped with UI widgets including:

- Simple text inputs.
- Simple text areas.
- Custom file attachments (**files are encrypted client side** before being uploaded as binary records).
- A markdown editor area with preview and full screen mode.
- A HTML editor with preview and full screen mode.
- A password field with **password strength estimation** and a **random password generator**. 
- Custom lists.
- Bitcoin wallet address with auto updating balance.

Elements can be created (with optional expiration dates), arranged and edited using `arc` and are stored on `arcd` as AES256 encrypted (and compressed) raw data.

## Hardware? 

Ideally `arcd` should run on a dedicated portable hardware like a Raspberry Pi Zero, for instance it is possible to simply access it via Bluetooth and a modern browser once configured [btnap](https://github.com/bablokb/pi-btnap), but precompiled versions are available for [several operating systems and architectures](https://github.com/evilsocket/arc/releases) (including ARM, ARM64 and MIPS) therefore Arc can run on pretty much everything with a CPU, from your smartphone, your router, your Mac or your Windows computer. As a rule of thumb, the more [isolated](https://en.wikipedia.org/wiki/Compartmentalization_(information_security)) the hardware is, the better. 

The idea is to use Arc as a single storage and manager for your passwords, encrypted notes, files and `-all the secret things here-`.

<p align="center">
    <img src="https://i.imgur.com/h5cpCeN.png" alt="Encrypt all the things!"/>
</p>

## Usage

You can find binary releases of Arc [here](https://github.com/evilsocket/arc/releases), if instead you want to build it from source, make sure you have Go >= 1.8 installed and configured correctly, then clone this repository, install the dependencies and compile the `arcd` server component:

    git clone https://github.com/evilsocket/arc $GOPATH/src/github.com/evilsocket/arc
    cd $GOPATH/src/github.com/evilsocket/arc/arcd
    make vendor_get
    make

Once you either extracted the release archive or compiled it yourself, copy `sample_config.json` to a new `config.json` file and customize it. The most important fields to change are the `username` and the `password`, which is the SHA256 checksum of the authentication password you want to use, you can generate a new one with:

    echo -n "your-new-password" | sha256sum

Once everything is ready, youn can finally start the `arcd` server:

    ./arcd -config config.json -app arc

Now browse `http://localhost:8080/` ( or the address and port you configured ) and login with the configured credentials.

**NOTE**

Other than the username and the password, during login you need to specify an additional encryption key. This second key is not used to login to the system itself but to encrypt and decrypt your records client side. You can specify different keys each time you login, as long as you remember which key you used to encrypt which record :)

## Configuration

This is the example configuration file you need to customize the first time.

```json
{
    "address": "127.0.0.1",
    "port": 8080,
    "username": "arc",
    "password": "404fcfb394d23199f6d95f1f36bd2beb6df8564f993f44517f6015fcd16101a9",
    "database": "~/arcdb",
    "token_duration": 60,
    "compression": true,
    "scheduler": {
        "enabled": true,
        "period": 10,
        "reports": {
            "enabled": false,
            "filter": [ "login_ok", "login_ko", "token_ko", "update", "record_expired" ],
            "to": "youremail@gmail.com",
            "smtp":{
                "address": "smtp.gmail.com",
                "port": 587,
                "username": "youremail@gmail.com",
                "password": "your smtp password"
            }
        }
    },
    "backups": {
        "enabled": false,
        "period": 1800,
        "folder": "/some/backup/path/"
    },
    "tls": {
        "enabled": false,
        "certificate": "/some/certificate.pem",
        "key": "/some/key.pem"
    }
}
```

It is necessary to change only the `username` and `password` access parameters of Arc, while the others can be left to their default values.

| Configuration | Description |
| ------------- | ------------- |
| address | IP address to bind the `arcd` server to. |
| port | TCP to bind the `arcd` server to. |
| username | API access username. |
| password | API access password `sha256` hash. |
| database | Database root directory. |
| token\_duration | Validity in minutes of a JWT API token after it's being generated. |
| compression | If true, records bigger than 1024 bytes will be asynchronously gzipped and served as compressed streams to the client. |
| scheduler.enabled | Enable or disable the server events scheduler (**if you disable this, bye bye notifications and records expiration**). |
| scheduler.period | Time in seconds between every scheduler loop. |
| scheduler.reports.enabled | If true, events will be reported by email. |
| scheduler.reports.filter | Which type of events to report by email. |
| scheduler.reports.to | Destination email address. |
| scheduler.reports.smtp | SMTP server information. |
| backups.enabled | Enable automatic backups. |
| backups.period | Number of seconds between one backup and the next one. |
| backups.folder | Destination folder for the backup file. |
| tls.enabled | Run `arcd` on HTTPS. |
| tls.certificate | HTTPS certificate. |
| tls.key | HTTPS private key. |

## Export and import stores.

You can export stores and their encrypted records to a JSON file:

    ./arcd -config config.json -output ~/backup.json -export

Exported files can be later imported with:

    ./arcd -config config.json -import ~/backup.json

## Keyboard Shortcuts.

- `n` Create a new item ( store or record ).
- `d` Delete the current item ( store or record ).
- `a` Add a new field to the current record.
- `s` Save the current record.
- `e` Set expiration date for the current record.
- `ESC` Close current window.

## Useful Commands

Allow the `arcd` binary to bind to privileged ports without having root privileges:

    sudo setcap 'cap_net_bind_service=+ep' arcd

Generate self signed certificate in order to use Arc on HTTPS:

    openssl req -new -x509 -sha256 -key key.pem -out certificate-pem -days 365  

Lines to add to `/etc/rc.local` in order to make arcd start at boot (running as `pi` user, configuration, logs and and ui are in the home folder):

    export ARC=/home/pi/
    sudo -H -u pi bash -c "$ARC/arcd -config $ARC/config.json -app $ARC/arc -log-file $ARC/arcd.log &"

## Bugs

Before opening an issue, please make sure it is not already part of [a known bug](https://github.com/evilsocket/arc/issues?q=is%3Aopen+is%3Aissue+label%3Abug).

## License

Arc was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

