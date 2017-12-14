const AESKeySize = 256;
const AESSaltSize = 16;
const AESIvSize = 16;
const AESIterations = 100;

/*
 * Encrypted data format is:
 *
 * [hex salt] + [hex iv] + [base64 encrypted data]
 *
 * Encryptions goes in this way:
 * message -> array_buffer -> (AES ENCRYPTION) -> array_buffer -> [hex_salt] + [hex_iv] + [base64_enc]
 */
function AESEncrypt2(message, passphrase) {
    return pbkdf2({
	passphrase,
	derivedKeyAlgo: {"name": "AES-CBC", "length": AESKeySize},
	usage: ["encrypt"]
    }).then((key) => {
	const iv = crypto_utils.getRandomValues(AESSaltSize);
	return window.crypto.subtle.encrypt(
	    {"name": "AES-CBC", iv},
	    key,
	    new TextEncoder("utf-8").encode(message)
	).then((encrypted) => {
	    const hex_salt = new Uint8Array(key.salt).toHex();
	    const hex_iv = new Uint8Array(iv).toHex();
	    const base64_enc = new Uint8Array(encrypted).toBase64();
	    return hex_salt + hex_iv + base64_enc;
	});
    });
}

/*
 *
 * Decryption goes in this way:
 * [hex_salt] + [hex_iv] + [base64 enc] -> array_buffer -> (AES DECRYPTION) -> array_buffer -> message
 */
function AESDecrypt2(encrypted, passphrase) {
    const salt_idx  = 0;
    const salt_size = AESSaltSize * 2;
    const iv_idx    = salt_size;
    const iv_size   = AESIvSize * 2;
    const data_idx  = iv_idx + iv_size;

    const salt = Uint8Array.fromHex(encrypted.substr(salt_idx, salt_size));
    const iv = Uint8Array.fromHex(encrypted.substr(iv_idx, iv_size));
    encrypted = Uint8Array.fromBase64(encrypted.substring(data_idx));

    return pbkdf2({
	passphrase,
	derivedKeyAlgo: {"name": "AES-CBC", "length": AESKeySize},
	usage: ["decrypt"],
	salt
    }).then((key) => {
	return window.crypto.subtle.decrypt(
	    {"name": "AES-CBC", iv},
	    key,
	    encrypted
	).then((decrypted) => {
	    decrypted = new TextDecoder("utf-8").decode(decrypted);
	    return decrypted;
	});
    });
}
