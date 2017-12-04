function removeEntry(idx) {
    if( confirm("Remove this field?") ) {
        console.log("Removing entry at position " + idx );
        $('#secret_entry_' + idx).remove();
    }
}

function editEntryFor(id) {
    $('#editable_' + id ).click();
}

function downloadFor(id) {
    var name_of = $('#name_of_' + id);
    var name = name_of.val();
    var data = g_FilesMap[id];

    console.log( "Dowloading " + data.length + " bytes of data as " + name );

    // https://stackoverflow.com/questions/23795034/creating-a-blob-or-a-file-from-javascript-binary-string-changes-the-number-of-by
    var bytes = new Uint8Array(data.length);
    for (var i=0; i<data.length; i++)
        bytes[i] = data.charCodeAt(i);
    data = bytes;

    var file = new File([data], name, {type: "application/octect-stream"});
    console.log(file);
    saveAs(file);
}

function onGenerate(n) {
    $('#pass_n').html(n);

    var charset = "";

    if( $('#pass_lower').is(":checked") ) {
        for( var c = 0x61; c <= 0x7a; c++ ) {
            charset += String.fromCharCode(c);
        }
    }   

    if( $('#pass_upper').is(":checked") ) {
        for( var c = 0x41; c <= 0x5a; c++ ) {
            charset += String.fromCharCode(c);
        }
    }   

    if( $('#pass_digits').is(":checked") ) {
        for( var c = 0x30; c <= 0x39; c++ ) {
            charset += String.fromCharCode(c);
        }
    }  

    if( $('#pass_symbols').is(":checked") ) {
        for( var c = 0x21; c <= 0x2f; c++ ) {
            charset += String.fromCharCode(c);
        }
    }  

    var new_pass = generatePassword(n, charset);
    $('#generated_password').val(new_pass);
}

function generatePassword( length, charset ) {
    var pass = "";

    for(var i = 0; i < length; i++) {
        // TODO: Use a better random generator.
        pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return pass;
}

function bytesFormat(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
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
        return bytesFormat(bytes, precision);
    }
});

