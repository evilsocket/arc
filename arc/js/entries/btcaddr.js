/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
const ENTRY_TYPE_BTC_ADDR = 7;

function BTCAddressEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_BTC_ADDR, name, value );
}

BTCAddressEntry.prototype = Object.create(Entry.prototype);
BTCAddressEntry.prototype.constructor = BTCAddressEntry;

BTCAddressEntry.prototype.TypeName = function() {
    return "BTCAddressEntry";
}

BTCAddressEntry.prototype.Icon = function() {
    return 'btc';
}

BTCAddressEntry.prototype.formGroup = function(input, id, mime) {
    var id = this.id(id);

    return '<div class="form-group">' + 
             '<span class="editable label label-default entry-title label-' + this.type + '" id="editable_' + id + '">' + this.name + '</span>' +
             input +
             '<span id="balance_' + id + '" class="btc">? ฿</span>' +
             '<br/>' +
            '</div>';
}

BTCAddressEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.input('text', with_value, id), id ); 
}

BTCAddressEntry.prototype.keepUpdating = function(id) {
    var $elem = $('#' + id);
    var address = $elem.val();
    var that = this;
    var url = "https://blockchain.info/q/addressbalance/" + address;

    console.log(url);

    $.ajax({
        type: 'GET',
        url: url,
        success: function(data) {
            // console.log(data);
            $('#balance_'+ id).html( ( data ? parseFloat(data) / 100000000.0 : '?' ) + ' ฿' );
            setTimeout( function(){ that.keepUpdating(id); }, 5000 );
        },
        error: function(error){
            console.log(error);
            $('#balance_'+id).html( '? ฿' );
            setTimeout( function(){ that.keepUpdating(id); }, 5000 );
        },
        cache: false,
        timeout: 60 * 60 * 1000
    });
};

BTCAddressEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );

    this.keepUpdating(this.id(id));
}
