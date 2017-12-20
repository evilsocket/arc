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
}

Record.prototype.AddEntry = function(entry) {
    this.entries.push(entry);
}

Record.prototype.toData = function() {
   for( var i = 0; i < this.entries.length; i++ ) {
        this.entries[i].is_new = false;
    }
    return JSON.stringify(this.entries); 
}

Record.prototype.isValidData = function(data) {
    return ( data == "[]" || data.indexOf('"value"') != -1 );
}

Record.prototype.fromData = function(data) {
    if( this.isValidData(data) ) {
        var objects = JSON.parse(data);
        console.log( "Record has " + objects.length + " entries." );
        this.entries = [];
        for( var i = 0; i < objects.length; i++ ) {
            this.AddEntry( TypeFactory(objects[i]) );
        }
    } else {
        throw "Invalid record data.";
    }
}

Record.prototype.Encrypt = function( key ) {
    var data = this.toData(); 
    console.log( "Encrypting " + data.length + " bytes of record." );
    return encrypt( data, key );
}

Record.prototype.Decrypt = function( algo, key, data, success, error ) {
    var record = this;
    const on_data = function(decrypted) {
        console.log( "Decrypted " + decrypted.length + " bytes of plaintext." );
        try {
            record.fromData(decrypted);
            success();
        }
        catch(e) {
            error(e); 
        }
    };

    if( algo == 'none' ) {
        on_data(data);
    }
    else {
        console.log( "Decrypting " + data.length + " bytes of data." );
        decrypt( data, key ).then(on_data).catch(function(e){
            console.log(e);
            console.log( "GCM failed, trying CBC for legacy data ...");
            // let's see if it's legacy data in CBC mode
            decrypt_cbc( data, key ).then(on_data).catch(error);
        });
    }
}

