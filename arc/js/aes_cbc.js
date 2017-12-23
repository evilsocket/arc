/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

// DO NOT USE THIS CODE, IT'S HERE ONLY FOR BACKWARD COMPATIBILITY  
// Ref: https://twitter.com/veorq/status/943506635317825536

async function PBKDF2_cbc(passphrase, salt) {
    passphrase = typeof(passphrase) === 'object' ? passphrase : utf2buf(passphrase);

    const passphraseKey = await crypto.subtle.importKey( "raw", passphrase, "PBKDF2", false, ["deriveKey"]);

    return await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: PBKDF_ITERATIONS, hash: "SHA-256" }
        , passphraseKey
        , { name: 'AES-CBC', length: AES_KEY_SIZE }
        , false
        , [ "encrypt", "decrypt" ]);
}

async function decrypt_cbc(data, passphrase) {
    const [ salt, iv, ciphertext ] = unmerge(data);

    const derivedKey = await PBKDF2_cbc( passphrase, salt );

    const plaintext = await crypto.subtle.decrypt( { name: 'AES-CBC', iv }, derivedKey, ciphertext);

    return buf2utf(plaintext);
}
