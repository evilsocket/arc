const ENTRY_TYPE_INPUT    = 0;
const ENTRY_TYPE_PASSWORD = 1;
const ENTRY_TYPE_TEXT     = 2;
const ENTRY_TYPE_MARKDOWN = 3;

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
    return 'entry_value_' + this.name.toLowerCase() + '_' + id;
}

Entry.prototype.formGroup = function(input, id) {
    return '<div class="form-group">' + 
             '<label for="' + this.id(id) + '">' + this.name + '</label>' + 
             input +
            '</div>';
}

Entry.prototype.input = function(type, with_value, id) {
    var val = '';
    var html = '';

    if( with_value ) {
        val = this.value;
    }

    return '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'data-entry-name="' + this.name + '" ' +
             'type="' + type + '" ' + 
             'name="' + this.name + '" ' + 
             'id="' + this.id(id) + '" ' +
             'value="' + val + '"/>';
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

    return "Unhandled entry type " + this.type;
}

Entry.prototype.RenderToList = function(list, idx) {
    var rendered = '<div style="float:right;">' + 
                     '<a href="javascript:removeEntry('+idx+')" class="badge badge-danger"><i class="fa fa-trash" aria-hidden="true"></i></a>' +
                   '</div>' +
                   this.Render(true, idx);
    
    list.append( '<li id="secret_entry_' + idx + '">' + rendered + '</li>' );

    this.RegisterCallbacks(idx);
}

Entry.prototype.RegisterCallbacks = function(id) {
    if( this.type == ENTRY_TYPE_MARKDOWN ) {
        var elem_id = this.id(id);
        var on_show = undefined;

        if( this.is_new == false ) {
            on_show = function(e) {
                $('button[data-handler=bootstrap-markdown-cmdPreview]').click();
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
                'enable': false,
                'icons': 'fa'
            },
            onShow: on_show
        });

    }
}

function Record(title) {
    this.title = title
    this.entries = [];
    this.error = null;
}

Record.prototype.AddEntry = function(entry) {
    this.entries.push(entry);
}

Record.prototype.SetError = function(error) {
    console.log( "RECORD ERROR: " + error);
    this.entries = [];
    this.error = error;
}

Record.prototype.HasError = function() {
    return ( this.error != null );
}

Record.prototype.Encrypt = function( key ) {
    for( var i = 0; i < this.entries.length; i++ ) {
        this.entries[i].is_new = false;
    }

    var data = JSON.stringify(this.entries); 
    console.log( "Encrypting " + data.length + " bytes of password." );
    data = CryptoJS.AES.encrypt( data, key ).toString(); 
    console.log( "Encrypted data is " + data.length + " bytes." );
    return data
}

Record.prototype.Decrypt = function( key, data ) {
    console.log( "Decrypting " + data.length + " bytes of record." );
    data = CryptoJS.AES.decrypt( data, key ).toString(CryptoJS.enc.Utf8); 
    console.log( "Decrypted data is " + data.length + " bytes." );

    // quick and dirty check
    if( data.indexOf('"value"') == -1 ) {
        this.SetError( "Error while decrypting record data." );
    } else {
        var objects = JSON.parse(data);
        
        this.entries = [];
        console.log( "Record has " + objects.length + " entries." );

        for( var i = 0; i < objects.length; i++ ) {
            this.entries.push( EntryFromObject(objects[i]) );
        }
    }
}

var app = angular.module('PM', [], function($interpolateProvider) {

});

app.filter('timeago', function() {
    return function(date) {
       return $.timeago(date);
    }
});

// taken from https://gist.github.com/thomseddon/3511330
app.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
});

function removeEntry(idx) {
    console.log("Removing entry at position " + idx );
    $('#secret_entry_' + idx).remove();
}

