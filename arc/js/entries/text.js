/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
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

TextEntry.prototype.Icon = function() {
    return 'font';
}

TextEntry.prototype.Render = function(with_value, id){
    return this.formGroup(
        '<div ' +
            'data-entry-type="' + this.type + '" ' +
            'class="div-editable" ' + 
            'id="' + this.id(id) + '" ' +
            'contenteditable="true">'+this.value+"</div>"
    );
}

TextEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );
}


