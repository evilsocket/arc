# Vault

Vault is an API and HTML+js application server for your secrets.

![very wip](https://i.imgflip.com/20c6dg.jpg)

## Usage

Compile the `vaultd` server:
    
    cd vault-repo-path/vaultd
    make

Customize access credentials:

    cp sample_config config.json
    vim config.json

Run the `Secrets Manager` web application, the first time `vaultd` will automatically create its encrypted store:

    ./vaultd -config config.json -app ../vault

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

## Screenshots

Both `vaultd` and the `Secrets Manager` app are work in progress, you might experience some differences with the following screenshots.

Using different encryption keys for different records.
![multikey](https://pbs.twimg.com/media/DQN8W1KWsAEP6bd.jpg:large)

Attaching files.
![files](https://pbs.twimg.com/media/DQN8vAtW0AEho6Z.jpg:large)

Password complexity audit and generator.
![passgen](https://pbs.twimg.com/media/DQN8vAiXkAA9x1z.jpg:large)

Markdown notepad.
![notepad](https://pbs.twimg.com/media/DQOmJ8tW4AE7W_H.jpg:large)

## License

Vault was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

