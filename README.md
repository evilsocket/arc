# Arc

Arc is an API and HTML+js application server for your secrets.

## Usage

Download, install dependencies and compile the `arcd` server component:

    git clone https://github.com/evilsocket/arc
    cd arc/arcd
    make vendor_get
    make

Now copy the `sample_config.json` file to a new `config.json' file, customize and run the `arc` web application:

    ./arcd -config config.json -app ../arc

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

**Note**

The first time the `arcd` server executes the `arc` web application. it will automatically import some example stores from the `arc/seeds.json` seed file (encryption key is `vault`).

## Export and import stores.

You can export stores and their encrypted records to a JSON file:

    ./arcd -config config.json -output ~/backup.json -export

Or export only one store by its numeric id:

    ./arcd -config config.json -output ~/arc_store_1.json -export -store 1 

Such export files can be later imported with:

    ./arcd -config config.json -import ~/backup.json

## Screenshots

Both `arcd` and the `Secrets Manager` app are work in progress, you might experience some differences with the following screenshots.

Using different encryption keys for different records.
![multikey](https://pbs.twimg.com/media/DQN8W1KWsAEP6bd.jpg:large)

Attaching files.
![files](https://pbs.twimg.com/media/DQN8vAtW0AEho6Z.jpg:large)

Password complexity audit and generator.
![passgen](https://pbs.twimg.com/media/DQN8vAiXkAA9x1z.jpg:large)

Marcdown notepad.
![notepad](https://pbs.twimg.com/media/DQOmJ8tW4AE7W_H.jpg:large)

## License

Arc was made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and it is released under the GPL 3 license.

