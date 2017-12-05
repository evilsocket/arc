/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
const ENTRY_TYPE_TEXT = 2;

function TextEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_TEXT, name, value );
}

TextEntry.prototype = Object.create(Entry.prototype);
TextEntry.prototype.constructor = TextEntry;

TextEntry.prototype.TypeName = function() {
    return "TextEntry";
}

TextEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.textarea(false, with_value, id), id );
}
