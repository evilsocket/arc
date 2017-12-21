/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */

var g_EntryCounter = 0;

var REGISTERED_TYPES = [
    new URLEntry( "URL", "https://" ),
    new InputEntry( "Text Input", "" ),
    new CheckboxEntry( "Checkbox", "" ),
    new PasswordEntry( "Password", "" ),
    new TOTPEntry( "2FA", "" ),
    new TextEntry( "Text", "" ),
    new MarkdownEntry( "Markdown", "" ),
    new HTMLEntry( "HTML", "" ),
    new CodeEntry( "Source Code", "" ),
    new FileEntry( "File(s)", "" ),
    new BTCAddressEntry( "Bitcoin Address", "" ),
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

// Get a registered entry given its type.
function TypeProto(type) {
    for( var i = 0; i < REGISTERED_TYPES.length; i++ ) {
        var registered = REGISTERED_TYPES[i];
        if( registered.type == type ) {
            return registered;
        }
    }

    return null;
}

// Clone a registered entry and make the instance id unique.
function TypeClone(e) {
    var clone = $.extend( true, {}, e );
    clone.id += '_' + g_EntryCounter++;
    return clone;
}

// Create an Entry derived object from the 'o' JSON object.
function TypeFactory(o) {
    var proto = TypeProto(o.type);
    var entry = TypeClone(proto);

    entry.Populate(o);

    return entry;
}


