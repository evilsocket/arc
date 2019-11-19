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

BTCAddressEntry.prototype.Icon = function() {
    return 'btc';
}

BTCAddressEntry.prototype.formGroup = function(input) {
    return '<div class="form-group">' + 
             '<h5 class="editable label label-default entry-title label-' + this.type + '" id="editable_' + this.id + '">' + this.name + '</h5>' +
             input +
             '<span id="balance_' + this.id + '" class="btc">? ฿</span>' +
             '<br/>' +
            '</div>';
}

BTCAddressEntry.prototype.Render = function(with_value){
    return this.formGroup( this.input('text', with_value) ); 
}

BTCAddressEntry.prototype.keepUpdating = function() {
    var id = this.id;
    var $elem = $('#' + id);
    var address = $elem.val();
    var that = this;

    $.ajax({
        type: 'GET',
        url: "https://blockchain.info/q/addressbalance/" + address,
        success: function(data) {
            $('#balance_'+ id).html( ( data ? parseFloat(data) / 100000000.0 : '?' ) + ' ฿' );
            setTimeout( function(){ that.keepUpdating(); }, 5000 );
        },
        error: function(error){
            console.log(error);
            $('#balance_'+id).html( '? ฿' );
            setTimeout( function(){ that.keepUpdating(); }, 5000 );
        },
        cache: false,
        timeout: 60 * 60 * 1000
    });
};

BTCAddressEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );
    this.keepUpdating();
}
