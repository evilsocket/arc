/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getCSS("/js/libs/summernote/summernote.css");
$.getScript("/js/libs/summernote/summernote.min.js");

const ENTRY_TYPE_HTML = 6;

function HTMLEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_HTML, name, value );
}

HTMLEntry.prototype = Object.create(Entry.prototype);
HTMLEntry.prototype.constructor = HTMLEntry;

HTMLEntry.prototype.Icon = function() {
    return 'code';
}

HTMLEntry.prototype.textarea = function(with_value) {
    return '<textarea ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'name="' + this.id + '" ' + 
             'id="' + this.id + '" ' +
             '>' + ( with_value ? this.value : '' ) + '</textarea>';
}

HTMLEntry.prototype.Render = function(with_value){
    return this.formGroup( this.textarea(with_value) );
}

HTMLEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this );

    $('#' + this.id).summernote({
        popover: {
         image: [],
         link: [],
         air: []
       }
    });
}

