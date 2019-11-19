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

TextEntry.prototype.Icon = function() {
    return 'font';
}

TextEntry.prototype.getValue = function($elem) {
    this.value = $elem.html();
    return this.value;
}

TextEntry.prototype.Render = function(with_value){
    return this.formGroup(
        '<div ' +
            'data-entry-type="' + this.type + '" ' +
            'class="div-editable" ' + 
            'id="' + this.id + '" ' +
            'contenteditable="true">'+this.value+"</div>"
    );
}

TextEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );
}


