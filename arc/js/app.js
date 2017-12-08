/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
var ZERO_DATETIME = "0001-01-01T00:00:00Z";

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
    var name = $('#editable_' +  id).text();
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

function bytesFormat(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

var app = angular.module('PM', [], function($interpolateProvider) {

});

app.filter('timeago', function() {
    return function(date) {
       return $.timeago(date);
    }
});

app.filter('expiration', function() {
    return function(date) {
        // Expired
        if( Date.parse(date) < Date.now() ) {
            return 'Expired ' + $.timeago(date);
        } 
        // Yet to expire.
        else {
            return 'Expiring in ' + $.timeago(date).replace(' ago', '');
        }
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
    scope.arc = new Arc();
    scope.key = null;
    scope.secret = null;
    scope.store_id = null;
    scope.stores = null;
    scope.filter = null;
    scope.timeout = null;
    scope.registeredTypes = REGISTERED_TYPES;
    scope.templates = REGISTERED_TEMPLATES;

    scope.setError = function(message) {
        scope.setStatus(null);
        scope.errorMessage = message;

        if( message ) {
            if( typeof(message) == 'object' ) {
                message = message.responseJSON.message;
            }

            console.log(message);
            $('#error_body').html(message);
            $('#error_modal').modal();
        } else {
            $('#error_modal').modal('hide');
        }
    };

    scope.errorHandler = function(error) {
        scope.setError(error);
        scope.$apply();
    };

    scope.setStatus = function(message) {
        if( message ) 
            console.log(message);
        // scope.statusMessage = message;
    };

    scope.setSecret = function(secret) {
        scope.secret = secret;
    };

    scope.setKey = function(key) {
        scope.key = $.trim(key);
        return true;
    };

    scope.getStore = function(success, force) {
        if( force == false && scope.arc.HasStore() == false ) {
            alert("No store selected");
        }
        else {
            scope.setStatus("Loading passwords store ...");
            scope.arc.SetStore( scope.store_id, function() {
                document.title = scope.arc.store.Title;
                scope.setupTimeout();
                scope.setError(null);
                scope.$apply();
            },
            scope.errorHandler );
        }
    };

    scope.onDeleteStore = function() {
        if( scope.arc.HasStore() == false ) {
            alert("No store selected");
        }
        else if( confirm( "Are you sure?" ) == true ) {
            scope.arc.DeleteStore( scope.store_id, function() {
                scope.arc.store = null;
                scope.store_id = null;
                scope.doSelectStore();
            },
            scope.errorHandler );
        }
    };

    scope.onNewStore = function() {
        var store_title = $.trim( prompt("Please enter the store title:") );
        if( store_title ) {
            scope.arc.AddStore( store_title, function() {
                scope.setError(null);
                scope.doSelectStore();
            },
            scope.errorHandler );
        }
    };

    scope.delTimeout = function() {
        if( scope.timeout != null ) {
            console.log( "Clearing timeout of " + scope.timeout.ms + " ms." );
            clearTimeout(scope.timeout.tm);
        }
        scope.timeout = null;
    };

    scope.setTimeoutTo = function(ms) {
        console.log( "Setting refresh timeout to " + ms + " ms." );

        if( scope.timeout != null ) {
            console.log( "Clearing previous timeout of " + scope.timeout.ms + " ms." );
            clearTimeout(scope.timeout.tm);
        }
        scope.timeout = {
            tm: setTimeout(function(){
                scope.delTimeout();

                scope.setStatus("Refresh timeout callback, reloading ...");
                scope.getStore(function(){}, true);
            }, ms ),
            ms: ms
        };
    };

    scope.setTimeoutIfLess = function(record) {
        var expires = Date.parse(record.ExpiredAt),
            now = Date.now();

        if( expires > now || ( expires <= now && record.Prune ) ) {
            var tm = expires - now;
            if( scope.timeout == null || this.timeout.ms > tm ) {
                this.setTimeoutTo(tm);
            }
        }
    };

    scope.setupTimeout = function() {
        for( var i = 0; i < this.arc.records.length; i++ ) {
            var record = this.arc.records[i];
            if( record.ExpiredAt != ZERO_DATETIME ) {
                this.setTimeoutIfLess(record);
            }
        }
    };

    scope.onShowStore = function(id) {
        scope.store_id = id;
        scope.setStatus("Loading passwords store ...");
        scope.getStore(function(){}, true);
    };

    scope.doSelectStore = function() {
        scope.arc.Stores(function(stores){
            document.title = "Select store"
            scope.delTimeout();
                   
            scope.stores = stores;
            scope.$apply();
        },
        scope.errorHandler );
    };

    scope.doLogin = function() {
        scope.setStatus("Logging in ...");

        var username = $('#username').val();
        var password = $('#password').val();

        if( scope.setKey( $('#key').val() ) == true ) { 
            scope.arc.Login( username, password, function(token) {
                setInterval( function(){ scope.updateSessionTime(); }, 1000 );

                scope.setError(null);
                scope.$apply();
                scope.doSelectStore();
            },
            scope.errorHandler );
        }
    };

    scope.updateFilter = function() {
        scope.filter = $('#search_filter').val(); 
    };

    scope.doesExpire = function(record) {
        return ( record.ExpiredAt != ZERO_DATETIME );
    };

    scope.isExpired = function(record) {
        return ( scope.doesExpire(record) && Date.parse(record.ExpiredAt) <= Date.now() );
    }

    scope.filterSecret = function(record) {
        if( scope.filter != null ) {
            return ( record.Title.toLowerCase().indexOf(scope.filter.toLowerCase()) != -1 );
        }
        return true;
    };

    scope.onGeneratePassword = function() {
        var value = $('#pass_n').html();
        var n = parseInt(value);
        onGenerate(n);
    };

    scope.onUsePassword = function() { 
        var pass = $('#generated_password').val();
        $('#'+g_SelectedEntryId).val(pass);
        $('#password_generator_modal').modal('hide');
        $('#'+g_SelectedEntryId).pwstrength('forceUpdate');
    };

    scope.doAddField = function(idx) {
        var list = $('#secret_entry_list'); 
        var nidx = list.find('li').length;
        var entry = $.extend( true, {}, scope.registeredTypes[idx] );

        entry.RenderToList( list, nidx );
    };

    scope.onAddField = function() {
        $('#field_selector_modal').css('z-index', '1500').modal();
    };

    scope.onAddTemplate = function() {
        var list = $('#secret_entry_list'); 
        var nidx = $('#template').val();
        var tpl = scope.templates[nidx];
        var fields = tpl.fields;

        for( var i = 0; i < fields.length; ++i ) {
            var entry = $.extend( true, {}, fields[i] );
            entry.RenderToList( list, nidx );
        }

        $('#field_selector_modal').modal('hide');
    };

    scope.onBack = function() {
        scope.arc.store = null;
        scope.stores = null;
        scope.store_id = null;
        scope.doSelectStore();
    };

    /*
     * TODO
     *
     * The following two functions are horrible hacks, anyone
     * with more experience with javascript than me is welcome
     * to fix this mess ^_^
     */
    scope.dateToPickerFormat = function(date_string) {
        // Convert to "mm/dd/yyyy hh:ii:ss",
        var e = new Date(date_string);
        return ( e.getMonth() + 1 ).pad(2) + '/' +
                 e.getDate().pad(2) + '/' +
                 e.getFullYear() + ' ' +
                 e.getHours().pad(2) + ':' +
                 e.getMinutes().pad(2) + ':' +
                 e.getSeconds().pad(2);
    };

    scope.pickerFormatToDate = function(picker_string) {
        // Convert to "2017-12-06T20:35:25.416459867+01:00"  
        var parts = picker_string.split(' ');
        var date = parts[0].split('/');
        var timezone = ( new Date().getTimezoneOffset() * -1 ) / 60
        var abs = Math.abs(timezone).pad(2);
        var tz = "";

        if( timezone >= 0 ) {
            tz = "+" + abs;
        } else {
            tz = "-" + abs;
        }

        return date[2] + '-' + date[0] + '-' + date[1] + 'T' +
               parts[1] + '.000000000' + tz + ":00";
    };

    scope.showSecretModal = function(is_new, title, date, expired_at, prune) {
        if( is_new == true ) {
            $('#cleartext-warning').show();
            $('.btn-new').show();
            $('.btn-edit').hide();
            $('#secret_date_container').hide();
            $('#secret_expired_at').val('');
            $('#pruner').val('0');
        } else {
            if( expired_at == ZERO_DATETIME ){
                $('#secret_expired_at').val('');
            }
            else {
                var to_picker = scope.dateToPickerFormat(expired_at);
                $('#secret_expired_at').val(to_picker);
            }

            $('#cleartext-warning').hide();
            $('.btn-new').hide();
            $('.btn-edit').show();
            $('#secret_date').text(date);
            $('#secret_date_container').show();
            $('#pruner').val( prune ? '1' : '0' );
        }

        $('#secret_expired_at').trigger('change');
        $('#secret_title').text(title);
        $('#secret_entry_list').html('').sortable();
        $('#secret_modal').modal();
    };

    scope.onNewSecret = function() {
        scope.showSecretModal( true, "Put a title ..." );
    };

    scope.onAdd = function() {
        scope.setStatus("Adding secret ...");

        var title = $('#secret_title').text();
        var names = $('.editable.entry-title');
        var entries = $('*[id^=entry_value_]');
        var expire_at = $('#secret_expired_at').val();
        var prune = $('#pruner').val() == '1';
        
        if( expire_at != '' ) {
            expire_at = scope.pickerFormatToDate(expire_at);
        } else {
            expire_at = ZERO_DATETIME;
        }

        if( entries.length != names.length ) {
            return alert("WTF?!");
        }

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var entry_id = input.attr('id');
            var type = parseInt( input.attr('data-entry-type') );
            var name = $(names[i]).text();
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
        
        scope.arc.AddRecord( title, expire_at, prune, data, 'aes', function(record) {
            scope.getStore( function() {
                scope.$apply();
            });
        },
        scope.errorHandler );

        $('#secret_modal').modal('hide');
    };

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

            scope.showSecretModal(false, record.title, secret.UpdatedAt, secret.ExpiredAt, secret.Prune);

            var list = $('#secret_entry_list'); 
            for( var i = 0; i < record.entries.length; i++ ){
                record.entries[i].RenderToList( list, i );
            }
        }
    };

    scope.onUpdate = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        scope.setStatus("Updating secret ...");

        var title = $('#secret_title').text();
        var names = $('.editable.entry-title');
        var entries = $('*[id^=entry_value_]');
        var expire_at = $('#secret_expired_at').val();
        var prune = $('#pruner').val() == '1';
        
        if( expire_at != '' ) {
            expire_at = scope.pickerFormatToDate(expire_at);
        } else {
            expire_at = ZERO_DATETIME;
        }

        if( entries.length != names.length ) {
            return alert("WTF?!");
        }

        var record = new Record(title);
        for( var i = 0; i < entries.length; i++ ) {
            var input = $(entries[i]);
            var entry_id = input.attr('id');
            var type = parseInt( input.attr('data-entry-type') );
            var name = $(names[i]).text();
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
        
        scope.arc.UpdateRecord( scope.secret.ID, title, expire_at, prune, data, 'aes', function(record) {
            scope.setSecret(null);
            scope.setError(null);
            scope.getStore( function() {
                scope.$apply();
            });
        },
        scope.errorHandler );

        $('#secret_modal').modal('hide');
    };

    scope.onDelete = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        if( confirm( "Delete this secret?" ) == true ) {
            scope.arc.DeleteRecord(scope.secret, function(){ 
                scope.setSecret(null);
                scope.getStore( function() {
                    scope.$apply();
                });
            },
            scope.errorHandler );

            $('#secret_modal').modal('hide');
        }
    };

    scope.updateSessionTime = function() {
        if( scope.arc.config != null ) {
            var token_duration_minutes = scope.arc.config.token_duration;
            var token_life = Date.now() - scope.arc.token_time;
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
            $('#session_time').html( "Session started " + $.timeago(scope.arc.token_time) );
        }
    };
}]);
