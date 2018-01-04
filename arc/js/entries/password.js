/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
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
    var pass = "";
    var nsymbols = charset.length;
    var bytes = crypto.getRandomValues(new Uint8Array(length));

    for( var i = 0; i < length; i++) {
        pass += charset.charAt(bytes[i] % nsymbols);
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

PasswordEntry.prototype.Icon = function() {
    return 'key';
}

PasswordEntry.prototype.btn = function(name, icon) {
    return '<button id="btn_pass_' + name + '_' + this.id + '" type="button" class="btn btn-default btn-password">' +
             '<span class="fa fa-' + icon + '"></span>' + 
           '</button>';
}

PasswordEntry.prototype.input = function(with_value) {
    return '<div class="input-group mif">' +
            '<input ' + 
                'type="password" ' + 
                'class="form-control" ' +
                'data-entry-type="' + this.type + '" ' +
                'name="' + this.id + '" ' + 
                'id="' + this.id + '" ' +
                'value="' + ( with_value ? this.value : '' ) + '"/>' +
                '<span class="input-group-btn">' +
                    this.btn( 'copy', 'clipboard' ) +
                    this.btn( 'make', 'refresh' ) +
                '</span>' +
            '</div>' +
            '<div class="pwstrength_viewport_progress"></div>';
}

PasswordEntry.prototype.Render = function(with_value){
    return this.formGroup( this.input(with_value) ); 
}

PasswordEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );

    var elem_id = this.id;
    var options = {
        rules: {
            activated: {
                wordTwoCharacterClasses: true,
                wordRepetitions: true
            }
        },
        ui: {
            bootstrap4: true,
            container: "#wrap_" + elem_id,
            viewports: {
                progress: ".pwstrength_viewport_progress"
            },
            showVerdictsInsideProgressBar: true
        }
    };
    $('#' + elem_id).pwstrength(options);

    var $btn_pass_copy = $('#btn_pass_copy_' + elem_id);
    $btn_pass_copy.click(function() {
        var prev = $btn_pass_copy.html();
        var pass = $('#' + elem_id).val();

        copyTextToClipboard(pass);

        $btn_pass_copy.html("<small>Copied!</small>");
        setTimeout(function(){
            $btn_pass_copy.html(prev);
        }, 1000);
    });

    $('#btn_pass_make_' + elem_id).click(function(e){
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
