function Vault() {
    this.token = null;
    this.store = null;
    this.records = null;
}

Vault.prototype.IsLogged = function() {
    // TODO: Validate token?
    return ( this.token != null );
}

Vault.prototype.HasStore = function() {
    return this.IsLogged() && ( this.store != null );
}

Vault.prototype.Api = function( method, path, data, success, error ) {
    console.log( method + ' ' + path );

    var vault = this;
    $.ajax({
        type: method,
        url: path,
        beforeSend: function (xhr) {
            if( vault.token != null ) {
                xhr.setRequestHeader('Authorization', 'Bearer: ' + vault.token);
            }
        },
        data: data ? JSON.stringify(data) : null,
        success: success,
        error: error,
        contentType: "application/json",
        dataType: 'json'
    });
}

Vault.prototype.Logout = function() {
    console.log( "Logging out, deleting token " + this.token );
    this.token = null;
}

Vault.prototype.Login = function(username, password, success, error) {
    console.log( "Logging in with username="+username+" and password="+password );
    
    var v = this;
    var login = { username: username, password: password };

    this.Api( 'POST', '/auth', login, function(resp) {
        if( resp.token != null ) {
            v.token = resp.token;
            success(resp.token);
        } else {
            error(resp);
        }
    },
    error);
}

Vault.prototype.Stores = function(success, error) {
    this.Api( 'GET', '/api/stores', null, success, error );
}

Vault.prototype.Records = function( store, success, error ) {
    console.log( "Loading store-" + store.ID + " records ..." );
    var vault = this;
    this.Api( 'GET', '/api/store/' + store.ID + '/records', null, function(records){
        vault.records = records;
        success();
    }, error );
}

Vault.prototype.SetStore = function( name, success, error ) {
    console.log( "Selecting store '" + name + "'" );

    var vault = this;
    this.Stores(function(stores){
        var nstores = stores.length;
        for( var i = 0; i < nstores; i++ ) {
            var s = stores[i];
            if( s.Name == name ) {
                vault.store = s;
                vault.Records( s, success, error );
                break;
            }
        }

        if( vault.store == null ){ 
            error("Could not find store.");
        } else {
            success();
        }
    },
    error);
}

Vault.prototype.AddRecord = function( title, data, encryption, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }

    var record = {
        'Title': title,
        'Data': data,
        'Encryption': encryption,
    };

    this.Api( 'POST', '/api/store/' + this.store.ID + '/records', record, success, error );
}

Vault.prototype.UpdateRecord = function( id, title, data, encryption, success, error) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    var record = {
        'ID': id,
        'StoreID': this.store.ID,
        'Title': title,
        'Data': data,
        'Encryption': encryption,
    };
    this.Api( 'PUT', '/api/store/' + this.store.ID + '/record/' + id, record, success, error );
}

Vault.prototype.DeleteRecord = function( record, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    this.Api( 'DELETE', '/api/store/' + this.store.ID + '/record/' + record.ID, record, success, error );
}
