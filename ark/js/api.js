/*
 * Ark - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
function Ark(on_req_executed) {
    this.token = null;
    this.token_time = null;
    this.config = null;
    this.store = null;
    this.records = null;
    this.req = null;
    this.req_started = null;
    this.req_time = null;
    this.on_req_executed = on_req_executed || function(success, req, time){
        console.log( req + " executed in " + time + " ms." );
    };
}

Ark.prototype.IsLogged = function() {
    return ( this.token != null );
}

Ark.prototype.HasStore = function() {
    return this.IsLogged() && ( this.store != null );
}

Ark.prototype.onRequestStart = function( req ) {
    this.req = req;
    this.req_time = null;
    this.req_started = new Date();
}

Ark.prototype.onRequestDone = function( success ) {
    this.req_time = ( new Date() ) - this.req_started;
    this.on_req_executed( success, this.req, this.req_time );
}

Ark.prototype.Api = function( method, path, data, success, error ) {
    console.log( method + ' ' + path );

    this.onRequestStart( method + ' ' + path );

    var ark = this;
    $.ajax({
        type: method,
        url: path,
        beforeSend: function (xhr) {
            if( ark.token != null ) {
                xhr.setRequestHeader('Authorization', 'Bearer: ' + ark.token);
            }
        },
        success: function(r) {
            ark.onRequestDone(true);            
            success(r);
        },
        error: function(e) {
            ark.onRequestDone(false);            
            error(e);
        },
        data: data ? JSON.stringify(data) : null,
        contentType: "application/json",
        dataType: 'json',
        timeout: 60 * 60 * 100
    });
}

Ark.prototype.Logout = function() {
    console.log( "Logging out, deleting token " + this.token );
    this.token = null;
    this.token_time = null;
}

Ark.prototype.Login = function(username, password, success, error) {
    console.log( "Logging in with username="+username+" and password="+password );
    
    var v = this;
    var login = { username: username, password: password };

    this.Api( 'POST', '/auth', login, function(resp) {
        if( resp.token != null ) {
            v.token = resp.token;
            v.token_time = Date.now();

            v.Api( 'GET', '/api/config', null, function(resp) {
                v.config = resp;
            }, error);

            success(resp.token);
        } else {
            error(resp);
        }
    },
    error);
}

Ark.prototype.Stores = function(success, error) {
    this.Api( 'GET', '/api/stores', null, success, error );
}

Ark.prototype.Records = function( store, success, error ) {
    console.log( "Loading store-" + store.ID + " records ..." );
    var ark = this;
    this.Api( 'GET', '/api/store/' + store.ID + '/records', null, function(records){
        ark.records = records;
        success();
    }, error );
}

Ark.prototype.GetStore = function(id, success, error) {
    this.Api( 'GET', '/api/store/' + id, null, success, error );
}

Ark.prototype.DeleteStore = function(id, success, error) {
    this.Api( 'DELETE', '/api/store/' + id, null, success, error );
}

Ark.prototype.AddStore = function( title, success, error ) {
    console.log( "Creating store '" + title + "'" );
    var record = {
        'Title': title,
    };
    this.Api( 'POST', '/api/stores/', record, success, error );
}

Ark.prototype.SetStore = function( id, success, error ) {
    console.log( "Selecting store '" + id + "'" );
    var ark = this;
    this.GetStore( id, function(s){
        ark.store = s;
        ark.Records( s, success, error );
    },
    error);
}

Ark.prototype.AddRecord = function( title, expire_at, prune, data, encryption, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }

    var record = {
        'Title': title,
        'Data': data,
        'ExpiredAt': expire_at,
        'Prune': prune,
        'Encryption': encryption,
    };

    this.Api( 'POST', '/api/store/' + this.store.ID + '/records', record, success, error );
}

Ark.prototype.UpdateRecord = function( id, title, expire_at, prune, data, encryption, success, error) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    var record = {
        'ID': id,
        'StoreID': this.store.ID,
        'Title': title,
        'ExpiredAt': expire_at,
        'Prune': prune,
        'Data': data,
        'Encryption': encryption,
    };
    this.Api( 'PUT', '/api/store/' + this.store.ID + '/record/' + id, record, success, error );
}

Ark.prototype.DeleteRecord = function( record, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    this.Api( 'DELETE', '/api/store/' + this.store.ID + '/record/' + record.ID, null, success, error );
}
