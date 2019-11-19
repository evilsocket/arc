/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getScript("/js/libs/jquery/filesaver.min.js");

const ENTRY_TYPE_FILE = 4;

var g_FilesMap = {};

function FilesAdd(id, reader, file) {
    console.log( "+ FILES[" + id + "] > '" + file.name + "', " + file.type + ", " + file.size + " b" );
    g_FilesMap[id] = {
        name: file.name,
        type: file.type,
        size: file.size,
        updated_at: file.lastModified,
        data: reader.result 
    };

    var $preview = $('#preview_' + id);
    if( file.type.indexOf("image/") == 0 ) {
        if( $preview ) {
            $preview.attr( 'src', "data:" + file.type + ";base64," + btoa(g_FilesMap[id].data) ).show();
        }
    } else {
        $preview.hide();
    }
}

function FilesGet(id) {
    console.log( "< FILES[" + id + "]" );
    return g_FilesMap[id];
}

function FilesDel(id) {
    console.log( "- FILES[" + id + "]" );
    delete g_FilesMap[id];
}

function FileEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_FILE, name, value );
}

FileEntry.prototype = Object.create(Entry.prototype);
FileEntry.prototype.constructor = FileEntry;

FileEntry.prototype.Icon = function() {
    return 'cloud-upload';
}

FileEntry.prototype.getValue = function($elem) {
    var file = FilesGet($elem.attr('id'));
    this.value = JSON.stringify(file);
    return this.value;
}

FileEntry.prototype.formGroup = function(input, mime) {
    var file = FilesGet(this.id);
    var box  = "";
    if( mime && mime.indexOf("image/") == 0 ) {
        box = '<div class="preview-container" onclick="javascript:downloadFor(\'' + this.id + '\')">' +
                '<img id="preview_' + this.id + '" class="preview-image mr-3" src="' + FileEncoded(file) + '"/>' + 
                '</div>';
    } 
    else {
        var icon = 'download';
        if( mime != null ) {
            if( mime == '' ) {
                icon = 'question';
            }
            else if( mime.indexOf('pdf') != -1 ) {
                icon = 'file-pdf-o';
            } 
            else if( mime.indexOf('text/') == 0 ) {
                icon = 'file-text-o';
            }
        }

        box = '<label class="upload btn btn-default" onclick="javascript:downloadFor(\''+ this.id +'\')">' + 
                '<i class="fa fa-' + icon + '" aria-hidden="true"></i>' +
              '</label>';

    }

    var desc = '<span class="file-desc">' +
                '<small>' + ( mime ? ( mime == '' ? '?' : mime ) : '' ) + '</small>' +
                '<br/>' +
                '<small>' + ( file ? bytesFormat( file.size ) + ' (' + file.size + ' B)' : '' ) + '</small>' +
                '<br/>' +
                '<small>' + ( file ? new Date(file.updated_at) : '' ) + '</small>' +
               '</span>';

    return '<div class="form-group">' +
                box +
                '<h5 class="editable entry-title mt-0" id="editable_' + this.id + '">' + this.name + '</h5>' +
                '<br/>'+
                input + 
                desc +
           '</div>';
}

FileEntry.prototype.Render = function(mime){
     return this.formGroup( this.input('file', false), mime); 
}

FileEntry.prototype.RenderToList = function(list, dontclick) {
    var rendered = '<div class="entry-edit">';
    
    if( this.is_new == false ) {
        var file = JSON.parse(this.value)
        // make sure the file is b64 encoded
        file.data = FileEncoded(file);
        g_FilesMap[this.id] = file;
    }
 
    rendered +=   '<a href="javascript:void($(\'#' + this.id + '\').click())"><i class="fa fa-edit" aria-hidden="true"></i></a>' +
                  '<a href="javascript:removeEntry(\'' + this.id + '\')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                  '<a href="#" onclick="return false"><i class="fa fa-arrows" aria-hidden="true"></i></a>' +
                '</div>' +
                this.Render(this.is_new ? null : g_FilesMap[this.id].type) + 
                "<div style='clear:both;'></div>";


    list.append( this.li( rendered ) );

    this.OnRendered(dontclick);
}

FileEntry.prototype.OnRendered = function(dontclick) {
    Entry.prototype.OnRendered.call( this );

    var file_entry = this;
    var elem_id = this.id;
    var fileInput = document.getElementById(elem_id);
    var list = $('#secret_entry_list'); 

    var readFile = function () {
        // create new elements for multiple files.
        if( fileInput.files.length > 1 ) {
            for( var i = 1; i < fileInput.files.length; i++ ) {
                // snapshot scope
                var cb = function() {
                    var new_file = fileInput.files[i];
                    var new_entry = TypeClone(file_entry);
                    
                    new_entry.name = new_file.name;
                    new_entry.value = new_file;

                    new_entry.RenderToList( list, true );

                    var new_reader = new FileReader();
                    new_reader.onload = function (e) {
                        FilesAdd( new_entry.id, new_reader, new_file);
                    };

                    new_reader.readAsDataURL(new_file);
                };
                cb();
            }
        } 
        
        var cb = function() {
            var first_file = fileInput.files[0];
            var first_reader = new FileReader();
            first_reader.onload = function (e) {
                FilesAdd(elem_id, first_reader, first_file);
            };
            $('#editable_' + elem_id ).text( first_file.name );
            first_reader.readAsDataURL(first_file);
        };
        cb();
    };

    fileInput.addEventListener('change', readFile);

    if( this.is_new && !dontclick ) {
        fileInput.click();
    }
}
