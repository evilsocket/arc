/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getCSS("/css/bootstrap/bootstrap-markdown.min.css");
$.getScript("/js/libs/jquery/markdown.min.js");
$.getScript("/js/libs/jquery/to-markdown.js");
$.getScript("/js/libs/bootstrap/bootstrap-markdown.js");

const ENTRY_TYPE_MARKDOWN = 3;

function MarkdownEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_MARKDOWN, name, value );
}

MarkdownEntry.prototype = Object.create(Entry.prototype);
MarkdownEntry.prototype.constructor = MarkdownEntry;

MarkdownEntry.prototype.Icon = function() {
    return 'text-width';
}

MarkdownEntry.prototype.Render = function(with_value){
    return this.formGroup( this.textarea(true, with_value) );
}

MarkdownEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );

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

    $('#' + this.id).markdown({
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

