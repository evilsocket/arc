# Ark

Ark is an API and HTML+js application server for your secrets.

## Usage

Download, install dependencies and compile the `arkd` server component:

    git clone https://github.com/evilsocket/ark
    cd ark/arkd
    make vendor_get
    make

Customize the configuration:

    cp sample_config config.json
    vim config.json

Run the `ark` web application, the first time `arkd` will automatically load some example stores from the `ark/seeds.json` seed file (encryption key is `vault`):

    ./arkd -config config.json -app ../ark

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

## Export and import stores.

You can export stores and their encrypted records to a JSON file:

    ./arkd -config config.json -output ~/backup.json -export

Or export only one store by its numeric id:

    ./arkd -config config.json -output ~/ark_store_1.json -export -store 1 

Such export files can be later imported with:

    ./arkd -config config.json -import ~/backup.json

## Screenshots

Both `arkd` and the `Secrets Manager` app are work in progress, you might experience some differences with the following screenshots.

Using different encryption keys for different records.
![multikey](https://pbs.twimg.com/media/DQN8W1KWsAEP6bd.jpg:large)

Attaching files.
![files](https://pbs.twimg.com/media/DQN8vAtW0AEho6Z.jpg:large)

Password complexity audit and generator.
![passgen](https://pbs.twimg.com/media/DQN8vAiXkAA9x1z.jpg:large)

Markdown notepad.
![notepad](https://pbs.twimg.com/media/DQOmJ8tW4AE7W_H.jpg:large)

## License

Ark was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

