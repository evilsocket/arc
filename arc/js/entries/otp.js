/*
 * Arc - Copyleft of Simone 'evilsocket' Margaritelli.
 * evilsocket at protonmail dot com
 * https://www.evilsocket.net/
 *
 * See LICENSE.
 */
$.getScript("/js/libs/jsOTP.min.js");

const ENTRY_TYPE_TOTP = 8;

function TOTPEntry(name, value) {
    Entry.call( this, ENTRY_TYPE_TOTP, name, value );

    this.topt = null;
    this.timeout = null;
    this.code = null;
    this.t = 30;
}

TOTPEntry.prototype = Object.create(Entry.prototype);
TOTPEntry.prototype.constructor = TOTPEntry;

TOTPEntry.prototype.TypeName = function() {
    return "TOTPEntry";
}

TOTPEntry.prototype.Icon = function() {
    return 'key';
}

TOTPEntry.prototype.btn = function(id, name, icon) {
    return '<button id="btn_pass_' + name + '_' + id + '" type="button" class="btn btn-default btn-password">' +
             '<span class="fa fa-' + icon + '"></span>' + 
           '</button>';
}

TOTPEntry.prototype.formGroup = function(input, id, mime) {
    var id = this.id(id);

    return '<div class="form-group otp-group">' + 
             '<h5 class="editable label label-default entry-title label-' + this.type + '" id="editable_' + id + '">' + this.name + '</h5>' +
             input +
             '<span id="otp">' +
                 '<a href="#" class="copy" id="otp_copy_' + id + '">' +
                     '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                 '</a>' +
                 '<span class="value" id="otp_v_' + id + '">------</span>' +
                 '<i class="clock fa fa-clock-o" aria-hidden="true"></i>' +
                 '<span class="time" id="otp_t_' + id + '">--</span>' +
             '</span>' +
            '</div>';
}

TOTPEntry.prototype.input = function(with_value, id) {
    id = this.id(id);
    return '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'type="password" ' + 
             'placeholder="Enter the TOTP secret here." ' +
             'name="' + id + '" ' + 
             'id="' + id + '" ' +
             'value="' + ( with_value ? this.value : '' ) + '"' +
             '/>';
}

TOTPEntry.prototype.Render = function(with_value, id){
    return this.formGroup( this.input(with_value, id), id ); 
}

TOTPEntry.prototype.stopTimer = function(id) {
    // console.log( "Stopping timer for " + id );
    if( this.timeout != null ) {
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    $('#otp_v_' + id).text('------');
    $('#otp_t_' + id).text('--');
};

TOTPEntry.prototype.update = function(id, secret) {
    --this.t;
    if( this.t < 0 ) {
        this.newCode(id,secret);
    }
    else {
        $('#otp_t_' + id).text(this.t);
        var that = this;
        this.timeout = setTimeout( function(){ that.update(id, secret); }, 1000 );
    }
}

TOTPEntry.prototype.newCode = function(id, secret) {
    // console.log("New code for " + id);
    this.stopTimer(id);

    try {
        this.totp = new jsOTP.totp();
        this.code = this.totp.getOtp(secret);

        this.t = 30;

        $('#otp_v_' + id).text(this.code);
        $('#otp_t_' + id).text(this.t);

        var that = this;
        this.timeout = setTimeout( function(){ that.update(id, secret); }, 1000 );
    }
    catch(e){
        // console.log(e);
        this.stopTimer(id);
    }

};

TOTPEntry.prototype.onSecretChanged = function(id) {
    // console.log( "Secret " + id + " changed." );
    var $elem = $('#' + id);
    var secret = $elem.val();
 
    if( secret != "" ) {
        this.newCode(id, secret); 
    } else {
        this.stopTimer(id);
    }
};

TOTPEntry.prototype.OnRendered = function(id) {
    Entry.prototype.OnRendered.call( this, id );
    var that = this;

    id = this.id(id);
    $('#' + id).on( 'input change', function(){
        that.onSecretChanged(id);
    });

    that.onSecretChanged(id);

    var btn_copy_id = '#otp_copy_' + id;
    $(btn_copy_id).click(function() {
        var pass = $('#otp_v_'+id).text();
        var prev = $(btn_copy_id).html();
        copyTextToClipboard(pass);

        $(btn_copy_id).html("<small>Copied!</small>");
        setTimeout(function(){
            $(btn_copy_id).html(prev);
        }, 1000);

        return false;
    });
}
