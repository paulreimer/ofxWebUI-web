function get_appropriate_ws_url(port)
{
	var pcol;
	var u = document.URL;

	/*
	 * We open the websocket encrypted if this page came on an
	 * https:// url itself, otherwise unencrypted
	 */

	if (u.substring(0, 5) == "https") {
		pcol = "wss://";
		u = u.substr(8);
	} else {
		pcol = "ws://";
		if (u.substring(0, 4) == "http")
			u = u.substr(7);
	}

	u = u.split('/');

  var url;
  if (port !== undefined)
  {
    var socket = u[0].split(':');
    url = socket[0] + ":" + port;
  }
  else {
   url = u[0];
  }

	return pcol + url;
}

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
          .removeClass('ui-icon-refresh')
        jQuery('.ui-btn-text', ws_url_el).text(ws_url);
        jQuery('#ws_status').text('Connected');
        document.title = title_base + title_sep + 'Connected';
      }

      ws.onmessage = function(msg) {
        var ui = new protobuf.ui;
        var serialized = (ws.binaryType==='arraybuffer')?
          new PROTO.ByteArrayStream(msg.data) :
          new PROTO.Base64Stream(msg.data);

        ui.ParseFromStream(serialized);

        live = false;
        for (var field in ui.values_)
        {
          var el = jQuery('#'+field);
          var options = ui.properties_[field].options;
          switch (options.widget)
          {
            case 'color':
              var color = '#'+ui.values_[field].toString(16);
              jQuery.farbtastic(el.next('.colorpicker')).setColor(color);
              break;
            case 'toggle':
              el[0].selectedIndex = ui.values_[field]? 1:0;
              el.slider("refresh");
              break;
            case 'radio':
              var radios = jQuery('input[type="radio"]', el);
              radios.attr('checked', false);

              var name = [field, ui.values_[field]].join('_');
              jQuery('input[type="radio"]#'+name).attr('checked', true);

              radios.checkboxradio('refresh');
              break;

            case 'slider':
              el.val(ui.values_[field]).slider("refresh");
              break;

            case 'string':
              el.val(ui.values_[field]);
              break;

            case 'imagelist':
              console.log("implement me, too!");
              break;

            default:
              el.value = ui.values_[field];
              break;
          }
        }
        live = true;
      } 

      ws.onclose = function(){
        ws_url_el
          .attr('data-theme', 'b')
          .click(connect);
        jQuery('.ui-icon', ws_url_el)
          .addClass('ui-icon-refresh')
          .removeClass('ui-icon-check')
        jQuery('.ui-btn-text', ws_url_el).text("Reconnect");
        jQuery('#ws_status').text('Disconnected');
        document.title = title_base + title_sep + 'Disconnected';
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };

  connect();
  ws_url_el.click(connect);
});

