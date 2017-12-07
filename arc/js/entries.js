/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
var REGISTERED_TYPES = [
    new URLEntry( "URL", "https://" ),
    new InputEntry( "Login", "" ),
    new PasswordEntry( "Password", "" ),
    new TextEntry( "Text", "" ),
    new MarcdownEntry( "Marcdown", "" ),
    new FileEntry( "File", "" ),
];

// Create an Entry derived object from the 'o' JSON object.
function TypeFactory(o) {
    for( var i = 0; i < REGISTERED_TYPES.length; i++ ) {
        var registered = REGISTERED_TYPES[i];
        if( registered.type == o.type ) {
            // console.log( "Creating new instance of " + registered.TypeName() );
            var entry = $.extend( true, {}, registered );
            // console.log( "  new instance => " + entry.TypeName() );
            entry.is_new = false;
            entry.name = o.name;
            entry.value = o.value;
            entry.identifier = o.identifier;

            return entry;
        }
    }

    return null;
}


