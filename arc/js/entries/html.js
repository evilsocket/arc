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
    return 'html5';
}

HTMLEntry.prototype.textarea = function(with_value) {
    return '<textarea ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'name="' + this.id + '" ' + 
             'id="' + this.id + '" ' +
             '>' + ( with_value ? this.safeValue() : '' ) + '</textarea>';
}

HTMLEntry.prototype.Render = function(with_value){
    return this.formGroup( this.textarea(with_value) );
}

HTMLEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this );

    // https://github.com/summernote/summernote/issues/2017
    // https://github.com/evilsocket/arc/issues/130
    if(!!document.createRange) {
      document.getSelection().removeAllRanges();
    }

    $('#' + this.id).summernote({
        dialogsInBody: true,
        popover: {
         image: [],
         link: [],
         air: []
       }
    });
}

