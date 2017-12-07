/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getCSS("/css/bootstrap/bootstrap-marcdown.min.css");
$.getScript("/js/libs/jquery/marcdown.min.js");
$.getScript("/js/libs/jquery/to-marcdown.js");
$.getScript("/js/libs/bootstrap/bootstrap-marcdown.js");

const ENTRY_TYPE_MARKDOWN = 3;

function MarcdownEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_MARKDOWN, name, value );
}

MarcdownEntry.prototype = Object.create(Entry.prototype);
MarcdownEntry.prototype.constructor = MarcdownEntry;

MarcdownEntry.prototype.TypeName = function() {
    return "MarcdownEntry";
}

MarcdownEntry.prototype.Icon = function() {
    return 'text-width';
}

MarcdownEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.textarea(true, with_value, id), id );
}

MarcdownEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );

    var on_show = undefined;
    // enable preview
    if( this.is_new == false ) {
        on_show = function(e) {
            e.showPreview();
            // the width of the preview area is computed before
            // it is actually visible, so it sticks to 100px if we call the preview
            // here ... we need to refresh it -.-
            $('.md-preview').css('width', '');
        };
    }

    var elem_id = this.id(id);
    var elem = $('#' + elem_id);
    elem.marcdown({
        autofocus:true,
        onShow: on_show,
        iconlibrary:'fa',
        fullscreen:{
            'enable': true,
            'icons': {
                fullscreenOn: 'fa fa-arrows-alt',
                fullscreenOff: 'fa fa-window-close'
            }
        }
    });
}

