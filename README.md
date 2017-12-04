# Vault

Vault is an API and HTML+js application server for your secrets.

![very wip](https://i.imgflip.com/20c6dg.jpg)

## Usage

Compile the vault server:
    
    cd vault-repo-path
    make

Customize access credentials:

    cp sample_config config.json
    vim config.json

Run the `Secrets Manager` web application, the first time `vaultd` will automatically create its encrypted store:

    ./vaultd -config config.json -app webapps/secrets_manager

Browse `http://localhost:8080/` and login with the credentials you specified in the `config.json` file.

## License

`vaultd` and the `Secrets Manager` app were made with ♥  by [Simone Margaritelli](https://www.evilsocket.net/) and they're released under the GPL 3 license.

