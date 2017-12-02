var vault = new Vault( 'http', 'localhost', 8081 );
var username = "vault";
var password = "vault";

$(function() {
    console.log( "Document ready, starting main.js ..." );
    

    vault.Login( username, password, function(token) {
        console.log( "Got token: " + vault.token )
        vault.Stores(function(stores){
            var nstores = stores.length;
            console.log( "Found " + nstores + " stores:" );
            for( var i = 0; i < nstores; i++ ) {
                var s = stores[i];
                console.log( "  " + s.Title );
            }
        }, function(err){
            console.log("ERROR:");
            console.log(err);
        });
    },
    function(data){
        console.log("Login error:\n" + data);
    });
})
