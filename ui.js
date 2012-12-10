/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

field_templates['text-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+':</label> <input class="'+( it.options.template )+'-field" type="'+( it.options.type )+'" name="'+( it.name )+'" id="'+( it.name )+'" ';if('default_value' in it.options){out+='value="'+( it.options.default_value )+'"';}out+=' /> </div> ';return out;
};
field_templates['slider-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+':</label> <input class="'+( it.options.template )+'-field" type="range" name="'+( it.name )+'" id="'+( it.name )+'" step="'+( it.options.step )+'" ';if('default_value' in it.options){out+='value="'+( it.options.default_value )+'"';}out+=' min="'+( it.options.min )+'" max="'+( it.options.max )+'" /> </div> ';return out;
};
field_templates['radio-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <fieldset data-role="controlgroup" id="'+( it.name )+'"> <legend>'+( it.title )+'</legend> ';var arr1=it.options.choices;if(arr1){var idx=-1,l1=arr1.length-1;while(idx<l1){choice=arr1[idx+=1];out+=' <input class="'+( it.options.template )+'-field" type="radio" name="'+( it.name )+'_'+( idx )+'" id="'+( it.name )+'_'+( idx )+'" value="'+( idx )+'" /> <label for="'+( it.name )+'_'+( idx )+'">'+( choice )+'</label> ';} } out+=' </fieldset> </div> ';return out;
};
field_templates['imagemap-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <fieldset data-role="controlgroup" id="'+( it.name )+'"> <legend>'+( it.title )+'</legend> <ul data-role="listview"> ';var arr1=it.options.choices;if(arr1){var idx=-1,l1=arr1.length-1;while(idx<l1){item=arr1[idx+=1];out+=' <li class="'+( it.options.template )+'-field"> <a href="#"> <img src="'+( item.image )+'" /> <h3>'+( item.title )+'</h3> <p>'+( item.title )+'</p> </a> </li> ';} } out+=' </ul> </fieldset> </div> ';return out;
};
field_templates['imagelist-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <fieldset data-role="controlgroup" id="'+( it.name )+'"> <legend>'+( it.title )+'</legend> <ul data-role="listview"> ';var arr1=it.options.choices;if(arr1){var idx=-1,l1=arr1.length-1;while(idx<l1){item=arr1[idx+=1];out+=' <li class="'+( it.options.template )+'-field"> <a href="#"> <img class="thumbnail" id="thumbnail-'+( idx )+'" src="http://cdn.p-rimes.net/blank.gif" /> <h3>'+( item.title )+'</h3> <p>'+( item.title )+'</p> </a> </li> ';} } out+=' </ul> </fieldset> </div> ';return out;
};
field_templates['toggle-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+'</label> <select class="'+( it.options.template )+'-field" data-role="slider" name="'+( it.name )+'" id="'+( it.name )+'" > <option value="0">Off</option> <option value="1">On</option> </select> </div> ';return out;
};
field_templates['color-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+'</label> <input class="'+( it.options.template )+'-field" type="text" name="'+( it.name )+'" id="'+( it.name )+'" ';if('default_value' in it.options){out+='value="'+( it.options.default_value )+'"';}else{out+=' value="#000000" ';}out+=' /> <div class="colorpicker"></div> </div> ';return out;
};
group_templates['list-group-template'] = function(it) {
var out=' <ul data-role="listview" class="'+( it.options.template )+'-group" > <li> <h1>'+( it.title )+'</h1> '+( it.content )+' </li> </ul> ';return out;
};
group_templates['page-group-template'] = function(it) {
var out=' <div data-role="page" id="'+( it.name )+'" class="'+( it.options.template )+'-group" > <div data-role="header"> <h1>'+( it.title )+'</h1> </div> <div data-role="content"> '+( it.content )+' </div> <div data-role="footer"> </div> </div> ';return out;
};
group_templates['collapsible-group-template'] = function(it) {
var out=' <div data-role="collapsible" class="'+( it.options.template )+'-group" > <h3>'+( it.title )+'</h3> '+( it.content )+' </div> ';return out;
};
/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

