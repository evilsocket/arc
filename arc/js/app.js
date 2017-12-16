/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
var ZERO_DATETIME = "0001-01-01T00:00:00Z";

/*
 * Fixes #20.
 *
 * https://stackoverflow.com/questions/38398070/bootstrap-modal-does-not-work-with-clipboard-js-on-firefox
 */ 
$.fn.modal.Constructor.prototype._enforceFocus = function() {};

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
    var file = FilesGet(id);

    console.log( "Dowloading " + file.size + " bytes of data as " + name + " (" + file.type + ")" );

    // https://stackoverflow.com/questions/23795034/creating-a-blob-or-a-file-from-javascript-binary-string-changes-the-number-of-by
    var bytes = new Uint8Array(file.size);
    for( var i = 0; i < file.size; i++ ) {
        bytes[i] = file.data.charCodeAt(i);
    }

    file = new File([bytes], name, {type: file.type});
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
    if (bytes == 0) return '0 B';
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

String.prototype.stripTags = function() {
    var div = document.createElement("div");
    div.innerHTML = this;
    return div.textContent || div.innerText || "";
};

var app = angular.module('PM', [], function($interpolateProvider) {

});

app.filter('timeago', function() {
    return function(date) {
       return $.timeago(date);
    }
});

app.filter('uptime', function() {
    return function(date) {
       return $.timeago(date).replace(' ago', '');
    }
});

