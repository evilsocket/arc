/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
const ENTRY_TYPE_INPUT = 0;

function InputEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_INPUT, name, value );
}

InputEntry.prototype = Object.create(Entry.prototype);
InputEntry.prototype.constructor = InputEntry;

InputEntry.prototype.Icon = function() {
    return 'square-o';
}

InputEntry.prototype.Render = function(with_value){
    return this.formGroup( this.input('text', with_value) ); 
}
