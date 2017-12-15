/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

if( !window.crypto ) {
    alert("This browser does not support WebCrypto, please use a modern browser for Arc.");
} 
else if( !window.crypto.subtle && window.crypto.webkitSubtle ) {
    window.crypto.subtle = window.crypto.webkitSubtle;
}

const AES_SALT_SIZE  = 16;
const AES_IV_SIZE    = 16;
const AES_KEY_SIZE   = 256;
const AES_ITERATIONS = 10000;
const AES_MODE       = 'CBC';

function utf2buf(str) {
  return new TextEncoder("utf-8").encode(str);
}

function buf2utf(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

function pack(str) {
    return new Uint8Array( str.split('').map(c => c.charCodeAt(0)) );
}

function unpack(buff) {
    var i, len = buff.length, b_str = "";
    for (i=0; i<len; i++) {
        b_str += String.fromCharCode(buff[i]);
    }
    return b_str;
}

function merge(salt, iv, ciphertext) {
    var buff = new Uint8Array( AES_SALT_SIZE + AES_IV_SIZE + ciphertext.length );
    buff.set( salt );
    buff.set( iv, AES_SALT_SIZE );
    buff.set( ciphertext, AES_SALT_SIZE + AES_IV_SIZE );
    return unpack(buff);
}

function unmerge(data) {
    const salt_idx = 0;
    const iv_idx   = AES_SALT_SIZE;
    const data_idx = iv_idx + AES_IV_SIZE;
    const salt = pack( data.substr( salt_idx, AES_SALT_SIZE ) );
    const iv = pack( data.substr( iv_idx, AES_IV_SIZE ) );
    const ciphertext = pack( data.substr( data_idx ) );
    return [salt, iv, ciphertext];
}

function PBKDF2(passphrase, salt) {
  return crypto.subtle
    .importKey( "raw", utf2buf(passphrase), "PBKDF2", false, ["deriveKey"])
    .then(key =>
      crypto.subtle.deriveKey(
        { 
            name: "PBKDF2", 
            salt, 
            iterations: AES_ITERATIONS, 
            hash: "SHA-256" 
        },
        key,
        { 
            name: "AES-" + AES_MODE, 
            length: AES_KEY_SIZE
        },
        false,
        ["encrypt", "decrypt"],
      ),
    )
    .then(key => [key, salt]);
}

function AESEncrypt(message, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array( AES_SALT_SIZE ));
    const iv   = crypto.getRandomValues(new Uint8Array( AES_IV_SIZE ));
    const data = utf2buf(message); 
    return PBKDF2( passphrase, salt ).then( ([key, salt]) => 
      crypto.subtle.encrypt({ name: "AES-" + AES_MODE, iv }, key, data)
        .then( ciphertext => merge(salt, iv, new Uint8Array(ciphertext) ) ),
    );
}

function AESDecrypt(data, passphrase) {
    const [ salt, iv, ciphertext ] = unmerge(data);
    return PBKDF2( passphrase, salt )
      .then(([key]) => crypto.subtle.decrypt({ name: "AES-" + AES_MODE, iv }, key, ciphertext))
      .then(v => buf2utf(new Uint8Array(v)));
}
