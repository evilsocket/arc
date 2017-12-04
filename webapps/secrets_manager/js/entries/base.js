function Entry(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
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
    return 'entry_value_' + this.name.toLowerCase()
        .replace(/\s+/g, '_')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '_')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text + '_' + id;
}

Entry.prototype.formGroup = function(input, id) {
    var id = this.id(id);
    return '<div class="form-group">' + 
             '<span class="label label-default label-' + this.type + '" id="editable_' + id + '" for="name_of_' + id + '">' + this.name + '</span>' +
             '<input class="blur editable-input hidden" type="text" id="name_of_' + id + '" value="' + this.name + '">' + 
             input +
            '</div>';
}

Entry.prototype.input = function(type, with_value, id) {
    return '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'data-entry-name="' + this.name + '" ' +
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
             'data-entry-name="' + this.name + '" ' +
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             '>' + ( with_value ? this.value : '' ) + '</textarea>';
}

Entry.prototype.RenderToList = function(list, idx) {
    var entry_id = this.id(idx);
    var rendered = '<div class="entry-edit">' +
                     '<a href="javascript:editEntryFor(\''+entry_id+'\')"><i class="fa fa-edit" aria-hidden="true"></i></a> ' +
                     '<a href="javascript:removeEntry('+idx+')"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                    '</div>' +
                    this.Render(true, idx);

    list.append( '<li id="secret_entry_' + idx + '">' + rendered + '</li>' );

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
