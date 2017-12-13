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
    console.log( "RECORD ERROR: " + error);
    this.entries = [];
    this.error = error;
}

Record.prototype.HasError = function() {
    return ( this.error != null );
}

/* Return a Promise */
Record.prototype.Encrypt = function( key ) {
    for( var i = 0; i < this.entries.length; i++ ) {
        this.entries[i].is_new = false;
    }

    var data = JSON.stringify(this.entries); 

    console.log( "Encrypting " + data.length + " bytes of record." );
    // console.log(data);

    /* currenlty fake Promise */
    return Promise.resolve(AESEncrypt(data, key))
	.then((encrypted) => {
	    console.log( "Encrypted data is " + encrypted.length + " bytes." );
	    return encrypted;
	});
}

Record.prototype.isValidData = function(data) {
    return ( data == "[]" || data.indexOf('"value"') != -1 );
}

/* Return a Promise */
Record.prototype.Decrypt = function( key, data ) {
    console.log( "Decrypting " + data.length + " bytes of record." );
    // console.log(data);

    const that = this;
    /* currently fake Promise */
    return Promise.resolve(AESDecrypt(data, key))
	.then((decrypted) => {
	    try {
		decrypted = decrypted.toString(CryptoJS.enc.Utf8);
	    } catch (error) {
		throw "Error while decrypting record data.";
	    }

	    console.log( "Decrypted data is " + decrypted.length + " bytes." );

	    // quick and dirty check
	    if( that.isValidData(decrypted) === false ) {
		throw "Error while decrypting record data.";
	    } else {
		const objects = JSON.parse(decrypted);

		console.log( "Record has " + objects.length + " entries." );

		that.entries = [];
		for( var i = 0; i < objects.length; i++ ) {
		    var entry = TypeFactory(objects[i]);
		    // console.log( "record.entries[" + i + "] = " + entry.TypeName() );
		    that.entries.push(entry);
		}
	    }
	}).catch((error) => {
	    console.error(error);
	    that.setError(error);
	});
}
