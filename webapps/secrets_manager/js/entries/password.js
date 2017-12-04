$.getCSS("/css/bootstrap/bootstrap-slider.min.css");
$.getScript("/js/libs/jquery/pwstrength.js");
$.getScript("/js/libs/jquery/clipboard.min.js");
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

function PasswordEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_PASSWORD, name, value );
}

PasswordEntry.prototype = Object.create(Entry.prototype);
PasswordEntry.prototype.constructor = PasswordEntry;

PasswordEntry.prototype.TypeName = function() {
    return "PasswordEntry";
}

PasswordEntry.prototype.btn = function(id, name, icon) {
    return '<button id="btn_pass_' + name + '_' + this.id(id) + '" type="button" class="btn btn-default btn-password"><span class="fa fa-' + icon + '"></span></button>';
}

PasswordEntry.prototype.input = function(with_value, id) {
    return '<div class="input-group mif">' +
            '<input ' + 
                'type="password" ' + 
                'class="form-control" ' +
                'data-entry-type="' + this.type + '" ' +
                'data-entry-name="' + this.name + '" ' +
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
                      '<a href="javascript:editEntryFor(\''+entry_id+'\')"><i class="fa fa-edit" aria-hidden="true"></i></a> ' +
                      '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                   '</div>' +
                   this.Render(true, idx) +
                   '<div class="pwstrength_viewport_progress"></div>';

    list.append( '<li id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}

PasswordEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );

    var elem_id = this.id(id);
    var elem = $('#' + elem_id);
    var btn_pass_copy_id = '#btn_pass_copy_' + elem_id;
    var btn_pass_make_id = '#btn_pass_make_' + elem_id;
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

    // console.log( "Attach clipboard to " + btn_pass_copy_id );
    // we need this hack because clipboard.js can't
    // read a password input using the data-clipboard-target
    // property.
    var clipboard = new Clipboard( btn_pass_copy_id,{
        text: function(trigger) {
            // console.log( "#" + elem_id + ".val() => '" + elem.val() + "' => clipboard" );
            return elem.val();
        }
    });

    clipboard.on('success', function(e) {
        e.clearSelection();
        // console.log('Copied to clipboard.'); 
    });

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
