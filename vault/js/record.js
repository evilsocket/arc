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

Record.prototype.Encrypt = function( key ) {
    for( var i = 0; i < this.entries.length; i++ ) {
        this.entries[i].is_new = false;
    }

    var data = JSON.stringify(this.entries); 
    console.log( "Encrypting " + data.length + " bytes of password." );
    data = CryptoJS.AES.encrypt( data, key ).toString(); 
    console.log( "Encrypted data is " + data.length + " bytes." );
    return data
}

Record.prototype.Decrypt = function( key, data ) {
    console.log( "Decrypting " + data.length + " bytes of record." );
    try {
        data = CryptoJS.AES.decrypt( data, key ).toString(CryptoJS.enc.Utf8); 
    }
    catch(err) {
        this.SetError( "Error while decrypting record data." );
        return;
    }

    console.log( "Decrypted data is " + data.length + " bytes." );

    // quick and dirty check
    if( data.indexOf('"value"') == -1 ) {
        this.SetError( "Error while decrypting record data." );
    } else {
        var objects = JSON.parse(data);

        console.log( "Record has " + objects.length + " entries." );
        // console.log(data);

        this.entries = [];
        for( var i = 0; i < objects.length; i++ ) {
            var entry = TypeFactory(objects[i]);
            // console.log( "record.entries[" + i + "] = " + entry.TypeName() );
            this.entries.push(entry);
        }
    }
}

