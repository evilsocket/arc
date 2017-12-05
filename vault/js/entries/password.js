/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getCSS("/css/bootstrap/bootstrap-slider.min.css");
$.getScript("/js/libs/jquery/pwstrength.js");
$.getScript("/js/libs/bootstrap/bootstrap-slider.min.js");

const ENTRY_TYPE_PASSWORD = 1;

const PASSW_SIZE_MIN = 5;
const PASSW_SIZE_MAX = 128;
const PASSW_SIZE_DEFAULT = 32;

var g_SelectedEntryId = "";

function generatePassword( length, charset ) {
    // console.log( "Generating password of " + length );

    var pass = "";
    var nsymbols = charset.length;

    for(var i = 0; i < length; i++) {
        // Math.random() is not cryptographically secure, while CryptoJS
        // is using Donald Knuth's linear congruential pseudo-random 
        // number generator -> https://github.com/brix/crypto-js/issues/7
        var random_word = CryptoJS.lib.WordArray.random(1).words[0]
        var random_index = Math.abs(random_word) % nsymbols;

        pass += charset.charAt(random_index);
    }

    return pass;
}

// taken from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript/30810322
function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

function PasswordEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_PASSWORD, name, value );
}

PasswordEntry.prototype = Object.create(Entry.prototype);
PasswordEntry.prototype.constructor = PasswordEntry;

PasswordEntry.prototype.TypeName = function() {
    return "PasswordEntry";
}

PasswordEntry.prototype.btn = function(id, name, icon) {
    return '<button id="btn_pass_' + name + '_' + this.id(id) + '" type="button" class="btn btn-default btn-password">' +
             '<span class="fa fa-' + icon + '"></span>' + 
           '</button>';
}

PasswordEntry.prototype.input = function(with_value, id) {
    return '<div class="input-group mif">' +
            '<input ' + 
                'type="password" ' + 
                'class="form-control" ' +
                'data-entry-type="' + this.type + '" ' +
                'name="' + this.name + '" ' + 
                'id="' + this.id(id) + '" ' +
                'value="' + ( with_value ? this.value : '' ) + '"/>' +
                '<span class="input-group-btn">' +
                    this.btn( id, 'copy', 'clipboard' ) +
                    this.btn( id, 'make', 'refresh' ) +
                '</span>' +
            '</div>';
}

PasswordEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.input(with_value, id), id ); 
}

PasswordEntry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">' +
                      '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                   '</div>' +
                   this.Render(true, idx) +
                   '<div class="pwstrength_viewport_progress"></div>';

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}

PasswordEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );

    var elem_id = this.id(id);
    var elem = $('#' + elem_id);

    var options = {
        ui: {
            bootstrap4: true,
            container: "#secret_entry_" + id,
            viewports: {
                progress: ".pwstrength_viewport_progress"
            },
            showVerdictsInsideProgressBar: true
        }
    };
    elem.pwstrength(options);

    var btn_pass_copy_id = '#btn_pass_copy_' + elem_id;
    $(btn_pass_copy_id).click(function() {
        elem.select().focus();
        var pass = elem.val();
        copyTextToClipboard(pass);
        console.log( "Copied " + pass.length + " characters to clipboard." );
        alert( "Password copied." );
    });

    var btn_pass_make_id = '#btn_pass_make_' + elem_id;
    $(btn_pass_make_id).click(function(e){
        g_SelectedEntryId = elem_id;
        $('#pass_n').html( PASSW_SIZE_DEFAULT );
        $('#pass_length').slider({
            min: PASSW_SIZE_MIN,
            max: PASSW_SIZE_MAX,
            value: PASSW_SIZE_DEFAULT,
            step: 1,
            tooltip: 'always',
            formatter: function(value) {
                onGenerate(parseInt(value));
            }
        });
        $('#password_generator_modal').css('z-index', '1500');
        $('#password_generator_modal').modal();
    });
}
