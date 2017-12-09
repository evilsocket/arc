/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
function Arc(on_req_executed) {
    this.token = null;
    this.token_time = null;
    this.config = null;
    this.store = null;
    this.records = null;
    this.req = null;
    this.req_started = null;
    this.req_time = null;
    this.on_req_executed = on_req_executed || function(success, req, time){
        console.log( req + " executed " + ( success ? "succesfully" : "with errors" ) + " in " + time + " ms." );
    };
}

Arc.prototype.IsLogged = function() {
    return ( this.token != null );
}

Arc.prototype.HasStore = function() {
    return this.IsLogged() && ( this.store != null );
}

Arc.prototype.onRequestStart = function( req ) {
    this.req = req;
    this.req_time = null;
    this.req_started = new Date();
}

Arc.prototype.onRequestDone = function( success ) {
    this.req_time = ( new Date() ) - this.req_started;
    this.on_req_executed( success, this.req, this.req_time );
}

Arc.prototype.Api = function( method, path, data, success, error, raw ) {
    var dataType = raw ? undefined : 'json';
    console.log( method + ' ' + path + ' (' + dataType + ')' );

    this.onRequestStart( method + ' ' + path );

    var arc = this;
    return $.ajax({
        type: method,
        url: path,
        beforeSend: function (xhr) {
            if( arc.token != null ) {
                xhr.setRequestHeader('Authorization', 'Bearer: ' + arc.token);
            }
        },
        success: function(r) {
            arc.onRequestDone(true);            
            success(r);
        },
        error: function(e) {
            arc.onRequestDone(false);            
            error(e);
        },
        data: data ? JSON.stringify(data) : null,
        contentType: "application/json",
        dataType: dataType,
        timeout: 60 * 60 * 1000
    });
}

Arc.prototype.Logout = function() {
    console.log( "Logging out, deleting token " + this.token );
    this.token = null;
    this.token_time = null;
}

Arc.prototype.Login = function(username, password, success, error) {
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

Arc.prototype.Stores = function(success, error) {
    this.Api( 'GET', '/api/stores', null, success, error );
}

Arc.prototype.Records = function( store, success, error ) {
    console.log( "Loading store-" + store.ID + " records ..." );
    var arc = this;
    this.Api( 'GET', '/api/store/' + store.ID + '/records', null, function(records){
        arc.records = records;
        success();
    }, error );
}

Arc.prototype.GetStore = function(id, success, error) {
    this.Api( 'GET', '/api/store/' + id, null, success, error );
}

Arc.prototype.DeleteStore = function(id, success, error) {
    this.Api( 'DELETE', '/api/store/' + id, null, success, error );
}

Arc.prototype.AddStore = function( title, success, error ) {
    console.log( "Creating store '" + title + "'" );
    var record = {
        'Title': title,
    };
    this.Api( 'POST', '/api/stores/', record, success, error );
}

Arc.prototype.UpdateStore = function( id, title, success, error ) {
    console.log( "Updating store " + id + " to '" + title + "'" );
    var store = {
        'ID': id,
        'Title': title,
    };
    this.Api( 'PUT', '/api/store/' + id, store, success, error );
}

Arc.prototype.SetStore = function( id, success, error ) {
    console.log( "Selecting store '" + id + "'" );
    var arc = this;
    this.GetStore( id, function(s){
        arc.store = s;
        arc.Records( s, success, error );
    },
    error);
}

Arc.prototype.GetRecordBuffer = function( record_id, success, error ) {
    var path = '/api/store/' + this.store.ID + '/record/' + record_id + '/buffer';
    return this.Api( 'GET', path, null, success, error, true );
};

Arc.prototype.AddRecord = function( title, expire_at, prune, data, encryption, size, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }

    var record = {
        'Title': title,
        'Data': data,
        'ExpiredAt': expire_at,
        'Prune': prune,
        'Encryption': encryption,
        'Size': size,
    };

    return this.Api( 'POST', '/api/store/' + this.store.ID + '/records', record, success, error );
}

Arc.prototype.UpdateRecord = function( id, title, expire_at, prune, data, encryption, size, success, error) {
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
        'Size': size
    };
    return this.Api( 'PUT', '/api/store/' + this.store.ID + '/record/' + id, record, success, error );
}

Arc.prototype.DeleteRecord = function( record, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    this.Api( 'DELETE', '/api/store/' + this.store.ID + '/record/' + record.ID, null, success, error );
}
