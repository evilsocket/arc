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

TOTPEntry.prototype.Icon = function() {
    return 'key';
}

TOTPEntry.prototype.btn = function(name, icon) {
    return '<button id="btn_pass_' + name + '_' + this.id + '" type="button" class="btn btn-default btn-password">' +
             '<span class="fa fa-' + icon + '"></span>' + 
           '</button>';
}

TOTPEntry.prototype.formGroup = function(input, mime) {
    return '<div class="form-group otp-group">' + 
             '<h5 class="editable label label-default entry-title label-' + this.type + '" id="editable_' + this.id + '">' + this.name + '</h5>' +
             input +
             '<span id="otp">' +
                 '<a href="#" class="copy" id="otp_copy_' + this.id + '">' +
                     '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                 '</a>' +
                 '<span class="value" id="otp_v_' + this.id + '">------</span>' +
                 '<i class="clock fa fa-clock-o" aria-hidden="true"></i>' +
                 '<span class="time" id="otp_t_' + this.id + '">--</span>' +
             '</span>' +
            '</div>';
}

TOTPEntry.prototype.input = function(with_value) {
    return '<input ' + 
             'class="form-control" ' +
             'data-entry-type="' + this.type + '" ' +
             'type="password" ' + 
             'placeholder="Enter the TOTP secret here." ' +
             'name="' + this.id + '" ' + 
             'id="' + this.id + '" ' +
             'value="' + ( with_value ? this.value : '' ) + '"' +
             '/>';
}

TOTPEntry.prototype.Render = function(with_value){
    return this.formGroup( this.input(with_value) ); 
}

TOTPEntry.prototype.stopTimer = function() {
    if( this.timeout != null ) {
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    $('#otp_v_' + this.id).text('------');
    $('#otp_t_' + this.id).text('--');
};

TOTPEntry.prototype.update = function(secret) {
    --this.t;
    if( this.t < 0 ) {
        this.newCode(secret);
    }
    else {
        $('#otp_t_' + this.id).text(this.t);
        var that = this;
        this.timeout = setTimeout( function(){ that.update(secret); }, 1000 );
    }
}

TOTPEntry.prototype.newCode = function(secret) {
    this.stopTimer();

    try {
        this.totp = new jsOTP.totp();
        this.code = this.totp.getOtp(secret);

        this.t = 30;

        $('#otp_v_' + this.id).text(this.code);
        $('#otp_t_' + this.id).text(this.t);

        var that = this;
        this.timeout = setTimeout( function(){ that.update(secret); }, 1000 );
    }
    catch(e){
        this.stopTimer();
    }

};

TOTPEntry.prototype.onSecretChanged = function() {
    var secret = $('#' + this.id).val();
    if( secret != "" ) {
        this.newCode(secret); 
    } else {
        this.stopTimer();
    }
};

TOTPEntry.prototype.OnRendered = function() {
    Entry.prototype.OnRendered.call( this );

    var that = this;
    var $btn_copy = $('#otp_copy_' + this.id);

    $('#' + this.id).on( 'input change', function(){
        that.onSecretChanged();
    });

    that.onSecretChanged();

    $btn_copy.click(function() {
        var pass = $('#otp_v_'+that.id).text();
        var prev = $btn_copy.html();

        copyTextToClipboard(pass);

        $btn_copy.html("<small>Copied!</small>");
        setTimeout(function(){
            $btn_copy.html(prev);
        }, 1000);

        return false;
    });
}
