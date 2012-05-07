jQuery(document).ready(function() {
  var ws_url_el = jQuery("#ws_url");
  var title_sep = ' | ';
  /*
  var title_base = null;
  if (document.title.indexOf(title_sep)>=0)
    title_base = document.title.split(title_sep)[0]
  */
  var title_base = "G++ Sign";

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
    var ws_url = get_appropriate_ws_url(7681);
    try {
      if (window.MozWebSocket)
        ws = new MozWebSocket(ws_url, "ofx");
      else if (window.WebSocket)
        ws = new WebSocket(ws_url, "ofx");
      else
        return;

      /*
      if (ws.binaryType)
      {
        ws.binaryType = 'arraybuffer';
      }
      */

      ws.onopen = function() {
        ws_url_el
          .attr('data-theme', 'd')
          .click(disconnect);

        jQuery('.ui-icon', ws_url_el)
          .addClass('ui-icon-check')
          .removeClass('ui-icon-refresh');

        jQuery('.ui-btn-text', ws_url_el)
          .text(ws_url);

        jQuery('#ws_status')
          .text('Connected');

        document.title = title_base + title_sep + 'Connected';
      }

      ws.onmessage = function(msg) {
        var ui = new protobuf.ui;
        var serialized = (ws.binaryType==='arraybuffer')?
          new PROTO.ByteArrayStream(msg.data) :
          new PROTO.Base64Stream(msg.data);

        ui.ParseFromStream(serialized);

        live = false;
        for (var field_name in ui.values_)
        {
          var el = jQuery('#'+field_name);
          var options = ui.properties_[field_name].options;
          if (el)
            set_field_from_value(el, ui.values_[field_name], options.template);
        }
        live = true;
      } 

      ws.onclose = function(){
        ws_url_el
          .attr('data-theme', 'b')
          .click(connect);

        jQuery('.ui-icon', ws_url_el)
          .addClass('ui-icon-refresh')
          .removeClass('ui-icon-check');

        jQuery('.ui-btn-text', ws_url_el)
          .text("Reconnect");

        jQuery('#ws_status')
          .text('Disconnected');

        document.title = title_base + title_sep + 'Disconnected';
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };

  connect();
  ws_url_el.click(connect);
});

