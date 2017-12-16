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
    new CheckboxEntry( "Checkbox", "" ),
    new PasswordEntry( "Password", "" ),
    new TextEntry( "Text", "" ),
    new MarkdownEntry( "Markdown", "" ),
    new HTMLEntry( "HTML", "" ),
    new FileEntry( "File(s)", "" ),
];

var REGISTERED_TEMPLATES = [
    { name: "Web Login", fields:[ 
        new URLEntry( "URL", "https://" ),  
        new InputEntry( "Login", "" ),
        new PasswordEntry( "Password", "" )
    ]},
    { name: "Email Account", fields:[
        new InputEntry( "Provider", "" ),
        new InputEntry( "SMTP Server", "" ),
        new PasswordEntry( "SMTP Password", "" ),
        new InputEntry( "IMAP Server", "" ),
        new PasswordEntry( "IMAP Password", "" )
    ]},
    { name: "SSH / FTP Account", fields:[
        new URLEntry( "Hostname", "" ),  
        new InputEntry( "Username", "" ),
        new PasswordEntry( "Password", "" )
    ]},
    { name: "Credit Card", fields:[
        new InputEntry( "Bank Name", "" ),
        new InputEntry( "Owner Name", "" ),
        new InputEntry( "Card Number", "" ),
        new InputEntry( "Valid Until", "" ),
        new PasswordEntry( "CVV", "" )
    ]},
    { name: "Simple List", fields:[
        new CheckboxEntry( "Option A", "" ),
        new CheckboxEntry( "Option B", "" ),
        new CheckboxEntry( "Option C", "" ),
        new CheckboxEntry( "Option D", "" ),
        new CheckboxEntry( "Option E", "" ),
    ]}
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


