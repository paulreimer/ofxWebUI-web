/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

var setupWebUI = function() {
  var ws_url_el = jQuery("#ws_url");
  var title_sep = ' | ';
  var title_base = document.title;
  if (document.title.indexOf(title_sep)>=0)
    title_base = document.title.split(title_sep)[0]

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
        ws = new MozWebSocket(ws_url, "ofx");
      else if (window.WebSocket)
        ws = new WebSocket(ws_url, "ofx");
      else
        return;

      if (ws.binaryType)
      {
        useBinary = false;
        ws.binaryType = 'arraybuffer';
      }

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
        var serialized;
        if (useBinary)
        {
          var bytes = new Uint8Array(msg.data);
          var arr = [];
          for (var i=0,n=bytes.length; i<n; ++i)
            arr.push(bytes[i]);

          serialized = new PROTO.ByteArrayStream(arr);
        }
        else {
          serialized = new PROTO.Base64Stream(msg.data);
        }

        ui.ParseFromStream(serialized);

        live = false;
        var update_fields = function(obj, root)
        {
          if (root === '.')
            root = '';

          for (var field_name in obj.values_)
          {
            //console.log('lookup id: <' + '#'+root+field_name+'>');
            var el = jQuery(document.getElementById(root+field_name))
              , options = obj.properties_[field_name].options
              , template_name = options.template+'-group-template';

            if (el)
            {
              if (template_name in group_templates)
                update_fields(obj.values_[field_name], root+field_name+'.'); 
              else {
                set_field_from_value(el, options.template, obj.values_[field_name]);
              }
            }
          }
        }
        update_fields(ui, '');
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
};

jQuery(document).on("pageinit", setupWebUI);
