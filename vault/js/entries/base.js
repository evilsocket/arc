/*
 * Vault - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
function Entry(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
    this.identifier = Date.now(); 
    this.is_new = true;
}

$.getCSS = function(path) {
    $('<link/>', {
       rel: 'stylesheet',
       type: 'text/css',
       href: path
    }).appendTo('head');
};

Entry.prototype.TypeName = function() {
    return "Entry";
}

Entry.prototype.Describe = function() {
    return JSON.stringify({
        type: this.type,
        name: this.name,
        new: this.is_new,
    });
}

Entry.prototype.id = function(id) {
    return 'entry_value_' + this.identifier + '_' + id;
}

Entry.prototype.formGroup = function(input, id) {
    var id = this.id(id);
    return '<div class="form-group">' + 
             '<span class="editable label label-default entry-title label-' + this.type + '" id="editable_' + id + '">' + this.name + '</span>' +
             input +
            '</div>';
}

Entry.prototype.input = function(type, with_value, id) {
    return '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'type="' + type + '" ' + 
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             'value="' + ( with_value ? this.value : '' ) + '"/>';
}

Entry.prototype.textarea = function(with_md, with_value, id) {
    return '<textarea ' + 
             'class="form-control" ' +
             ( with_md ? 'data-provide="markdown" ' : '' ) +
             'data-entry-type="' + this.type + '" ' +
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             '>' + ( with_value ? this.value : '' ) + '</textarea>';
}

Entry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">' +
                     '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                    '</div>' +
                    this.Render(true, idx);

    list.append( '<li class="secret-entry-item" id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.OnRendered(idx);
}

Entry.prototype.Render = function(with_value, id){
    return "Unhandled entry type " + this.type;
}

Entry.prototype.OnRendered = function(id) {
    var elem_id = this.id(id);
    var editable = $('#editable_' + elem_id );
    var name_of = $('#name_of_' + elem_id );

    editable.click(function () {
        $(this).hide();
        name_of.val($(this).text()).toggleClass("form-control").show().focus();
    });

    name_of.hide().blur(function () {
        $(this).hide().toggleClass("form-control");
        var myid = (this).id;
        editable.text($(this).val()).show();
    });
}
