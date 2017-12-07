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

InputEntry.prototype.TypeName = function() {
    return "InputEntry";
}

InputEntry.prototype.Icon = function() {
    return 'square-o';
}

InputEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.input('text', with_value, id), id ); 
}

InputEntry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">' +
                     '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                    '</div>' +
                    this.Render(true, idx);

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}
