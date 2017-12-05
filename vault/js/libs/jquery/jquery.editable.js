/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
(function( $ ) {
    $.fn.editable = function() {
        this.each(function() {
            // prevent double initialization
            if( this.$isEditable == true ) {
                return;
            }

            var $elem = $(this);
            var id = $elem.attr('id');
            // we need a unique id in order to track events
            if( id ) {
                this.$isEditable = true;

                var input_name = 'editable_input_for_' + id;
                var icon_name = 'editable_icon_for_' + id;
                var $icon = $('<i class="editable-icon fa fa-pencil-square-o" icon-for="' + id + '">').hide(); 
                var $input = $('<input class="editable-input">').hide();

                $input.attr({
                    type: 'text',
                    id:  input_name,
                    name: input_name
                })
                .prop({
                    'input-for': id  
                });

                $icon.attr({
                    id: icon_name  
                })
                .click(function(e){
                    // if the icon is clickable, it means the text is empty, therefore
                    // it can not be clicked by the user and we need to simulate it.
                    e.preventDefault();
                    $( '#' + $(this).attr('icon-for') ).click(); 
                });

                $elem.after($icon).after($input);

                // show icon on hover
                $elem.hover(function(){
                  var icon_id = '#editable_icon_for_' + $(this).attr('id');
                  $(icon_id).show();
                }, 
                // hide icon on hover
                function(){
                  var icon_id = '#editable_icon_for_' + $(this).attr('id');
                  $(icon_id).hide();
                })
                // hide editable and show input on click
                .click(function(){
                    var input_id = '#editable_input_for_' + $(this).attr('id');
                    $(this).hide();
                    $(input_id).val( $(this).text() ).show().focus();
                });

                var onHide = function(e){
                    var is_keypress = ( e && typeof(e.keyCode) !== 'undefined' );

                    // we can get here from keypress or blur
                    if( is_keypress && ( e.keyCode != 27 && e.keyCode != 13 ) ) {
                        return;
                    } else if( is_keypress ){
                        e.preventDefault();
                    }

                    var text = $(this).val();
                    var elem_id = '#' + $(this).prop('input-for');
                    var icon_id = '#editable_icon_for_' + $(this).prop('input-for');
                    var $elem = $(elem_id);

                    $(this).hide();
                    $elem.text(text).show();

                    // if there's no text, make the icon visible in order to
                    // allow the user to click on something, otherwise hide
                    // it in case it was already forcefully shown by a previous
                    // empty text.
                    if( $.trim(text) == "" ){
                        $(icon_id).show();
                    } else {
                        $(icon_id).hide();
                    }
                };

                $input
                .keypress(onHide)
                .blur(onHide);
            }
        });
        return this;
    };
}( jQuery ));

$(function(){
    $(document).on( 'mouseenter', '.editable', function(e) {
        var first_run = !!!this.$isEditable;
        $(this).editable();
        if( first_run )
            $(this).trigger('mouseover');
    });
});
