/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

// DO NOT USE THIS CODE, IT'S HERE ONLY FOR BACKWARD COMPATIBILITY  
// Ref: https://twitter.com/veorq/status/943506635317825536

function PBKDF2_cbc(passphrase, salt) {
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
          name: 'AES-CBC', 
          length: AES_KEY_SIZE
        },
        false,
        ["encrypt", "decrypt"],
      ),
    );
}

function decrypt_cbc(data, passphrase) {
    const [ salt, iv, ciphertext ] = unmerge(data);

    var doDeriveKey = PBKDF2_cbc( passphrase, salt );

    return doDeriveKey.then( derivedKey  => 
        crypto.subtle.decrypt({ name: 'AES-CBC', iv }, derivedKey, ciphertext)
    )
    .then(v => buf2utf(v));
}
