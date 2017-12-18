/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
window.onerror = function (message, file, line, col, error) {
    var s = "Ooops, something went wrong!\n\n" +
            "There was an unhandled error on " + file + ":" + line + ":" + col + ":\n\n" +
            "Error: " + message + "\n\n" + 
            "---------------------------------------------------------------" + 
            "------------------------------------------------------------------------\n" + 
            "Please copy this message and report the bug here https://github.com/evilsocket/arc/issues/";
    alert(s);
    return false;
};


