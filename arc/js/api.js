/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

function Arc(on_req_executed) {
    this.token = window.localStorage.arcToken;
    this.token_time = window.localStorage.arcTokenTime;
    this.store = null;
    this.config = null;
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
    var hasStore = this.IsLogged() && ( this.store != null );
    return hasStore;
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

Arc.prototype.ApiStream = function( method, path, meta, blob, success, error ) {
    var arc = this;
    
    console.log( method + ' ' + path );

    this.onRequestStart( method + ' ' + path );

    /*
     * I wish I cold use this, but on mobile FormData is not
     * well supported yet :(

      var form_data = new FormData();
      var file = new File(
          [blob],
          'data',
          { type: 'application/octet-stream' }
      );
     
      form_data.append( "meta", JSON.stringify(meta) );
      form_data.append( "data", file );
    */

    var boundary = "AJAX-----------------------" + (new Date).getTime();
    var ctype = "multipart/form-data; boundary=" + boundary
    var CRLF = "\r\n";
    var form_data = "--" + boundary + CRLF +
                    "Content-Disposition: form-data; name=\"meta\"" + CRLF + CRLF +
                    JSON.stringify(meta) + CRLF +
                    "--" + boundary + CRLF +
                    "Content-Disposition: form-data; name=\"data\"; filename=\"data\"" + CRLF +
                    "Content-Type: application/octet-stream" + CRLF + CRLF +
                    blob + CRLF + 
                    "--" + boundary + "--" + CRLF;

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
        cache: false,
        processData: false,
        contentType: ctype,
        data: form_data,
        timeout: 60 * 60 * 1000
    });
}

Arc.prototype.Logout = function() {
    console.log( "Logging out, deleting token " + this.token );
    this.token = null;
    this.token_time = null;
}

Arc.prototype.Login = function(username, password, persist, success, error) {
    console.log( "Logging in with username="+username+" and password="+password+" persist="+persist );
    
    var v = this;
    var login = { username: username, password: password };

    this.Api( 'POST', '/auth', login, function(resp) {
        if( resp.token != null ) {
            v.token = resp.token;
            v.token_time = Date.now();
            if( persist ) {
                console.log( "Saving token to browser storage." );
                window.localStorage.arcToken = v.token;
                window.localStorage.arcTokenTime = v.token_time;
            }

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
    console.log( "Loading store-" + store.id + " records ..." );
    var arc = this;
    this.Api( 'GET', '/api/store/' + store.id + '/records', null, function(records){
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
    var path = '/api/store/' + this.store.id + '/record/' + record_id + '/buffer';
    return this.Api( 'GET', path, null, success, error, true );
};

Arc.prototype.AddRecord = function( title, expire_at, prune, data, encryption, size, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }

    var record = {
        'title': title,
        'expired_at': expire_at,
        'prune': prune,
        'encryption': encryption,
        'size': size
    };

    return this.ApiStream( 'POST', '/api/store/' + this.store.id + '/records', record, data, success, error );
}

Arc.prototype.UpdateRecord = function( id, title, expire_at, prune, data, encryption, size, success, error) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    var record = {
        'title': title,
        'expired_at': expire_at,
        'prune': prune,
        'encryption': encryption,
        'size': size
    };

    return this.ApiStream( 'PUT', '/api/store/' + this.store.id + '/record/' + id, record, data, success, error );
}

Arc.prototype.DeleteRecord = function( record, success, error ) {
    if( this.HasStore() == false ) {
        return error("No store has been selected.");
    }
    this.Api( 'DELETE', '/api/store/' + this.store.id + '/record/' + record.id, null, success, error );
}
