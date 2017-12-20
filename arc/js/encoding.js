/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
var BASE64_PREFIX = 'data:';
var BASE64_PREFIX_LEN = BASE64_PREFIX.length;
var BASE64_ENCODING = ';base64,';
var BASE64_ENCODING_LEN = BASE64_ENCODING.length;

function IsBase64(file) {
    // file.data should be:
    //
    // data:MIME-TYPE-HERE;base64,ENCODED-DATA
    return ( 
        typeof(file.data) == 'string' &&
        file.data.length > BASE64_PREFIX.length && 
        file.data.substring(0, BASE64_PREFIX_LEN) == BASE64_PREFIX
    );
}

function FileEncoded(file) {
    // new record, already encoded
    if( IsBase64(file) ) {
        return file.data;
    } 
    // convert old records which were binary
    else {
        console.log( "Found legacy file, encoding to base64" );
        return BASE64_PREFIX +  file.type + BASE64_ENCODING + btoa(file.data);
    }
}

function FileToUint8Array(file) {
    // new records need to be decoded
    if( IsBase64(file) ) {
        var idx = file.data.indexOf(BASE64_ENCODING);
        if( idx != -1 ) {
            file.data = atob( file.data.substr( idx + BASE64_ENCODING_LEN ) );
        }
        else {
            alert("This is a very special file ... but it is broken :(");
        }
    }
    
    // https://stackoverflow.com/questions/23795034/creating-a-blob-or-a-file-from-javascript-binary-string-changes-the-number-of-by
    var size = file.size;
    var bytes = new Uint8Array(size);
    for( var i = 0; i < size; i++ ) {
        bytes[i] = file.data.charCodeAt(i);
    }

    return bytes;
}

function utf2buf(str) {
  return new TextEncoder("utf-8").encode(str);
}

function buf2utf(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

function a2buf(str) {
    return new Uint8Array( str.split('').map(c => c.charCodeAt(0)) );
}

function buf2a(buff) {
    var i, len = buff.length, b_str = "";
    for (i=0; i<len; i++) {
        b_str += String.fromCharCode(buff[i]);
    }
    return b_str;
}

