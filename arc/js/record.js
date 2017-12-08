/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

// code taken from http://www.adonespitogo.com/articles/encrypting-data-with-cryptojs-aes/
var keySize = 256;
var ivSize = 128;
var iterations = 100;

function encrypt (msg, pass) {
  var salt = CryptoJS.lib.WordArray.random(128/8);

  var key = CryptoJS.PBKDF2(pass, salt, {
      keySize: keySize/32,
      iterations: iterations
    });

  var iv = CryptoJS.lib.WordArray.random(128/8);

  var encrypted = CryptoJS.AES.encrypt(msg, key, { 
    iv: iv, 
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC

  });

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
  return transitmessage;
}

function decrypt (transitmessage, pass) {
  var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
  var encrypted = transitmessage.substring(64);

  var key = CryptoJS.PBKDF2(pass, salt, {
      keySize: keySize/32,
      iterations: iterations
    });

  var decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
    iv: iv, 
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC

  })
  return decrypted;
}

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

    console.log( "Encrypting " + data.length + " bytes of record." );
    // console.log(data);

    data = encrypt( data, key );

    console.log( "Encrypted data is " + data.length + " bytes." );
    // console.log(data);

    return data
}

Record.prototype.isValidData = function(data) {
    return ( data == "[]" || data.indexOf('"value"') != -1 );
}

Record.prototype.Decrypt = function( key, data ) {
    console.log( "Decrypting " + data.length + " bytes of record." );
    // console.log(data);

    try {
        data = decrypt( data, key );
        // console.log(data);
        data = data.toString(CryptoJS.enc.Utf8);
        // console.log(data);
    }
    catch(err) {
        console.error(err);
        this.SetError( "Error while decrypting record data." );
        return;
    }

    console.log( "Decrypted data is " + data.length + " bytes." );

    // quick and dirty check
    if( this.isValidData(data) == false ) {
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

