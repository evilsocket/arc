function Vault() {
    this.token = null
}

Vault.prototype.IsLogged = function() {
    // TODO: Validate token.
    return ( this.token != null );
}

Vault.prototype.Api = function( method, path, data, success, error ) {
    var vault = this;
    $.ajax({
        type: method,
        url: path,
        beforeSend: function (xhr) {
            if( vault.token != null ) {
                xhr.setRequestHeader('Authorization', 'Bearer: ' + vault.token);
            }
        },
        data: JSON.stringify(data),
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
