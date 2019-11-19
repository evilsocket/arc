/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

var errors = checkPrerequisites();
if( errors && errors.length > 0 ) {
    var msg = "Arc version: " + VERSION + "\n" + 
              "Browser: " + navigator.userAgent + "\n" +
              "\nThis browser does not support WebCrypto, at least not completely, " + 
              "please use a modern browser for Arc.\n\nMissing components:\n\n";

    for( var i = 0; i < errors.length; i++ ) {
        var [ name, expected, found ] = errors[i];
        msg += "Component '" + name + "' was expected to be '" + expected + "' but is '" + found + "'.\n";
    }

    alert(msg);
} 

const PBKDF_SALT_SIZE  = 16;
const PBKDF_ITERATIONS = 10000;
const AES_IV_SIZE      = 16;
const AES_KEY_SIZE     = 256;
const AES_MODE         = 'AES-GCM';
const GCM_AD           = padAuthenticationMessage('Thanks to JP Aumasson > https://twitter.com/veorq/status/943506635317825536');

function checkPrerequisites() {
    if( window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle ) {
        window.crypto.subtle = window.crypto.webkitSubtle;
    }

    var checks = [
        [ 'window.crypto', 'object' ],
        [ 'window.crypto.subtle', 'object' ],
        [ 'TextEncoder', 'function' ],
        [ 'TextDecoder', 'function' ],
        [ 'Uint8Array', 'function' ]
    ];

    var errors = [];
    for( var i = 0; i < checks.length; i++ ) {
        var [ name, expected ] = checks[i];
        var what = eval(name);
        var type = typeof(what);
        if( type != expected ) {
           errors.push([name, expected, type]); 
        }
    }

    return errors;
}

function merge(salt, iv, ciphertext) {
    var buff = new Uint8Array( PBKDF_SALT_SIZE + AES_IV_SIZE + ciphertext.length );

    buff.set( salt );
    buff.set( iv, PBKDF_SALT_SIZE );
    buff.set( ciphertext, PBKDF_SALT_SIZE + AES_IV_SIZE );

    return buf2a(buff);
}

function unmerge(data) {
    const salt_idx = 0;
    const iv_idx   = PBKDF_SALT_SIZE;
    const data_idx = iv_idx + AES_IV_SIZE;

    const salt       = a2buf( data.substr( salt_idx, PBKDF_SALT_SIZE ) );
    const iv         = a2buf( data.substr( iv_idx, AES_IV_SIZE ) );
    const ciphertext = a2buf( data.substr( data_idx ) );

    return [salt, iv, ciphertext];
}

function PBKDF2(passphrase, salt) {
    passphrase = typeof(passphrase) == 'object' ? passphrase : utf2buf(passphrase);

    return crypto.subtle
    .importKey( "raw", passphrase, "PBKDF2", false, ["deriveKey"])
    .then( key =>
      crypto.subtle.deriveKey({ 
          name: "PBKDF2", 
          salt, 
          iterations: PBKDF_ITERATIONS, 
          hash: "SHA-256" 
        },
        key,
        { 
          name: AES_MODE, 
          length: AES_KEY_SIZE
        },
        false,
        ["encrypt", "decrypt"],
      ),
    );
}

function padAuthenticationMessage(base) {
    var size = base.length;

    if( size > 128 ) {
        alert("GCM supports up to 128 bytes of authentication data!");
    }
    var pad = 128 - size;
    for( var i = 0; i < pad; ++i ) {
        base += '/';
    }
    return utf2buf(base);
}

function encrypt(message, passphrase) {
    const salt      = crypto.getRandomValues(new Uint8Array( PBKDF_SALT_SIZE ));
    const iv        = crypto.getRandomValues(new Uint8Array( AES_IV_SIZE ));
    const plaintext = utf2buf(message); 

    var doDeriveKey = PBKDF2( passphrase, salt );

    return doDeriveKey.then( derivedKey => 
        crypto.subtle.encrypt({ name: AES_MODE, iv: iv, tagLength: GCM_AD.length, additionalData:GCM_AD }, derivedKey, plaintext)
            .then( ciphertext => merge( salt, iv, new Uint8Array(ciphertext) ) ),
    );
}

function decrypt(data, passphrase) {
    const [ salt, iv, ciphertext ] = unmerge(data);

    var doDeriveKey = PBKDF2( passphrase, salt );

    return doDeriveKey.then( derivedKey  => 
        crypto.subtle.decrypt({ name: AES_MODE, iv: iv, tagLength: GCM_AD.length, additionalData: GCM_AD }, derivedKey, ciphertext)
    )
    .then(v => buf2utf(v));
}
