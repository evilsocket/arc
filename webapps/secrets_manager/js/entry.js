var g_SelectedEntryId = "";
var g_FilesMap = {};

const ENTRY_TYPE_INPUT    = 0;
const ENTRY_TYPE_PASSWORD = 1;
const ENTRY_TYPE_TEXT     = 2;
const ENTRY_TYPE_MARKDOWN = 3;
const ENTRY_TYPE_FILE     = 4;

const PASSW_SIZE_MIN = 5;
const PASSW_SIZE_MAX = 128;
const PASSW_SIZE_DEFAULT = 32;

function Entry(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
    this.is_new = true;
}

function EntryFromObject(o) {
    e = new Entry( o.type, o.name, o.value );
    e.is_new = o.is_new;
    return e;
}

Entry.prototype.id = function(id) {
    return 'entry_value_' + this.name.toLowerCase()
        .replace(/\s+/g, '_')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '_')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text + '_' + id;
}

Entry.prototype.formGroup = function(input, id) {
    id = this.id(id);

    return '<div class="form-group">' + 
             '<span class="label label-default label-' + this.type + '" id="editable_' + id + '" for="name_of_' + id + '">' + this.name + '</span>' +
             '<input class="blur editable-input hidden" type="text" id="name_of_' + id + '" value="' + this.name + '">' + 

             ( this.type == ENTRY_TYPE_FILE ? '<label class="upload action-button btn btn-default" for="' + id + '"><i class="fa fa-upload" aria-hidden="true"></i>' : '' ) +
             input +
             ( this.type == ENTRY_TYPE_FILE ? '</label>' : '' ) +
            '</div>';
}

Entry.prototype.passButton = function(id, name, icon) {
    return '<button id="btn_pass_' + name + '_' + this.id(id) + '" type="button" class="btn btn-default btn-password"><span class="fa fa-' + icon + '"></span></button>';
}

Entry.prototype.input = function(type, with_value, id) {
    var val = '';
    var html = '';

    if( with_value ) {
        val = this.value;
    }

    html = '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'data-entry-name="' + this.name + '" ' +
             'type="' + type + '" ' + 
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             'value="' + val + '"/>';

    if( type == 'password' ) {
        html = '<div class="input-group mif">' +
                    html +
                    '<span class="input-group-btn">' +
                        this.passButton( id, 'copy', 'clipboard' ) +
                        this.passButton( id, 'make', 'refresh' ) +
                    '</span>' +
               '</div>';
    }

    return html;
}

Entry.prototype.textarea = function(with_md, with_value, id) {
    var val = '';
    var html = '';

    if( with_value ) {
        val = this.value;
    }

    return '<textarea ' + 
             'class="form-control" ' +
             ( with_md ? 'data-provide="markdown" ' : '' ) +
             'data-entry-type="' + this.type + '" ' +
             'data-entry-name="' + this.name + '" ' +
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             '>' + val + '</textarea>';
}

Entry.prototype.Render = function(with_value, id){
    if( this.type == ENTRY_TYPE_INPUT ) {
        return this.formGroup( this.input('text', with_value, id), id ); 
    }
    else if( this.type == ENTRY_TYPE_PASSWORD ) {
        return this.formGroup( this.input('password', with_value, id), id ); 
    } 
    else if( this.type == ENTRY_TYPE_TEXT ) {
        return this.formGroup( this.textarea(false, with_value, id), id );
    }
    else if( this.type == ENTRY_TYPE_MARKDOWN ) {
        return this.formGroup( this.textarea(true, with_value, id), id );
    }
    else if( this.type == ENTRY_TYPE_FILE ) {
        return this.formGroup( this.input('file', false, id), id ); 
    }

    return "Unhandled entry type " + this.type;
}