function get_value_from_field(el, template, target_id)
{
  var value = undefined;
  switch (template)
  {
    case 'color':
      value = parseInt(el.val().replace('#', '0x'));
      break;

    case 'radio':
      var value = -1;
      jQuery('input[type="radio"]', el).each(function(idx, radio) {
        var checked = (el.attr('id') === target_id);
        el
          .attr('checked', checked)
          .checkboxradio('refresh');
        if (checked)
          value = idx;
      });
      value = value;
      break;

    case 'toggle':
      value = ( jQuery('select', el)[0].selectedIndex > 0 );
      break;

    case 'text':
    case 'slider':
      value = el.val();
      break;

    case 'imagemap':
      value = el.index();
      break;

    case 'imagelist':
      value = el.index();
      break;

    default:
      value = el.value;
      break;
  }

  return value;
}

function set_field_from_value(el, template, value)
{
  switch (template)
  {
    case 'color':
      var color = '#'+value.toString(16);
      jQuery.farbtastic(el.next('.colorpicker')).setColor(color);
      break;

    case 'toggle':
      el[0].selectedIndex = value? 1:0;
      el.slider("refresh");
      break;

    case 'radio':
      var radios = jQuery('input[type="radio"]', el);
      jQuery.each(radios, function(idx, radio) { 
        var selected = (radio.id().lastIndexOf('_'+value) != -1);
          radio.attr('checked', selected);
      });
      radios.checkboxradio('refresh');
      break;

    case 'slider':
      el.val(value).slider("refresh");
      break;

    case 'text':
      el.val(value);
      break;

    case 'imagemap':
      console.log("Received broadcast for unknown field type: imagemap");
      break;

    case 'imagelist':
      console.log("Received broadcast for unknown field type: imagelist");
      break;

    default:
      el.value = value;
      break;
  }
}

