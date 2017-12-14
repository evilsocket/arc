# Arc

Arc is a manager for your secrets made of `arcd`, a RESTful API server written in Go which exposes read and write primitives for **encrypted records** on disk

![arcd](https://i.imgur.com/swC00gX.png)

And `arc`, the client application implemented in html5 and javascript, which runs in every html5 enabled browser and  it is served by `arcd` itself.

![multikey](https://pbs.twimg.com/media/DQN8W1KWsAEP6bd.jpg:large)

Records are generated, encrypted and decrypted **client side only** (Arc relies on [WebCrypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) for its AES encryption and the PRNG) by `arc`, which offers an intuitive management system equipped with UI widgets including:

- Simple text inputs.
- Simple text areas.
- Custom file attachments (**files are encrypted client side** before being uploaded as binary records).
- A markdown editor area with preview and full screen mode.
- A password field with **password strength estimation** and a **random password generator**. 

Elements can be created (with optional expiration dates), arranged and edited using `arc` and are stored on `arcd` safely.

||||
| ------------- | -- |-------------- |
| ![ui mix 1](https://i.imgur.com/KCn4RGw.png)  |  | ![ui mix 2](https://i.imgur.com/nxqmRqY.png) |
| A client side encrypted record set to expire and self delete with a markdown area and a password widget. |  |  Markdown and various attached files. |

#### TL;DR 

The idea is to use *the Arc* as a single manager for your passwords, encrypted notes, files and `-all the secret things here-` while hosting `arcd` yourself on some spare hardware like a Raspberry Pi (a very portable setup with a `Zero W` model, or an USB Armory) or a real dedicated server and accessing `arc` from every device with a modern browser.

<p align="center">
    <img src="https://i.imgur.com/h5cpCeN.png" alt="Encrypt all the things!"/>
</p>

## Usage

Download, install dependencies and compile the `arcd` server component:

    git clone https://github.com/evilsocket/arc
    cd arc/arcd
    make vendor_get
    make

If you want to build for `arm` from another architecture (ie: you're building for your Raspberry Pi from your laptop), you can refer to the `.goreleaser.yml` file for platform and arch specific flags:

    # on your laptop
    sudo apt-get install gcc-arm-linux-gnueabi
    cd arc/arcd
    env CC=arm-linux-gnueabi-gcc CGO_ENABLED=1 GOOS=linux GOARM=6 GOARCH=arm make
    
Now copy the `sample_config.json` file to a new `config.json` file, customize it and run the `arc` web application:

    ./arcd -config config.json -app ../arc

The `password` field is the SHA256 checksum of your password, you can generate a new one with:

    echo -n "your-new-password" | sha256sum

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

## Configuration

You will find a `sample_config.json` file inside the `arcd` folder of the project, this is the example configuration you need to customize the first time.

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
        "period": 10
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
| compression | Enable or disable records compression. |
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

## Bugs

Before opening an issue, please make sure it is not already part of [a known bug](https://github.com/evilsocket/arc/issues?q=is%3Aopen+is%3Aissue+label%3Abug).

## License

Arc was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