Entry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">';
    
    if( this.type == ENTRY_TYPE_FILE ) {
        if( this.is_new == false ) {
            console.log("FILE_MAP["+entry_id+"] => " + this.value.length + " bytes." );
            g_FilesMap[entry_id] = this.value;

            rendered += '<small class="text-muted">' + bytesFormat( this.value.length ) + '</small> '; 
            rendered += '<a href="javascript:downloadFor(\''+entry_id+'\')"><i class="fa fa-download" aria-hidden="true"></i></a> '; 
        }
    }
 
    rendered +=  '<a href="javascript:editEntryFor(\''+entry_id+'\')"><i class="fa fa-edit" aria-hidden="true"></i></a> ' +
                 '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                '</div>' +
                this.Render(true, idx);

    if( this.type == ENTRY_TYPE_PASSWORD ) {
        rendered += '<div class="pwstrength_viewport_progress"></div>';
    }

    list.append( '<li id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.RegisterCallbacks(idx);
}

Entry.prototype.RegisterCallbacks = function(id) {
    $('#name_of_' + this.id(id)).hide();

    $('#editable_' + this.id(id) ).click(function () {
        $(this).hide();

        var target = $(this).attr('for');
        $('#' + target)
            .val($(this).text())
            .toggleClass("form-control")
            .show()
            .focus();
    });

    $('.blur').blur(function () {
        $(this)
            .hide()
            .toggleClass("form-control");
        var myid = (this).id;
        $('span[for=' + myid + ']')
            .text($(this).val())
            .show();
    });

    if( this.type == ENTRY_TYPE_FILE ) {
        var elem_id = this.id(id);
        var editable = $('#editable_' + elem_id);
        var name_of = $('#name_of_' + elem_id);
        var fileInput = document.getElementById(elem_id);
        var readFile = function () {
            var file = fileInput.files[0];
            var reader = new FileReader();
            reader.onload = function () {
                console.log( "FILES_MAP['" + elem_id + "'] => " + reader.result.length + " bytes." );
                g_FilesMap[elem_id] = reader.result;
            };

            editable.html( file.name );
            name_of.val( file.name );

            reader.readAsBinaryString(file);
        };
        fileInput.addEventListener('change', readFile);
    }
    else if( this.type == ENTRY_TYPE_MARKDOWN ) {
        var elem_id = this.id(id);
        var on_show = undefined;

        if( this.is_new == false ) {
            on_show = function(e) {
                $('button[data-handler=bootstrdefaultTargetap-markdown-cmdPreview]').click();
                // for some reason the width of the preview area is computed before
                // it is actually visible, so it sticks to 100px if we call the preview
                // here ... we need to refresh it -.-.
                $('.md-preview').css('width', '');
            };
        }
        console.log( "Registering markdown textarea " + elem_id );
        $('#' + elem_id).markdown({
            autofocus:true,
            savable:false,
            iconlibrary:'fa',
            fullscreen:{
                'enable': true,
                'icons': 'fa'
            },
            onShow: on_show,
        });
    }
    else if( this.type == ENTRY_TYPE_PASSWORD ) {
        var options = {};
        options.ui = {
            bootstrap4: true,
            container: "#secret_entry_" + id,
            viewports: {
                progress: ".pwstrength_viewport_progress"
            },
            showVerdictsInsideProgressBar: true
        };
        options.common = {
            debug: true,
            onLoad: function () {
                $('#messages').text('Start typing password');
            }
        };
        $('#' + this.id(id) ).pwstrength(options);

        var btn_copy = '#btn_pass_copy_' + this.id(id);
        var in_copy = '#' + this.id(id);

        // we need this hack because clipboard.js can't
        // read a password input using the data-clipboard-target
        // property.
        var clipboard = new Clipboard(btn_copy,{
            text: function(trigger) {
                var txt = $(in_copy).val();
                console.log( "  clipboard => '" + txt + "'" );
                return txt;
            }
        });

        clipboard.on('success', function(e) {
            e.clearSelection();
            console.log('Copied to clipboard.'); 
        });

        var entry_id = this.id(id);
        $('#btn_pass_make_' + entry_id).click(function(e){
            g_SelectedEntryId = entry_id;
            $('#pass_n').html( PASSW_SIZE_DEFAULT );
            $('#pass_length').slider({
                min: PASSW_SIZE_MIN,
                max: PASSW_SIZE_MAX,
                value: PASSW_SIZE_DEFAULT,
                step: 1,
                tooltip: 'always',
                formatter: function(value) {
                    var n = parseInt(value);
                    onGenerate(n);
                }
            });
            $('#password_generator_modal').css('z-index', '1500');
            $('#password_generator_modal').modal();
        });
    }
}
