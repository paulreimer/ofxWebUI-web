/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

var setupMultitouch = function() {
  jQuery("#form-page").swipeleft(function() {
    ws.close();
    setupWebTouchUI();
    jQuery.mobile.changePage("#multitouch-page");
  });
  jQuery("#multitouch-page").swiperight(function() {
    ws.close();
    setupWebUI();
    jQuery.mobile.changePage("#form-page");
  });

  jQuery("#multitouch-surface").on("vmousemove", function(e) {
    var touchState = new protobuf.TouchState;

    // Get the coordinates for a mouse or touch event
    var windowSize = { x: $(window).width(), y: $(window).height() };
    var getCoords = function(e)
    {
      if (e.offsetX)
        // Works in Chrome / Safari (except on iPad/iPhone)
        return { x: e.offsetX, y: e.offsetY };
      else if (e.layerX)
        // Works in Firefox
        return { x: e.layerX, y: e.layerY };
      else
        // Works in Safari on iPad/iPhone
        // should subtract offset here, but using full page events anyway
        return { x: e.pageX, y: e.pageY };
    }
    var normalize = function(p)
    {
      return { x: p.x / windowSize.x, y: p.y / windowSize.y };
    }
 
    if (e.touches)
    {
      // Touch Enabled (loop through all touches)
      for (var i=1; i<=e.touches.length; i++)
      {
        var p = getCoords(e.touches[i - 1]); // Get info for finger i
        var touch = new protobuf.Touch;
        touch.user_id = 0;
        touch.id = i;
        touch.x = p.x;
        touch.y = p.y;

        touches.push(touch);

      }
    }
    else
    {
      // Not touch enabled (get cursor position from single event)
      var p = getCoords(e);
      var touch = new protobuf.Touch;
      touch.user_id = 0;
      touch.id = 0;
      touch.x = p.x;
      touch.y = p.y;

      touches.push(touch);
    }

    console.log('touchState');
    console.log(touchState);

    touchState.SerializeToStream(serialized);
    if (useBinary)
    {
      var bytes = new Uint8Array(serialized.getArray());
      ws.send(bytes.buffer);
    }
    else
      ws.send(serialized.getString());


    e.stopPropagation();
  });
};

var setupWebTouchUI = function() {
  var ws_url_el = jQuery("#ws_url");

  var disconnect = function() {
    try {
      if (ws.readyState !== ws.CLOSING && ws.readyState !== ws.CLOSED)
      {
        ws.close(0);
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };
  var connect = function() {
    var ws_url = get_appropriate_ws_url();
    try {
      if (window.MozWebSocket)
        ws = new MozWebSocket(ws_url, "touch");
      else if (window.WebSocket)
        ws = new WebSocket(ws_url, "touch");
      else
        return;

      if (ws.binaryType)
      {
        useBinary = false;
        ws.binaryType = 'arraybuffer';
      }

      ws.onopen = function() {
        console.log('connected to multitouch');
      }

      ws.onmessage = function(msg) {
        console.log('received multitouch message');
      } 

      ws.onclose = function(){
        console.log('disconnected multitouch');
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };

  connect();
};

