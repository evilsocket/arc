/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
const ENTRY_TYPE_CODE = 9;

function CodeEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_CODE, name, value );
    if( this.is_new ) {
        this.value = {
            mode: 'text',
            code: "\n\n\n\n\n\n\n\n\n\n",
        };
    } else {
        this.setValue(this.value);
    }
}

CodeEntry.prototype = Object.create(Entry.prototype);
CodeEntry.prototype.constructor = CodeEntry;

CodeEntry.prototype.Icon = function() {
    return 'code';
}

CodeEntry.prototype.setValue = function(v) {
    this.value = JSON.parse(v);
}

CodeEntry.prototype.getValue = function($elem) {
    var id = $elem.attr('id');
    var editor = ace.edit(id);

    this.value.mode = editor.session.getMode().$id.split('/')[2];
    this.value.code = editor.getValue();

    return JSON.stringify(this.value);
}

CodeEntry.prototype.Render = function(with_value){
    return this.formGroup(
        '<div ' +
            'data-entry-type="' + this.type + '" ' +
            'class="div-editable" ' + 
            'id="' + this.id + '" ' +
            '></div>'
    );
}

CodeEntry.prototype.langSelect = function() {
    var modes = ace.require('ace/ext/modelist').modesByName;
    var html = '<select id="lang_for_' + this.id + '">'; 

    for( var name in modes ) {
        var mode = modes[name];
        var selected = mode.name == this.value.mode ? ' selected': '';

        html += '<option value="' + mode.name + '"' + selected + '>' + mode.caption + '</option>';
    }

    html += '</select>';

    return html;
}

CodeEntry.prototype.RenderToList = function(list) {
    var rendered = '<div class="entry-edit">' +
                     this.langSelect() + 
                     this.removeButton() +
                     this.dragButton() +
                   '</div>' +
                   this.Render(true);

    list.append( this.li( rendered ) );

    this.OnRendered();
}

CodeEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );

    // https://github.com/ajaxorg/ace/issues/1518
    ace.config.set('basePath', '/js/libs/ace');

    var editor = ace.edit(this.id);
    var that = this;

    $('#lang_for_' + this.id ).change(function(){
        var lang_name = $(this).val();
        that.value.mode = lang_name;
        editor.getSession().setMode('ace/mode/' + lang_name);
    });

    editor.getSession().setUseWorker(false);
    editor.setTheme("ace/theme/monokai");
    editor.setOptions({
        maxLines: Infinity
    });

    editor.setValue( this.value.code, -1 );
    editor.getSession().setMode('ace/mode/' + this.value.mode);
}

