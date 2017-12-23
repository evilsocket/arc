/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

const errors = checkPrerequisites();
if( errors && errors.length > 0 ) {
    let msg = "Arc version: " + VERSION + "\n" +
              "Browser: " + navigator.userAgent + "\n" +
              "\nThis browser does not support WebCrypto, at least not completely, " + 
              "please use a modern browser for Arc.\n\nMissing components:\n\n";

    for( let i = 0; i < errors.length; i++ ) {
        const [ name, expected, found ] = errors[i];
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
    if( window.crypto && !window.crypto.subtle) {
        if (window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        } else if (window.crypto.msSubtle) {
            window.crypto.subtle = window.crypto.msSubtle;
        }
    }

    const checks = [
        [ 'window.crypto', 'object' ],
        [ 'window.crypto.subtle', 'object' ],
        [ 'TextEncoder', 'function' ],
        [ 'TextDecoder', 'function' ],
        [ 'Uint8Array', 'function' ]
    ];

    const errors = [];
    for( let i = 0; i < checks.length; i++ ) {
        const [ name, expected ] = checks[i];
        const what = eval(name);
        const type = typeof(what);
        if( type !== expected ) {
           errors.push([name, expected, type]); 
        }
    }

    return errors;
}

function merge(salt, iv, ciphertext) {
    const buff = new Uint8Array( PBKDF_SALT_SIZE + AES_IV_SIZE + ciphertext.length );

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

async function PBKDF2(passphrase, salt) {
    passphrase = typeof(passphrase) === 'object' ? passphrase : utf2buf(passphrase);

    const passphraseKey = await crypto.subtle.importKey( "raw", passphrase, "PBKDF2", false, ["deriveKey"]);

    return await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: PBKDF_ITERATIONS, hash: "SHA-256" }
        , passphraseKey
        , { name: AES_MODE, length: AES_KEY_SIZE}
        , false
        , ["encrypt", "decrypt"]
    );
}

function padAuthenticationMessage(base) {
    const size = base.length;

    if( size > 128 ) {
        alert("GCM supports up to 128 bytes of authentication data!");
    }
    const pad = 128 - size;
    for( let i = 0; i < pad; ++i ) {
        base += '/';
    }
    return utf2buf(base);
}

async function encrypt(message, passphrase) {
    const salt      = crypto.getRandomValues(new Uint8Array( PBKDF_SALT_SIZE ));
    const iv        = crypto.getRandomValues(new Uint8Array( AES_IV_SIZE ));
    const plaintext = utf2buf(message); 

    const derivedKey = await PBKDF2( passphrase, salt );

    const ciphertext = await crypto.subtle.encrypt(
        { name: AES_MODE, iv: iv, tagLength: GCM_AD.length, additionalData: GCM_AD }
        , derivedKey
        , plaintext
    );

    return merge(salt, iv, new Uint8Array(ciphertext));
}

async function decrypt(data, passphrase) {
    const [ salt, iv, ciphertext ] = unmerge(data);

    const derivedKey = await PBKDF2( passphrase, salt );

    const plaintext = await crypto.subtle.decrypt(
        { name: AES_MODE, iv: iv, tagLength: GCM_AD.length, additionalData: GCM_AD }
        , derivedKey
        , ciphertext
    );

    return buf2utf(plaintext);
}
