/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
function Record(title) {
    this.title = title
    this.entries = [];
    this.error = null;
}

Record.prototype.AddEntry = function(entry) {
    this.entries.push(entry);
}

Record.prototype.SetError = function(error) {
    this.entries = [];
    this.error = error;
}

Record.prototype.HasError = function() {
    return ( this.error != null );
}

/* Return a Promise */
Record.prototype.Encrypt = function( key ) {
    this.entries.forEach((e) => e.is_new = false);

    const data = JSON.stringify(this.entries); 
    console.log(`Encrypting ${data.length} bytes of record.`);

    return AESEncrypt(data, key).then((encrypted) => {
	console.log(`Encrypted data is ${encrypted.length} bytes.`);
	return encrypted;
    });
}

Record.prototype.isValidData = function(data) {
    return ( data == "[]" || data.indexOf('"value"') != -1 );
}

Record.prototype.Decrypt = function( key, data ) {
    console.log(`Decrypting ${data.length} bytes of record.`);
    const that = this;

    return AESDecrypt(data, key).then((decrypted) => {
	console.log(`Decrypted data is ${decrypted.length} bytes.`);

	// quick and dirty check
	if (that.isValidData(decrypted) === false)
	    throw "Error while decrypting record data.";

	const objects = JSON.parse(decrypted);

	console.log(`Record has ${objects.length} entries.`);

	that.entries = [];
	objects.forEach((o) => that.entries.push(TypeFactory(o)));
    }).catch((error) => {
	console.error(error);
	that.SetError(error);
	throw error;
    });
}