app.controller('PMController', ['$scope', function (scope) {
    scope.statusMessage = null;
    scope.errorMessage = null;
    scope.vault = new Vault();
    scope.key = null;
    scope.secret = null;
    scope.filter = null;

    scope.registeredTypes = [
        new Entry( ENTRY_TYPE_INPUT,    "URL", "https://" ),
        new Entry( ENTRY_TYPE_INPUT,    "Login", "" ),
        new Entry( ENTRY_TYPE_PASSWORD, "Password", "" ),
        new Entry( ENTRY_TYPE_TEXT,     "Text", "" ),
        new Entry( ENTRY_TYPE_MARKDOWN, "Markdown", "" ),
    ];

    scope.setError = function(message) {
        scope.setStatus(null);
        scope.errorMessage = message;

        if( message ) {
            if( typeof(message) == 'object' ) {
                message = message.statusText;
            }

            console.log(message);
            $('#error_body').html(message);
            $('#error_modal').modal();
        } else {
            $('#error_modal').modal('hide');
        }
    };

    scope.setStatus = function(message) {
        if( message ) 
            console.log(message);
        // scope.statusMessage = message;
    };

    scope.setSecret = function(secret) {
        scope.secret = secret;
    }

    scope.getStore = function(success) {
        scope.setStatus("Loading passwords store ...");

        scope.vault.SetStore( "passwords", function() {
            scope.setError(null);
            scope.$apply();
        },
        function(error){
            scope.setError(error);
            scope.$apply();
        });
    }

    scope.setKey = function(key) {
        key = $.trim(key) 
        if( key == "" ) {
            scope.setError("Empty encryption key.");
            scope.$apply();
            return false;
        }

        scope.key = key;
        return true;
    }

    scope.doLogin = function() {
        scope.setStatus("Logging in ...");

        var username = $('#username').val();
        var password = $('#password').val();

        if( scope.setKey( $('#key').val() ) == true ) { 
            scope.vault.Login( username, password, function(token) {
                scope.setError(null);
                scope.$apply();
                scope.getStore( function() {
                    scope.$apply();
                });
            },
            function(error){
                scope.setError(error);
                scope.$apply();
            });
        }
    }

    scope.updateFilter = function() {
        scope.filter = $('#search_filter').val(); 
    }

    scope.filterSecret = function(record) {
        if( scope.filter != null ) {
            return ( record.Title.toLowerCase().indexOf(scope.filter.toLowerCase()) != -1 );
        }
        return true;
    }

    scope.addSecretEntry = function() {
        var entry_idx = $('#new_entry_type').val();
        var entry = scope.registeredTypes[entry_idx];
        var list = $('#secret_entry_list'); 
        var nidx = list.find('li').length;

        console.log( "Adding entry (idx=" + nidx + "):" );
        console.log( entry );

        entry.RenderToList( list, nidx );
    }

    scope.onNewSecret = function() {
        $('#secret_title').val('');
        $('#secret_entry_list').html('');
        $('#new_secret_buttons').show();
        $('#edt_secret_buttons').hide();
        $('#secret_modal').modal();
    }

    scope.onShowSecret = function(secret) {
        $('#secret_title').val('');
        $('#secret_entry_list').html('');
        $('#new_secret_buttons').hide();
        $('#edt_secret_buttons').show();

        var record = new Record(secret.Title);
        var list = $('#secret_entry_list'); 

        scope.setSecret(secret)

        $('#secret_title').val(record.title);

        record.Decrypt( scope.key, secret.Data );

        if( record.HasError() == false ) {
            var nidx = list.find('li').length;
            for( var i = 0; i < record.entries.length; i++ ){
                record.entries[i].RenderToList( list, i );
            }
        } else {
            $('#secret_body').html( '<span style="color:red">' + record.error + '</span>' );
        }

        $('#secret_modal').modal();
    }

    scope.onAdd = function() {
        scope.setStatus("Adding secret ...");

        var title = $('#secret_title').val();
        var entries = $('*[id^=entry_value_]');

        if( entries.length == 0 ){
            return alert("Please add at least one entry to your secret.");
        }

        console.log(entries);

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var type = parseInt( input.attr('data-entry-type') );
            var name = input.attr('data-entry-name');
            var value = input.val();

            record.AddEntry(new Entry( type, name, value ));
        }
        
        data = record.Encrypt( scope.key )
        
        scope.vault.AddRecord( title, data, 'aes', function(record) {
            scope.setError(null);
            scope.$apply();

            scope.getStore( function() {
                scope.$apply();
            });
        },
        function(error){
            scope.setError(error);
            scope.$apply();
        });

        $('#secret_modal').modal('hide');
    }

    scope.onDelete = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        if( confirm( "Delete this secret?" ) == true ) {
            scope.vault.DeleteRecord(scope.secret, function(){ 
                scope.setSecret(null);
                scope.getStore( function() {
                    scope.$apply();
                });
            },
            function(err){
                scope.setError(error);
                scope.$apply();
            });

            $('#secret_modal').modal('hide');
        }
    }

    scope.onUpdate = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        scope.setStatus("Updating secret ...");

        var title = $('#secret_title').val();
        var entries = $('*[id^=entry_value_]');

        if( entries.length == 0 ){
            return alert("Please add at least one entry to your secret.");
        }

        // console.log(entries);

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var type = parseInt( input.attr('data-entry-type') );
            var name = input.attr('data-entry-name');
            var value = input.val();

            record.AddEntry(new Entry( type, name, value ));
        }
        
        var data = record.Encrypt( scope.key )
        
        scope.vault.UpdateRecord( scope.secret.ID, title, data, 'aes', function(record) {
            scope.setSecret(null);
            scope.setError(null);
            scope.$apply();

            scope.getStore( function() {
                scope.$apply();
            });
        },
        function(error){
            scope.setError(error);
            scope.$apply();
        });

        $('#secret_modal').modal('hide');
    }
}]);
