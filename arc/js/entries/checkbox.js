/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
const ENTRY_TYPE_CHECKBOX = 5;

function CheckboxEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_CHECKBOX, name, value );
}

CheckboxEntry.prototype = Object.create(Entry.prototype);
CheckboxEntry.prototype.constructor = CheckboxEntry;

CheckboxEntry.prototype.TypeName = function() {
    return "CheckboxEntry";
}

CheckboxEntry.prototype.Icon = function() {
    return 'check-square-o';
}

CheckboxEntry.prototype.input = function(type, with_value, id) {
    id = this.id(id)
    return '<input ' + 
             'class="ui-checkbox" ' +
             'style="float: left" ' + 
             'data-entry-type="' + this.type + '" ' +
             'type="' + type + '" ' + 
             'name="' + id + '" ' + 
             'id="' + id + '" ' +
             ( this.value == '1' ? 'checked' : '' )  +
             '/>';
}

CheckboxEntry.prototype.formGroup = function(input, id) {
    var id = this.id(id);
    return '<div class="form-group" style="margin:0">' + 
             input +
             '<h5 class="editable label label-default entry-title label-' + this.type + '" style="float:left;" id="editable_' + id + '">' + this.name + '</h5>' +
            '</div>' + 
            '<div style="clear:both"></div>';
}

CheckboxEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.input('checkbox', with_value, id), id ); 
}

CheckboxEntry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">' +
                     '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                     '<a href="#" onclick="return false"><i class="fa fa-arrows" aria-hidden="true"></i></a>' +
                    '</div>' +
                    this.Render(true, idx);

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}