app.controller('PMController', ['$scope', function (scope) {
    scope.statusMessage = null;
    scope.errorMessage = null;
    scope.vault = new Vault();
    scope.key = null;
    scope.secret = null;
    scope.filter = null;
    scope.registeredTypes = REGISTERED_TYPES;

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
                
                setInterval( function(){ scope.updateSessionTime(); }, 1000 );

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

    scope.onGeneratePassword = function() {
        var value = $('#pass_n').html();
        var n = parseInt(value);
        onGenerate(n);
    }

    scope.onUsePassword = function() { 
        var pass = $('#generated_password').val();
        $('#'+g_SelectedEntryId).val(pass);
        $('#password_generator_modal').modal('hide');
        $('#'+g_SelectedEntryId).pwstrength('forceUpdate');
    }

    scope.addSecretEntry = function() {
        var entry_idx = $('#new_entry_type').val();
        var entry = $.extend( true, {}, scope.registeredTypes[entry_idx] );
        var list = $('#secret_entry_list'); 
        var nidx = list.find('li').length;
    
        if( nidx > 0 ) {
            entry.name = entry.name + " " + ( nidx + 1 );
        }

        console.log( "Adding entry (idx=" + nidx + "):" );
        console.log( entry );

        entry.RenderToList( list, nidx );
    }

    scope.onNewSecret = function() {
        $('#cleartext-warning').show();
        $('#secret_title').val('');
        $('#secret_title').show();
        $('#secret_title_label').html('');
        $('#secret_title_label').hide('');
        $('#secret_entry_list').html('');
        $('#new_secret_buttons').show();
        $('#edt_secret_buttons').hide();
        $('#secret_modal').modal();

        $('#secret_title_label').click(function () {
            $(this).hide();
            $('#secret_title')
                .val($(this).text())
                .toggleClass("form-control")
                .show()
                .focus();
        });

        $('#secret_title').blur(function () {
            $(this).hide().toggleClass("form-control");
            $('#secret_title_label').html( $(this).val() ).show();
        });
    }

    scope.onShowSecret = function(secret) {
        var record = new Record(secret.Title);

        record.Decrypt( scope.key, secret.Data );

        if( record.HasError() == true ) {
            $('#record_error_' + secret.ID).html(record.error);

            $('#record_status_' + secret.ID ).addClass("status-error");
        }
        else {
            scope.setSecret(secret)

            $('#record_lock_' + secret.ID ).removeClass("fa-lock").addClass("fa-unlock");
            $('#record_status_' + secret.ID ).removeClass("status-locked").addClass("status-unlocked");

            $('#cleartext-warning').hide();
            $('#secret_title').hide();
            $('#new_secret_buttons').hide();
            $('#edt_secret_buttons').show();

            $('#secret_title_label').html('');
            $('#secret_entry_list').html('');
            $('#secret_title').val(record.title);
            $('#secret_title_label').html(record.title);

            $('#secret_title_label').click(function () {
                $(this).hide();
                $('#secret_title')
                    .val($(this).text())
                    .toggleClass("form-control")
                    .show()
                    .focus();
            });

            $('#secret_title').blur(function () {
                $(this).hide().toggleClass("form-control");
                $('#secret_title_label').html( $(this).val() ).show();
            });

            var list = $('#secret_entry_list'); 
            for( var i = 0; i < record.entries.length; i++ ){
                var e = record.entries[i];
                // console.log( "Rendering entry " + e.TypeName() );
                e.RenderToList( list, i );
            }

            $('#secret_modal').modal();
        }
    }

    scope.onAdd = function() {
        scope.setStatus("Adding secret ...");

        var title = $('#secret_title').val();
        var names = $('input[id^=name_of_]');
        var entries = $('*[id^=entry_value_]');

        if( entries.length == 0 ){
            return alert("Please add at least one entry to your secret.");
        }
        else if( entries.length != names.length ) {
            return alert("WTF?!");
        }

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var entry_id = input.attr('id');
            var type = parseInt( input.attr('data-entry-type') );
            var name = $(names[i]).val();
            var value = input.val();

            if( type == ENTRY_TYPE_FILE ) {
                console.log( "Reading item " + entry_id + " from file map." );
                value = g_FilesMap[entry_id];
                console.log( "  " + entry_id + " => " + value.length + " bytes." );
                // free the memory!
                delete g_FilesMap[entry_id];
            }

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
                scope.setError(err);
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
        var names = $('input[id^=name_of_]');
        var entries = $('*[id^=entry_value_]');

        if( entries.length == 0 ){
            return alert("Please add at least one entry to your secret.");
        } 
        else if( entries.length != names.length ) {
            return alert("WTF?!");
        }

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var entry_id = input.attr('id');
            var type = parseInt( input.attr('data-entry-type') );
            var name = $(names[i]).val();
            var value = input.val();

            if( type == ENTRY_TYPE_FILE ) {
                console.log( "Reading item " + entry_id + " from file map." );
                value = g_FilesMap[entry_id];
                console.log( "  " + entry_id + " => " + value.length + " bytes." );
                // free the memory!
                delete g_FilesMap[entry_id];
            }

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
    };

    scope.updateSessionTime = function() {
        if( scope.vault.config != null ) {
            var token_duration_minutes = scope.vault.config.token_duration;
            var token_life = Date.now() - scope.vault.token_time;
            var token_life_date = new Date(token_life);
            var token_life_left = token_duration_minutes - token_life_date.getMinutes();
            
            if( token_life_left <= 5 ) {
                $('#session_time_left').html( "The session will expire in " + token_life_left + " minutes." );
                $('#session_time_left').show();
            }

            if( token_life_left == 0 ) {
                console.log( "Sesssion token expired." );
                location.reload();
            }
        }
        else {
            $('#session_time').html( "Session started " + $.timeago(scope.vault.token_time) );
        }
    };
}]);
