(function() {
  (function($) {
    var default_options, notify_methods;
    default_options = {
      'title': "Notification",
      'body': "Body",
      'closeTime': 5000,
      'icon' : ""
    };
    notify_methods = {
      create_notification: function(options) {
        return new Notification(options.title, options);
      },
      close_notification: function(notification, options) {
        return setTimeout(notification.close.bind(notification), options.closeTime);
      },
      set_default_icon: function(icon_url) {
        return default_options.icon = icon_url;
      },
      isSupported: function() {
        if (("Notification" in window) && (Notification.permission !== "denied")) {
          return true;
        } else {
          return false;
        }
      },
      permission_request: function() {
        if (Notification.permission === "default") {
          return Notification.requestPermission();
        }
      }
    };
    return $.extend({
      notify: function(body, arguments_options) {
        var notification, options;
        if (arguments.length < 1) {
          throw "Notification: few arguments";
        }
        if (typeof body !== 'string') {
          throw "Notification: body must 'String'";
        }
        default_options.body = body;
        options = $.extend(default_options, arguments_options);
        if (notify_methods.isSupported()) {
          notify_methods.permission_request();
          notification = notify_methods.create_notification(options);
          notify_methods.close_notification(notification, options);
          return {
            click: function(callback) {
              notification.addEventListener('click', function() {
                return callback();
              });
              return this;
            },
            show: function(callback) {
              notification.addEventListener('show', function() {
                return callback();
              });
              return this;
            },
            close: function(callback) {
              notification.addEventListener('close', function() {
                return callback();
              });
              return this;
            },
            error: function(callback) {
              notification.addEventListener('error', function() {
                return callback();
              });
              return this;
            }
          };
        }
      }
    });
  })(jQuery);

}).call(this);