app.filter('expiration', function() {
    return function(date) {
        // Expired
        if( Date.parse(date) < Date.now() ) {
            return 'expired ' + $.timeago(date);
        } 
        // Yet to expire.
        else {
            return 'expiring in ' + $.timeago(date).replace(' ago', '');
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
    scope.key = window.localStorage.arkEncryptionKey;
    scope.secret = null;
    scope.store_id = null;
    scope.stores = null;
    scope.secrets = {};
    scope.filter = null;
    scope.timeout = null;
    scope.trackTotal = 0;
    scope.registeredTypes = REGISTERED_TYPES;
    scope.templates = REGISTERED_TEMPLATES;
    scope.latency = 0;
    scope.prevEvents = [];
    scope.status = {
        online: true,
        started: new Date(),
        events: []
    };

    scope.setError = function(message) {
        scope.setStatus(null);
        scope.errorMessage = message;

        if( message ) {
            console.log(message);

            if( typeof(message) == 'object' && message.responseJSON ) {
                message = message.responseJSON.message;
            }

            $('#error_body').html(message);
            $('#error_modal').modal();
        } else {
            $('#error_modal').modal('hide');
        }
    };

    scope.errorHandler = function(error) {
        scope.hideLoader();
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

    scope.setKey = function(key, persist) {
        scope.key = $.trim(key);
        if( persist ) {
            window.localStorage.arkEncryptionKey = scope.key;
        }
        return true;
    };

    scope.isModalOpen = function(id) {
        // bootstrap < 4: isShown
        // bootstra >= 4: _isShown
        return !!( $('#' + id).data('bs.modal') || {} )._isShown;
    };

    scope.isLoading = function() {
        return scope.isModalOpen('loader_modal');
    };

    scope.trackProgress = function(e){
        var clen = scope.trackTotal, 
            loaded = e.loaded;

        if( e.type == "load" ) {
            loaded = clen;
        }

        if( loaded > clen ) {
            clen = loaded;
        }

        if( !clen ) {
            var tot = "?";
            var percentage = "??? %";
            var remaining_bytes =  "?";
            var seconds_remaining = "?";
        } else {
            var tot = bytesFormat(clen);
            var percentage = Math.round((loaded * 100) / clen);
            var remaining_bytes =  clen - loaded;
            var seconds_remaining = seconds_elapsed ? remaining_bytes / bytes_per_second : 'calculating' ;
        }

        var seconds_elapsed =   ( new Date().getTime() - scope.progressAt.getTime() ) / 1000;
        var bytes_per_second =  seconds_elapsed ? loaded / seconds_elapsed : 0 ;

        $('#ptext').text( 
            bytesFormat(loaded, 3) + ' of ' + tot + ' (' + bytesFormat(bytes_per_second) + '/s)'
        );
        $('#pbar')
            .css('width', percentage + '%')
            .text( percentage + '%' );
    };

    scope.showLoader = function(message, callback) {
        console.log("LOADER> " + message);
        $('#loader_message').text(message);
        if( !scope.isLoading() ) {
            // console.log("LOADER SHOWING");
            $('#loader_modal').on('shown.bs.modal', callback ).modal({
                backdrop: 'static',
                keyboard: false 
            });
        } else if( callback ) {
            // be friendly, be async! :P
            setTimeout( callback, 0 );
        }
    };

    scope.hideLoader = function() {
        $('#loader_message').text('');

        scope.progressAt = null;
        $('#ptext').text('');
        $('#pbar')
            .css('width', '0%')
            .text( '' );

        if( scope.isLoading() ) {
            // console.log("LOADER HIDING");
            // https://stackoverflow.com/questions/14451052/in-twitter-bootstrap-how-do-i-unbind-an-event-from-the-closing-of-a-modal-dialo
            $('#loader_modal').unbind().modal('hide');
        }
    };

    scope.getStore = function(success, force) {
        if( force == false && scope.arc.HasStore() == false ) {
            alert("No store selected");
        }
        else {
            scope.setStatus("Loading passwords store ...");
            scope.arc.SetStore( scope.store_id, function() {
                document.title = scope.arc.store.title;

                scope.hideLoader();
                scope.setupTimeout();
                scope.setError(null);
                scope.$apply();
                if( success ) {
                    success();
                }
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

    scope.Timeout = {
        max: 1000 * 60 * 60 * 12,
        min: 1000
    };

    scope.setTimeoutIfLess = function(record) {
        var expires = Date.parse(record.expired_at),
            now = Date.now();

        if( expires > now || ( expires <= now && record.prune ) ) {
            var tm = expires - now;
            if( tm <= scope.Timeout.max ) {
                if( tm < scope.Timeout.min ) {
                    tm = scope.Timeout.min;
                }
                if( scope.timeout == null || this.timeout.ms > tm ) {
                    this.setTimeoutTo(tm);
                }
            }
        }
    };

    scope.setupTimeout = function() {
        for( var i = 0; i < this.arc.records.length; i++ ) {
            var record = this.arc.records[i];
            if( record.expired_at != ZERO_DATETIME ) {
                this.setTimeoutIfLess(record);
            }
        }
    };

    scope.onShowStore = function(id, callback) {
        scope.setRoute("/" + id);
        scope.store_id = id;
        scope.setStatus("Loading passwords store ...");
        scope.getStore(callback, true);
    };

    scope.doSelectStore = function() {
        scope.arc.Stores(function(stores){
            document.title = "Arc";
            scope.setRoute(null);
            scope.delTimeout();
                   
            scope.stores = stores;
            scope.$apply();
        },
        scope.errorHandler );
    };

    scope.doLogout = function() {
        if( confirm( "This will clear session data and log you out, confirm?" ) ) {
            window.localStorage.clear();
            window.location.reload();
        }
    };

    scope.doLogin = function() {
        scope.setStatus("Logging in ...");

        var persist  = $('#persist').is(':checked');
        var username = $('#username').val();
        var password = $('#password').val();

        if( scope.setKey( $('#key').val(), persist ) == true ) { 
            scope.arc.Login( username, password, persist, function(token) {
                scope.setError(null);
                scope.$apply();
                scope.route();
            },
            scope.errorHandler );
        }
    };

    scope.onStoreTitleChanged = function(new_value) {
        console.log( "Store title changed to: " + new_value );
        scope.arc.UpdateStore( scope.store_id, new_value, function(){
            scope.getStore(function(){}, true);
        },
        scope.errorHandler );
    };

    scope.updateFilter = function() {
        scope.filter = $('#search_filter').val(); 
    };

    scope.doesExpire = function(record) {
        return ( record.expired_at != ZERO_DATETIME );
    };

    scope.isExpired = function(record) {
        return ( scope.doesExpire(record) && Date.parse(record.expired_at) <= Date.now() );
    }

    scope.filterSecret = function(record) {
        if( scope.filter != null ) {
            return ( record.title.toLowerCase().indexOf(scope.filter.toLowerCase()) != -1 );
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
            var eidx = list.find('li').length;
            entry.RenderToList( list, eidx );
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

    scope.showSecretModal = function(is_new, title, date, expired_at, prune, size) {
        if( is_new == true ) {
            $('#secret_meta').text('');
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

            $('#secret_meta').text("This record is " + bytesFormat(size) + " and has been updated " + $.timeago(date) + ".");
            $('#cleartext-warning').hide();
            $('.btn-new').hide();
            $('.btn-edit').show();
            $('#secret_date').text(date);
            $('#secret_date_container').show();
            $('#pruner').val( prune ? '1' : '0' );
        }

        $('#secret_expired_at').trigger('change');
        $('#secret_title').text(title);
        $('#secret_entry_list').html('').sortable({handle: 'i.fa-arrows'});
        $('#secret_modal').modal().on('hidden.bs.modal', function(){
            document.title = scope.arc.store.title;
            scope.setRoute("/" + scope.store_id);  
        });
    };

    scope.onNewSecret = function() {null
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

        $('#secret_modal').modal('hide');

        scope.showLoader("Encrypting record ...", function(){
            // Execute asynchronously to not block the ui.
            setTimeout( function() {
                var record = new Record(title);
                for( var i = 0; i < entries.length; i++ ) {
                    var input = $(entries[i]);
                    var entry_id = input.attr('id');
                    var type = parseInt( input.attr('data-entry-type') );
                    var name = $(names[i]).text();
                    var value = '';

                    if( input.prop('tagName').toLowerCase() == 'input' ) {
                        switch(input.attr('type')) {
                            case 'checkbox':
                                value = input.is(':checked') ? '1' : '0'
                            break;
                            default:
                                value = input.val();
                        }
                    }
                    else {
                        value = input.html();
                    }

                    if( type == ENTRY_TYPE_FILE ) {
                        var file = FilesGet(entry_id);
                        // free the memory
                        FilesDel(entry_id);
                        value = JSON.stringify(file);
                    }

                    record.AddEntry(new Entry( type, name, value));
                }

                record.Encrypt(scope.key).then(function(data){
                    var size = data.length;
                    scope.trackTotal = size;
                    scope.progressAt = new Date();
                    scope.showLoader("Adding record ...", function(){
                        scope.arc.AddRecord( title, expire_at, prune, data, 'aes', size, function(record) {
                            scope.getStore(function() {});
                        },
                        scope.errorHandler ).uploadProgress(scope.trackProgress);
                    });
                });

            }, 0 );
        });
    };

    scope.getSecretById = function(id) {
        for( var i = 0; i < scope.arc.records.length; i++ ) {
            var secret = scope.arc.records[i];
            if( secret.id == id ){
                return secret;
            }
        }

        alert( "WTF?! " + id );
    };

    scope.onShowSecret = function(id) {
        var secret = scope.getSecretById(id);

        console.log( "Loading record " + secret.id );

        scope.trackTotal = secret.size;
        scope.showLoader( "Buffering data ...", function() {
            // start reading data when loader is shown
            scope.progressAt = new Date();
            scope.arc.GetRecordBuffer( secret.id, function(data){
                // start decrypting data when message is updated
                scope.showLoader( "Decrypting data ...", function() {
                    var record = new Record(secret.title);
                    record.Decrypt( secret.encryption, scope.key, data, 
                        function(){
                            scope.setRoute("/" + scope.store_id + "/" + id);
                            scope.setSecret(secret)
                            document.title = scope.arc.store.title + " > " + secret.title;

                            $('#record_lock_' + secret.id ).removeClass("fa-lock").addClass("fa-unlock");
                            $('#record_status_' + secret.id ).removeClass("status-locked").addClass("status-unlocked");

                            scope.showSecretModal(false, record.title, secret.updated_at, secret.expired_at, secret.prune, secret.size);

                            var list = $('#secret_entry_list'); 
                            for( var i = 0; i < record.entries.length; i++ ){
                                record.entries[i].RenderToList( list, i );
                            }

                            scope.hideLoader();
                        }, 
                        function(error){
                            if( error )
                                console.log(error);
                            $('#record_error_' + secret.id).html("Error while decrypting record data.");
                            $('#record_status_' + secret.id ).addClass("status-error");

                            scope.hideLoader();
                        }
                    );
                });

            }, scope.errorHandler ).progress(scope.trackProgress);
        });
    };

    scope.onUpdate = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

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

        $('#secret_modal').modal('hide');

        scope.showLoader("Encrypting record ...", function(){
            var record = new Record(title);
            for( var i = 0; i < entries.length; i++ ) {
                var input = $(entries[i]);
                var entry_id = input.attr('id');
                var type = parseInt( input.attr('data-entry-type') );
                var name = $(names[i]).text();
                var value = '';

                if( input.prop('tagName').toLowerCase() == 'input' ) {
                    switch(input.attr('type')) {
                        case 'checkbox':
                            value = input.is(':checked') ? '1' : '0'
                        break;
                        default:
                            value = input.val();
                    }
                }
                else {
                    value = input.html();
                }

                console.log("value = " + value);

                if( type == ENTRY_TYPE_FILE ) {
                    var file = FilesGet(entry_id);
                    // free the memory!
                    FilesDel(entry_id);
                    value = JSON.stringify(file);
                }

                record.AddEntry(new Entry( type, name, value ));
            }
            
            record.Encrypt(scope.key).then(function(data){
                var size = data.length
                scope.trackTotal = size;
                scope.progressAt = new Date();
                scope.showLoader("Updating Record ...", function(){
                    scope.arc.UpdateRecord( scope.secret.id, title, expire_at, prune, data, 'aes', size, function(record) {
                        scope.setSecret(null);
                        scope.setError(null);
                        scope.getStore(function(){});
                    },
                    scope.errorHandler ).uploadProgress(scope.trackProgress);
                });
            });
        });
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

    scope.showEvent = function(idx) {
        var e = scope.status.events[idx];
        $('#event_title').html( e.Title );
        $('#event_time').html( e.Time );
        $('#event_body').html( e.Description );
        $('#event_modal').modal();
    };

    scope.clearEvents = function() {
        console.log("Clearing events.");
        scope.arc.ClearEvents();
    };

    scope.updateServerStatus = function() {
        scope.latencyRequested = Date.now();
        scope.arc.Status(function(s){
            scope.latency = Date.now() - scope.latencyRequested;
            scope.status = s; 

            if( scope.status.events.length > scope.prevEvents.length ) {
                var n_new = scope.status.events.length - scope.prevEvents.length;
                for( var i = 0; i < n_new; i++ ) {
                    var e = scope.status.events[i];
                    $.notify( e.Description.stripTags(), {
                        'title': e.Title.stripTags(),
                        'icon':  location.protocol + '//' + location.hostname+(location.port ? ':'+location.port: '')+"/img/logo.png" 
                    });
                }
            }

            scope.prevEvents = scope.status.events;
            scope.$apply();
        },
        function(e){
            console.log(e);

            if( e.status == 403 ) {
                window.localStorage.clear();
                window.location.reload();
            } else {
                scope.status.online = false;
                scope.$apply();
            }
        });

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

    scope.setRoute = function(route) {
        route = route ? '#!#' + route : '#';
        if(history.pushState) {
            history.pushState(null, null, route);
        }
        else {
            location.hash = route;
        }
    };

    scope.getRoute = function() {
        var hash = location.hash;
        if( hash.indexOf("#!#") == 0 ) {
            return decodeURIComponent(location.hash.substr(3));
        }
        return "";
    };

    scope.parseRoute = function(route) {
        var parts = route.split('/'),
            n_parts = parts.length,
            store_id = null,
            record_id = null;
        
        if( n_parts >= 2 && !isNaN(parts[1]) ){
            store_id = parseInt(parts[1]);
        } 
        
        if( store_id != null && n_parts >= 3 && !isNaN(parts[2]) ){
            record_id = parseInt(parts[2]);
        }

        return [store_id, record_id];
    };

    scope.route = function() {
        setInterval( function(){ scope.updateServerStatus(); }, 1000 );

        $(document).keypress(function(e){
            var inStoreSelection = ( scope.store_id == null );
            var inSecretSelection = !inStoreSelection && ( scope.isModalOpen('secret_modal') == false );
            var inSecretModal = !inStoreSelection && ( scope.isModalOpen('secret_modal') == true );
            var inEditMode = inSecretModal && $('.btn-edit').is(':visible');
            var inNewMode = inSecretModal && !$('.btn-edit').is(':visible');
            
            // n -> create new item
            if( e.which == 110 ) {
                if( inStoreSelection ) {
                    scope.onNewStore(); 
                }
                else if( inSecretSelection ) {
                    scope.onNewSecret();
                }

                e.preventDefault();
            }

            // d -> delete store
            if( inSecretSelection && e.which == 100 ) {
                scope.onDeleteStore();
                e.preventDefault();
            }

            if( inSecretModal ) {
                // a -> add element
                // s -> save
                // d -> delete
                // e -> set expiration
                if( e.which == 97 ) {
                    scope.onAddField();
                } else if( e.which == 115 ) {
                    if( inEditMode ) {
                        scope.onUpdate();
                    } else {
                        scope.onAdd();
                    }
                } else if( e.which == 100 && inEditMode ) {
                    scope.onDelete();
                } else if( e.which == 101 ) {
                    $('#expiration_btn').click();
                }

                e.preventDefault();
            }
        });

        var route = this.getRoute();
        var [ store_id, record_id ] = this.parseRoute(route);
        
        if( store_id == null ) {
            scope.doSelectStore();
        } 
        else if( record_id == null ) {
            scope.onShowStore(store_id);
        } else {
            scope.onShowStore(store_id, function(){
                scope.onShowSecret(record_id);
            });
        }
    };

    if( scope.key != null ){
        scope.route();
    }
}]);
