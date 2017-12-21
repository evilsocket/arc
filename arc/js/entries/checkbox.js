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

CheckboxEntry.prototype.getValue = function($elem) {
    this.value = $elem.is(':checked') ? '1' : '0';
    return this.value;
}

CheckboxEntry.prototype.input = function(type, with_value) {
    return '<input ' + 
             'class="ui-checkbox" ' +
             'style="float: left" ' + 
             'data-entry-type="' + this.type + '" ' +
             'type="' + type + '" ' + 
             'name="' + this.id + '" ' + 
             'id="' + this.id + '" ' +
             ( this.value == '1' ? 'checked' : '' )  +
             '/>';
}

CheckboxEntry.prototype.formGroup = function(input) {
    return '<div class="form-group" style="margin:0">' + 
             input +
             '<h5 class="editable label label-default entry-title label-' + this.type + '" style="float:left;" id="editable_' + this.id + '">' + this.name + '</h5>' +
            '</div>' + 
            '<div style="clear:both"></div>';
}

CheckboxEntry.prototype.Render = function(with_value){
    return this.formGroup( this.input('checkbox', with_value) ); 
}
