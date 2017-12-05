# Vault

Vault is an API and HTML+js application server for your secrets.

## Usage

Install the dependencies of `vaultd`:

    cd vault-repo-path/vaultd
    make vendor_get
    
Compile `vaultd`:
    
    make

Customize access credentials:

    cp sample_config config.json
    vim config.json

Run the `vault` web application, the first time `vaultd` will automatically load some example stores from the `vault/seeds.json` seed file (encryption key is `vault`):

    ./vaultd -config config.json -app ../vault

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

## Export and import stores.

You can export stores and their encrypted records to a JSON file:

    ./vaultd -config config.json -output ~/backup.json -export

Or export only one store by its numeric id:

    ./vaultd -config config.json -output ~/vault_store_1.json -export -store 1 

Such export files can be later imported with:

    ./vaultd -config config.json -import ~/backup.json

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

