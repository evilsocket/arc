/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

function Record(title) {
    this.title = title;
    this.entries = [];
}

Record.prototype.AddEntry = function (entry) {
    this.entries.push(entry);
};

Record.prototype.toData = function () {
    for (let i = 0; i < this.entries.length; i++) {
        this.entries[i].is_new = false;
    }
    return JSON.stringify(this.entries);
};

Record.prototype.isValidData = function (data) {
    return (data === "[]" || data.indexOf('"value"') !== -1);
};

Record.prototype.fromData = function (data) {
    if (this.isValidData(data)) {
        const objects = JSON.parse(data);
        console.log("Record has " + objects.length + " entries.");
        this.entries = [];
        for (let i = 0; i < objects.length; i++) {
            this.AddEntry(TypeFactory(objects[i]));
        }
    } else {
        throw "Invalid record data.";
    }
};

Record.prototype.Encrypt = async function (key) {
    const data = this.toData();
    console.log("Encrypting " + data.length + " bytes of record.");
    return await encrypt(data, key);
};

Record.prototype.Decrypt = async function (algo, key, data, success, error) {
    const record = this;
    const on_data = function (decrypted) {
        console.log("Decrypted " + decrypted.length + " bytes of plaintext.");
        try {
            record.fromData(decrypted);
            success();
        }
        catch (e) {
            error(e);
        }
    };

    if (algo === 'none') {
        on_data(data);
    }
    else {
        console.log("Decrypting " + data.length + " bytes of data.");
        let err, decrypted;

        [err, decrypted] = await to(decrypt(data, key));
        if (err) {
            console.log(err);
            console.log("GCM failed, trying CBC for legacy data ...");
            // let's see if it's legacy data in CBC mode
            [err, decrypted] = await to(decrypt_cbc(data, key));
            if (err) {
                error(err);
                return;
            }
        }

        if (decrypted) {
            on_data(decrypted);
        } else {
            error(new Error("Decrypted data unavailable"))
        }
    }
};