function get_appropriate_ws_url(port)
{

  if (typeof override_ws_url === "string")
    return override_ws_url;

	var pcol;
	var u = document.URL;

	// We open the websocket encrypted if this page came on an
	// https:// url itself, otherwise unencrypted

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

/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

var setupFormHooks = function() {
  var form = jQuery('#form')
    , templateFromClassRegex = /\s*([^\s]+)-field/
    , ui = new protobuf.ui
  // recursively render templates for each protobuf nested message or field
    , render_form = function(obj, root)
  {
    // use dot notation to denote global position in recursion so far
    if (root === '.')
      root = '';

    // list of strings of rendered templates for fields at this depth
    var rendered_fields = [];
    for (var field_name in obj.properties_)
    {
      // get protobuf field type
      var type = obj.properties_[field_name].type();
      switch (type)
      {
        // assume container template
        default:
          var options = obj.properties_[field_name].options || {}
            , template_name = options.template+'-group-template';

          // recurse if container template found
          if (template_name in group_templates)
          {
            var group = {
              'title': field_name,
              'name': root+field_name,
              'options': options,
              'content': render_form(type, root+field_name+'.')
            }
            , rendered_group = group_templates[template_name](group);

            // append to list of fields at this depth
            rendered_fields.push(rendered_group);
          }
          break;

        // unsupported fields
        case PROTO.bytes:
        case PROTO.array:
          break;

        // supported fields
        case PROTO.uint32:
        case PROTO.sfixed32:
        case PROTO.fixed32:
        case PROTO.int32:
        case PROTO.sint32:
        case PROTO.uint32:
        case PROTO.uint64:
        case PROTO.sfixed64:
        case PROTO.fixed64:
        case PROTO.int64:
        case PROTO.sint64:
        case PROTO.uint64:
        case PROTO.Float:
        case PROTO.Double:
        case PROTO.bool:
        case PROTO.string:
          var options = obj.properties_[field_name].options || {}
            , field = {
              'title': field_name,
              'name': root+field_name,
              'options': options
            }
            , template_name = options.template+'-field-template';

          // render template if found
          if (template_name in field_templates)
          {
            var rendered_field = field_templates[template_name](field);
            // append to list of fields at this depth
            rendered_fields.push(rendered_field);
          }
        break;
      }
    }

    // concatenate rendered templates at this depth
    return rendered_fields.join("");
  }

  var rendered_form = render_form(ui, '');
  jQuery(rendered_form).appendTo(form);

  var sendChangeAsProtobuf = function(evt) {
    if (!live || !ws)
      return;

    var ui = new protobuf.ui
      , serialized = useBinary? new PROTO.ByteArrayStream : new PROTO.Base64Stream
      , target_el = jQuery(evt.target)
      , fieldcontain = target_el.closest("div[data-role='fieldcontain']")
      , input_el = jQuery('input', fieldcontain)
      , changed_el = (
          input_el.length && input_el ||
          target_el.closest('li.imagemap-field,li.imagelist-field'))
      , path_to_field = (
          changed_el.attr('name') && changed_el.attr('name').split('.') ||
          fieldcontain && jQuery('fieldset', fieldcontain)[0].id.split('.'))
      , template_class_search_results = templateFromClassRegex.exec(changed_el.attr('class'));

    //TODO: handle radio buttons
    if (template_class_search_results.length > 1)
    {
      var template = template_class_search_results[1]
        , node = ui
        , n=path_to_field.length;

      // protobuf nested messages walk
      for (var i=0; i<(n-1); i++)
      {
        node = node[path_to_field[i]];
      }
      // have field
      node[path_to_field[n-1]] = get_value_from_field(changed_el, template, evt.target.id);

      ui.SerializeToStream(serialized);
      if (useBinary)
      {
        var bytes = new Uint8Array(serialized.getArray());
        ws.send(bytes.buffer);
      }
      else
        ws.send(serialized.getString());
    }
  };

  // Map change events to send protobuf message
  jQuery("div[data-role='fieldcontain']", form)
    .on('change', sendChangeAsProtobuf);

  // also map list element clicks
  jQuery("div[data-role='fieldcontain'] li", form)
      .on('click', sendChangeAsProtobuf);

  // replace color field inner divs with farbtastic color picker
  jQuery('.colorpicker').each(function() {
    jQuery(this).farbtastic({
      callback: jQuery(this).prev('input'),
      width: 200
    });
  });
};

jQuery(document).on("mobileinit", setupFormHooks);
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

  var reconnect_dialog_el = jQuery("#reconnect-dialog");
  var reconnect_button_el = jQuery("#reconnect-button");

  var disconnect = function() {
    shouldReconnect = false;
    try {
      if (ws.readyState !== ws.CLOSING && ws.readyState !== ws.CLOSED)
      {
        ws.close(0);
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };

  var newWebSocket = function(ws_url, protocol) {
    if ('MozWebSocket' in window)
      return new MozWebSocket(ws_url, protocol);

    else if ('WebSocket' in window)
      return new WebSocket(ws_url, protocol);

    else
      return null;
  }
  var connect = function() {
    var ws_url = get_appropriate_ws_url();
    try {
      ws = newWebSocket(ws_url, "pb-base64");
      if (ws)
      {
        useBinary = (typeof (ws.binaryType) !== 'undefined' && ws.binaryType);
        if (useBinary)
        {
          ws.close();
          ws = newWebSocket(ws_url, "pb-binary");
          ws.binaryType = 'arraybuffer';
        }
      }
      else
        return;

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

        shouldReconnect = true;
        if (reconnect_dialog_el.is(':visible'))
          reconnect_dialog_el.dialog('close');
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

        if (shouldReconnect)
        {
          shouldReconnect = false;
          jQuery.mobile.changePage(reconnect_dialog_el, {
            transition: 'pop',
            role: 'dialog',
            reverse: false
          });
        }
      }
    } catch(exception) {
      console.log('Error' + exception);  
    }
  };

  connect();
  ws_url_el.click(connect);
  reconnect_button_el.click(connect);
};

jQuery(document).on("mobileinit", setupWebUI);
