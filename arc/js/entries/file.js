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
    console.log( "+ FILES[" + id + "] = '" + file.name + "', " + file.type + ", " + file.size + " b" );
    g_FilesMap[id] = {
        name: file.name,
        type: file.type,
        size: file.size,
        updated_at: file.lastModified,
        data: reader.result 
    };
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

FileEntry.prototype.TypeName = function() {
    return "FileEntry";
}

FileEntry.prototype.Icon = function() {
    return 'cloud-upload';
}

FileEntry.prototype.formGroup = function(input, id) {
    var id = this.id(id);
    return '<div class="form-group">' + 
             '<span class="editable label entry-title label-default label-' + this.type + '" id="editable_' + id + '">' + this.name + '</span>' +
             '<label class="upload btn btn-default" for="' + id + '"><i class="fa fa-upload" aria-hidden="true"></i>' +
                input +
             '</label>' +
            '</div>';
}

FileEntry.prototype.Render = function(with_value, id){
     return this.formGroup( this.input('file', false, id), id ); 
}

FileEntry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">';
    
    if( this.is_new == false ) {
        g_FilesMap[entry_id] = JSON.parse(this.value);

        rendered += '<small class="text-muted">' + bytesFormat( this.value.length ) + '</small> '; 
        rendered += '<a href="javascript:downloadFor(\''+entry_id+'\')"><i class="fa fa-download" aria-hidden="true"></i></a> '; 
    }
 
    rendered +=   '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                '</div>' +
                this.Render(true, idx);

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}

FileEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );

    var elem_id = this.id(id);
    var editable = $('#editable_' + elem_id );
    var fileInput = document.getElementById(elem_id);

    var readFile = function () {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function () {
            FilesAdd(elem_id, reader, file);
        };

        editable.text( file.name );
        reader.readAsBinaryString(file);
    };
    fileInput.addEventListener('change', readFile);

    if( this.is_new ) {
        fileInput.click();
    }
}
