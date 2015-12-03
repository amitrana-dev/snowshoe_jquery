/*
Snowshoe jQuery (https://github.com/snowshoestamp/snowshoe_jquery)
jquery.snowshoe.js
Version 0.2.1
See GitHub project page for Documentation and License
*/

// Global variables to clear timers for animations and messages
var removePulseTimerId;
var showMessageTimerId;

(function($) {
  $.snowshoe = {
    stampScreen: {
      init: function(configs, client){
        var stampScreenElmId = configs.stampScreenElmId || "snowshoe-stamp-screen";
        var progressBarOn = configs.progressBarOn || false;
        var recognitionAnimationOn = configs.recognitionAnimationOn || false;
        var postViaAjax = configs.postViaAjax || false;
        var helpMessage = configs.messages.insufficientPoints;
        var postUrl = configs.postUrl || "/stampscreen";
        var success = configs.success || {};
        var error = configs.error || {};
        var points = [];
        var stampScreenElm = document.getElementById(stampScreenElmId);
        var stampTouching = false;
        var pollOpen = false;

        stampScreenElm.addEventListener('touchstart', function(event) {
          $("#snowshoe-messages").empty();

          if (event.touches.length >= 3 && recognitionAnimationOn) {
            $.snowshoe.animation.showRecognitionPulse();
          };

          if (helpMessage && (event.touches.length == 3 || event.touches.length == 4)) {
            // $("#snowshoe-messages").empty();
            $.snowshoe.animation.showHelpMessages(helpMessage);
          };

          if (event.touches.length >= 5) {
            var data = [];
            var touches = event.touches;
            for (var i = 0; i <= event.touches.length; i++) {
              if (touches[i]) {
                data.push([touches[i].pageX, touches[i].pageY]);
              }
            }
            send(data, postViaAjax);
            if(progressBarOn){$.snowshoe.animation.showSpinner()};
          }
        });

        stampScreenElm.addEventListener('touchend', function(event) {
          if (event.touches.length <= 5 && recognitionAnimationOn) {
            $.snowshoe.animation.removeRecognitionPulse();
            clearTimeout(removePulseTimerId);
            clearTimeout(showMessageTimerId);
            console.log('cleared');
          };
        });

        function send(points, postViaAjax){
          if (postViaAjax){
            client.postAjax(points, postUrl, success, error);
          } else {
            client.post(points, postUrl);
          }
        }
      }
    },

    animation: {
      showSpinner: function() {
        $('#snowshoe-progress-bar').addClass("snowshoe-progress-bar");
      },

      removeSpinner: function() {
        $('#snowshoe-progress-bar').removeClass("snowshoe-progress-bar");
      },

      showHelpMessages: function(helpMessage) {
        showMessageTimerId = setTimeout(function(){$("#snowshoe-messages").empty();$("#snowshoe-messages").append(helpMessage);}, 3000);
      },

      showRecognitionPulse: function() {
        $('#snowshoe-recognition-bar').addClass("snowshoe-recognition-bar");
        var removePulse = $.snowshoe.animation.removeRecognitionPulse;
        removePulseTimerId = setTimeout(removePulse, 3000);
      },

      removeRecognitionPulse: function() {
        $('#snowshoe-recognition-bar').removeClass("snowshoe-recognition-bar");
        console.log('removed');
      }
    },

    client: {
      //
      // Coupled to $.snowshoe.Base64
      //
      postAjax: function(data, endpoint, cbk, cbkError) {
        $.ajax({
          'url': endpoint,
          'data': "data=" + $.snowshoe.Base64.encode(JSON.stringify(data)),
          'type': "POST",
          'error': function(response) {
            cbkError(response.responseJSON);
            $.snowshoe.animation.removeSpinner();
            $.snowshoe.animation.removeRecognitionPulse();
          },
          'success': function(response) {
            cbk(response);
          }
        })
      },

      post: function(data, endpoint) {
        var form = $('<form method="POST"></form>');
        form.attr('action', endpoint);
        var input = $('<input name="data" type="hidden"></input>');
        input.val($.snowshoe.Base64.encode(JSON.stringify(data)));
        form.append(input);
        $('body').append(form);
        form.submit();
      }
    },

    Base64: {
      //
      // Base64 adapted from & courtesy of http://scotch.io
      //
      _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = this._utf8_encode(input);
        while (i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
      },

      _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
        return utftext;
      }
    }
  }
})(jQuery);

$.snowshoe.stampScreen.init(stampScreenInitData, $.snowshoe.client);
