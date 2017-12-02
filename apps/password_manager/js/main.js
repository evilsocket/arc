const ENTRY_TYPE_PASSWORD = 0;

function Entry(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
}

function RenderEntry(entry) {
    if( entry.type == ENTRY_TYPE_PASSWORD ) {
        return '<b>' + entry.name + '</b> <input type="password" name="' + entry.name + '" value="' + entry.value + '"/>';
    }

    return "Unhandled entry type " + entry.type;
}

function Record(title) {
    this.title = title
    this.entries = [];
}

Record.prototype.AddEntry = function(entry) {
    this.entries.push(entry);
}

Record.prototype.Encrypt = function( key ) {
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
    this.entries = JSON.parse(data);
    console.log( "Loaded " + this.entries.length + " entries." );
}

var app = angular.module('PM', [], function($interpolateProvider) {

});

app.filter('timeago', function() {
    return function(date) {
       return $.timeago(date);
    }
});

app.controller('PMController', ['$scope', function (scope) {
    scope.statusMessage = null;
    scope.errorMessage = null;
    scope.vault = new Vault();
    scope.key = null;
    scope.secret = null;
    scope.filter = null;

    scope.setError = function(message) {
        if( message ) 
            console.log("error = " + message);
        scope.setStatus(null);
        scope.errorMessage = message;
    };

    scope.setStatus = function(message) {
        if( message ) 
            console.log("status = " + message);
        scope.statusMessage = message;
    };

    scope.setSecret = function(secret) {
        if( secret )
            console.log(secret);
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

    scope.doAdd = function() {
        scope.setStatus("Adding password ...");

        var title = $('#pass_title').val();
        var data = $('#pass_data').val();
        
        var record = new Record(title);

        record.AddEntry(new Entry( ENTRY_TYPE_PASSWORD, "password", data ));
        
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

    scope.deleteSecret = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        if( confirm( "Delete this secret?" ) == true ) {
            scope.vault.DeleteRecord(scope.secret, function(){ 
                scope.setSecret(null)
                $('#secret_modal').modal('hide');
                scope.getStore( function() {
                    scope.$apply();
                });
            },
            function(err){
                scope.setError(error);
                scope.$apply();
            });
        }
    }

    scope.saveSecret = function() {
        // this shouldn't happen, but better be safe than sorry :)
        if( scope.secret == null ){
            return;
        }

        alert("TODO");
        
        scope.setSecret(null)
        $('#secret_modal').modal('hide');

    }

    scope.showSecret = function(secret) {
        scope.setSecret(secret)
    
        var record = new Record(secret.Title);

        record.Decrypt( scope.key, secret.Data );

        $('#modal_title').html(record.title);

        var rendered = "";
        for( var i = 0; i < record.entries.length; i++ ){
            rendered += RenderEntry( record.entries[i] );
        }

        $('#modal_body').html(rendered);
        $('#secret_modal').modal();
    }
}]);
