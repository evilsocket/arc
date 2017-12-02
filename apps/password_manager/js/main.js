var username = "vault";
var password = "vault";
var store    = "passwords";

var app = angular.module('PM', [], function($interpolateProvider) {

});

app.controller('PMController', ['$scope', function (scope) {
    scope.loginError = false;
    scope.vault = new Vault();

    scope.doLogin = function() {
        var username = $('#username').val();
        var password = $('#password').val();

        scope.vault.Login( username, password, function(token) {
            scope.loginError = false;
            scope.$apply();
        },
        function(error){
            scope.loginError = true;
            scope.$apply();
        });

    }
    /*
    scope.update = function() {
        $.get('/targets', function(data) {
            if( data.stats.Progress < 100.0 || scope.firstTimeUpdate == false ) {
                var start = new Date(data.stats.Start),
                    stop = new Date(data.stats.Stop),
                    dur = new Date(null);

                dur.setSeconds( (stop-start) / 1000 );
                scope.duration = dur.toISOString().substr(11, 8);
            }
            
            scope.ntargets = Object.keys(scope.targets).length;

            scope.applyFilters(data);

            scope.targets = data.targets;
            scope.domain = data.domain;
            scope.stats = data.stats;
            
            document.title = "XRAY ( " + scope.domain + " | " + scope.stats.Progress.toFixed(2) + "% )";

            scope.$apply();
            scope.firstTimeUpdate = true;

            $('.htoggle').each(function() {
                $(this).click(function(e){
                    $( $(this).attr('href') ).toggle();
                    return false;
                });
            });
        });
    }

    setInterval( scope.update, 500 );
    */
}]);

/*
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
*/
