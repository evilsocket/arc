/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

var AESKeySize = 256;
var AESSaltSize = 16;
var AESIvSize = 16;
var AESIterations = 100;

function AESEncrypt(message, passphrase) {
    var salt = CryptoJS.lib.WordArray.random(AESSaltSize);
    var key  = CryptoJS.PBKDF2( passphrase, salt, {
        keySize: AESKeySize / 32,
        iterations: AESIterations
    });

    var iv = CryptoJS.lib.WordArray.random(AESIvSize);
    var encrypted = CryptoJS.AES.encrypt( message, key, { 
        iv: iv, 
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });

    return salt.toString()+ iv.toString() + encrypted.toString();
}

/*
 * Encrypted data format is:
 *
 * [hex salt] + [hex iv] + [base64 encrypted data]
 */
function AESDecrypt(encrypted, passphrase) {
    var salt_idx  = 0;
    var salt_size = AESSaltSize * 2;
    var iv_idx    = salt_size;
    var iv_size   = AESIvSize * 2;
    var data_idx  = iv_idx + iv_size;

    var salt = CryptoJS.enc.Hex.parse( encrypted.substr(salt_idx, salt_size) );
    var key = CryptoJS.PBKDF2( passphrase, salt, {
        keySize: AESKeySize / 32,
        iterations: AESIterations
    });

    var iv = CryptoJS.enc.Hex.parse( encrypted.substr(iv_idx, iv_size) )
    var data = encrypted.substring(data_idx);

    return CryptoJS.AES.decrypt( data, key, { 
        iv: iv, 
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });
}

