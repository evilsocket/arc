<p align="center">
  <img alt="Arc Logo" src="https://raw.githubusercontent.com/evilsocket/arc/master/webui/img/logo.png" height="140" />
  <h3 align="center">Arc</h3>
  <p align="center">A manager for your secrets.</p>
  <p align="center">
    <a href="https://github.com/evilsocket/arc/releases/latest"><img alt="Release" src="https://img.shields.io/github/release/evilsocket/arc.svg?style=flat-square"></a>
    <a href="/LICENSE"><img alt="Software License" src="https://img.shields.io/badge/license-GPL3-brightgreen.svg?style=flat-square"></a>
    <img alt="Build" src="https://github.com/evilsocket/arc/actions/workflows/go.yml/badge.svg">
    <a href="https://goreportcard.com/report/github.com/evilsocket/arc"><img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/evilsocket/arc?style=flat-square"></a>
  </p>
</p>

---

Arc is a manager for your secrets made of `arc`, a RESTful API server written in Go which exposes read and write primitives for encrypted records, and `arc`, the client application implemented in HTML5 and javascript, which runs in every modern browser and  it is served by `arc` itself.

Records are generated, encrypted and decrypted **client side** by `arc` (with AES256 in GCM mode, using 10000 iterations for the PBKDF2 key derivation function, everything [WebCrypto](https://www.w3.org/TR/WebCryptoAPI/) based ), which offers an intuitive management system equipped with UI widgets including:

- Simple text inputs.
- Simple text areas.
- Custom file attachments.
- A markdown editor area with preview and full screen mode.
- A HTML editor with preview and full screen mode.
- A password field with password strength estimation and a random password generator. 
- Custom lists.
- Bitcoin wallet address with auto updating balance.
- Manager for [Time-based One-time Password Algorithm (TOTP) codes](http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm) as per the [TOTP RFC Draft](http://tools.ietf.org/id/draft-mraihi-totp-timebased-06.html). This component produces the same codes as the Google Authenticator app and can be used for 2FA.

Elements can be created (with optional expiration dates), arranged and edited using `arc` and are stored on `arc` as AES256 encrypted (and compressed) raw data.

<p align="center">
  <img src="https://raw.githubusercontent.com/evilsocket/arc/master/screenshot.png" alt="ARC"/>
</p>

## Hardware? 

Ideally `arc` should run on a dedicated portable hardware like a Raspberry Pi Zero, for instance it is possible to simply access it via Bluetooth and a modern browser once configured [btnap](https://github.com/bablokb/pi-btnap), but precompiled versions are available for [several operating systems and architectures](https://github.com/evilsocket/arc/releases) (including ARM, ARM64 and MIPS) therefore Arc can run on pretty much everything with a CPU, from [your smartphone](https://twitter.com/evilsocket/status/942846649713426434), your router, your Mac or your Windows computer. As a rule of thumb, the more [isolated](https://en.wikipedia.org/wiki/Compartmentalization_(information_security)) the hardware is, the better. 

The idea is to use Arc as a single storage and manager for your passwords, encrypted notes, files and `-all the secret things here-`.

<p align="center">
    <img src="https://i.imgur.com/h5cpCeN.png" alt="Encrypt all the things!"/>
</p>

## Usage

The simplest way to run `arc` is as a Docker container. First, make sure to copy `sample_config.toml` into your own `config.toml`. 

The most important fields to change are the `secret` ( a key used for token authentication ), the `username` and the `password`, which is the `bcrypt` hash of the authentication password you want to use, you can generate a new one with:

```sh
docker run -it evilsocket/arc:latest password "your-new-password" <optional-cost>
```

**NOTE**

Other than the username and the password, during login you need to specify an additional encryption key. This second key is not used to login to the system itself but to encrypt and decrypt your records client side. You can specify different keys each time you login, as long as you remember which key you used to encrypt which record :)

Once everything is ready and you updated the configuration file, you can finally start the `arc` server:

```sh
docker run -it --network host \
    -v /path/to/your/config.toml:/etc/arc/config.toml \
    -v /path/to/data:/arc \
    -v $HOME/.config/tsnet-arc:/root/.config/tsnet-arc \
    evilsocket/arc:latest
```

Now browse `https://localhost:8443/` ( or the address and port you configured ) and login with the configured credentials (make sure to add the generated HTTPS certificate as an exception in your browser).

Alternatively, you can find binary releases of Arc [here](https://github.com/evilsocket/arc/releases). 

If instead you want to build it from source, make sure you have Go >= 1.22.x installed and configured correctly, then clone this repository, install the dependencies and compile the `arc` server component:

    go install github.com/evilsocket/arc/cmd/arc@latest

## Tailscale / Headscale Integration

In order to run an ARC instance that's only visible on a [Tailscale](https://tailscale.com/) (WireGuard) network you can use the `[tailscale]` configuration block. 

By setting the `url` field, it is possible to override the control API URL and use free alternatives such as [Headscale](https://headscale.net/).

```toml
# .... snippet ....
[tailscale]
# If true, will run this as a tailscale server node and won't be visible outside the tailscale network.
# In order to authenticate the node, set the TS_AUTHKEY environment variable or follow the onscreen instructions.
enabled = false
# Tailscale hostname, if left empty the system hostname will be used.
# NOTE: Make sure that HTTPS certificates are enabled for this tailscale host and that the hostname
# matches the certificate.
hostname = "stevie"
# If set, it overrides the Tailscale control URL, can be used for Headscale and alikes.
url = ''
# .... snippet ....
```

## Realtime Notifications

Different type of events can happen during Arc lifecycle:

- `login_ok` someone succesfully authenticated to the system.
- `login_ko` someone tried to authenticate to the system with the wrong credentials.
- `token_ko` an invalid JWT token has been used to access Arc API.
- `update` a new version of Arc is available.
- `record_expired` a record reached its expiration date.

If configured to do so, the server will create brief reports of such events and it will send to the user and client using three different channels:

- A notification inside the Arc web UI itself.
- A desktop notification.
- An email report to the configured address.

### PGP Encryption

Email reports can be optionally encrypted by the server using PGP, in this case the user has to provide his PGP public key. A private key can also be provided, if not the server will generate a new one (4096 bits RSA) during the first boot. **Since email reports might include parts of valid credentials (ie. you mistyped one character of the valid password) it is highly suggested to enable this option.**

## Keyboard Shortcuts

- `n` Create a new item ( store or record ).
- `d` Delete the current item ( store or record ).
- `r` Rename the current item ( store or record ).
- `a` Add a new field to the current record.
- `p` Pin / unpin the curret record.
- `s` Save the current record.
- `e` Set the expiration date for the current record.
- `ESC` Close the current window.

## Import / Export

You can export stores and their encrypted records to a TAR file:

    ./arc -config config.toml -output ~/backup.tar -export

Exported archives can be later imported with:

    ./arc -config config.toml -import ~/backup.tar

## Useful Commands

Generate self signed certificate in order to use Arc on HTTPS:

    openssl req -new -x509 -sha256 -key key.pem -out certificate-pem -days 365  

Allow the `arc` binary to bind to privileged ports without having root privileges (bind to port 443 for HTTPS without root):

    sudo setcap 'cap_net_bind_service=+ep' arc

Lines to add to `/etc/rc.local` in order to make arc start at boot (running as `pi` user, configuration, logs and and ui are in the home folder):

    export ARC=/home/pi/
    sudo -H -u pi bash -c "$ARC/arc -config $ARC/config.toml -log-file $ARC/arc.log &"

## Bugs

Before opening an issue, please make sure it is not already part of [a known bug](https://github.com/evilsocket/arc/issues?q=is%3Aopen+is%3Aissue+label%3Abug).

## License

Arc was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

