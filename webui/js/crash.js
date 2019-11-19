/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
window.onerror = function (message, file, line, col, error) {
    var s = "Arc version: " + VERSION + "\n" + 
            "Browser: " + navigator.userAgent + "\n" +
            "Unhandled error on " + file + ":" + line + ":" + col + "\n" +
            "\n" + message + "\n\n" + 
            "---------------------------------------------------------------" + 
            "------------------------------------------------------------------------\n" + 
            "Please copy this message and report the bug here https://github.com/evilsocket/arc/issues/";
    alert(s);
    return false;
};


