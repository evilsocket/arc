if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
    window.crypto.subtle = window.crypto.webkitSubtle;
}

const crypto_utils = {
    /* size in bytes */
    getRandomValues: (nelements, size = 1, signed = false) => {
	let buffer;
	switch (size) {
	case 2:
	    buffer = signed === true ? new Int16Array(nelements) : new Uint32Array(nelements);
	    window.crypto.getRandomValues(buffer);
	    break;
	case 4:
	    buffer = signed === true ? new Int32Array(nelements) : new Uint32Array(nelements);
	    window.crypto.getRandomValues(buffer);
	    break;
	case 1:
	default:
	    buffer = signed === true ? new Int8Array(nelements) : new Uint8Array(nelements);
	    window.crypto.getRandomValues(buffer);
	}
	return buffer;
    },

    getBaseKey: (
	keyData,
	algo,
	format = "raw"
    ) => window.crypto.subtle.importKey(
	format,
	keyData,
	algo,
	false,
	["deriveKey"]
    ),

    getDerivedKey: (
	keyData, baseKeyAlgo, format,
	derivationAlgo,
	derivatedKeyAlgo,
	usage,
	extractable = false
    ) => crypto_utils.getBaseKey(keyData, baseKeyAlgo, format).then((baseKey) => {
	return crypto.subtle.deriveKey(
	    derivationAlgo,
	    baseKey,
	    derivatedKeyAlgo,
	    extractable,
	    usage
	)
    }),
};

Uint8Array.prototype.toHex = function() {
    let hex = "";
    this.forEach((x) => hex += ("00" + x.toString(16)).slice(-2));
    return hex;
};
Uint8Array.prototype.toBase64 = function() {
    let s = "";
    this.forEach((x) => s += String.fromCharCode(x));
    return btoa(s);
};
Uint8Array.fromHex = function(hex) {
    const uint8 = new Uint8Array(hex.length / 2);
    for (let i = 0, j = 0; i <= hex.length - 2; i += 2, j++)
	uint8[j] = parseInt('' + hex[i] + hex[i + 1], 16);

    return uint8;
};
Uint8Array.fromBase64 = function(base64) {
    base64 = atob(base64);
    const uint8 = new Uint8Array(base64.length);
    for (let i = 0; i < base64.length; ++i)
	uint8[i] = base64.charCodeAt(i);
    return uint8;
};

/* get a key (and related salt) using pbkdf2 */
const pbkdf2 = ({
    passphrase,
    salt = crypto_utils.getRandomValues(16),
    iterations = 100,
    hash = "SHA-256",
    derivedKeyAlgo,
    usage
} = {}) => crypto_utils.getDerivedKey(
    new TextEncoder("utf-8").encode(passphrase), {"name": "PBKDF2"}, "raw",
    {"name": "PBKDF2", salt, iterations, hash},
    derivedKeyAlgo,
    usage,
    false
).then((key) => {
    key.salt = salt;
    return key;
});
