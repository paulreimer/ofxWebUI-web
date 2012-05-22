field_templates['text-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+':</label> <input class="'+( it.options.template )+'-field" type="'+( it.options.type )+'" name="'+( it.name )+'" id="'+( it.name )+'" ';if('default_value' in it.options){out+='value="'+( it.options.default_value )+'"';}out+=' /> </div> ';return out;
};
field_templates['slider-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <label for="'+( it.name )+'">'+( it.title )+':</label> <input class="'+( it.options.template )+'-field" type="range" name="'+( it.name )+'" id="'+( it.name )+'" step="'+( it.options.step )+'" ';if('default_value' in it.options){out+='value="'+( it.options.default_value )+'"';}out+=' min="'+( it.options.min )+'" max="'+( it.options.max )+'" /> </div> ';return out;
};
field_templates['radio-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <fieldset data-role="controlgroup" id="'+( it.name )+'"> <legend>'+( it.title )+'</legend> ';var arr1=it.options.choices;if(arr1){var idx=-1,l1=arr1.length-1;while(idx<l1){choice=arr1[idx+=1];out+=' <input class="'+( it.options.template )+'-field" type="radio" name="'+( it.name )+'_'+( idx )+'" id="'+( it.name )+'_'+( idx )+'" value="'+( idx )+'" /> <label for="'+( it.name )+'_'+( idx )+'">'+( choice )+'</label> ';} } out+=' </fieldset> </div> ';return out;
};
field_templates['imagelist-field-template'] = function(it) {
var out=' <div data-role="fieldcontain"> <fieldset data-role="controlgroup" id="'+( it.name )+'"> <legend>'+( it.title )+'</legend> <ul data-role="listview"> ';var arr1=it.options.choices;if(arr1){var idx=-1,l1=arr1.length-1;while(idx<l1){item=arr1[idx+=1];out+=' <li class="'+( it.options.template )+'-field"> <a href="#"> <img src="'+( item.image )+'" /> <h3>'+( item.title )+'</h3> <p>'+( item.title )+'</p> </a> </li> ';} } out+=' </ul> </fieldset> </div> ';return out;
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

    case 'imagelist':
      value = el.index();
      break;

    default:
      value = el.value;
      break;
  }

  return value;
}

function set_field_from_value(el, field_name, value, template)
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
      radios.attr('checked', false);

      var name = [field_name, value].join('_');
      jQuery('input[type="radio"]#'+name).attr('checked', true);

      radios.checkboxradio('refresh');
      break;

    case 'slider':
      el.val(value).slider("refresh");
      break;

    case 'text':
      el.val(value);
      break;

    case 'imagelist':
      console.log("implement me");
      break;

    default:
      el.value = value;
      break;
  }
}

function get_appropriate_ws_url(port)
{
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

jQuery(document).bind("mobileinit", function() {
  var form = jQuery('#form')
/*
    , field_template_els = jQuery('script.field-template')
    , field_templates = {}
    , group_template_els = jQuery('script.group-template')
    , group_templates = {}
    , macros = {}
    , templateSettings = doT.templateSettings
    , templateFromClassRegex = /\s*([^\s]+)-field/;

  jQuery.map(field_template_els, function(el, i) {
    field_templates[el.id] = doT.template(el.text, templateSettings, macros);
  });

  jQuery.map(group_template_els, function(el, i) {
    group_templates[el.id] = doT.template(el.text, templateSettings, macros);
  });
*/

  var ui = new protobuf.ui;
  var render_form = function(obj, root)
  {
    if (root === '.')
      root = '';

    var rendered_fields = [];
    for (var field_name in obj.properties_)
    {
      var type = obj.properties_[field_name].type();
      switch (type)
      {
        default:
          var options = obj.properties_[field_name].options || {}
            , template_name = options.template+'-group-template';

          if (template_name in group_templates)
          {
            var group = {
              'title': field_name,
              'name': root+field_name,
              'options': options,
              'content': render_form(type, root+field_name+'.')
            }
            , rendered_group = group_templates[template_name](group);

            rendered_fields.push(rendered_group);
          }
          break;

        case PROTO.string:
        //case PROTO.bytes:
        //case PROTO.array:
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

          if (template_name in field_templates)
          {
            var rendered_field = field_templates[template_name](field);
            rendered_fields.push(rendered_field);
          }
        break;
      }
    }
    return rendered_fields.join("");
  }

  var rendered_form = render_form(ui, '');
  jQuery(rendered_form).appendTo(form);//.trigger('create');

  var sendChangeAsProtobuf = function(evt) {
    if (!live || !ws)
      return;

    var ui = new protobuf.ui
      , serialized = (ws.binaryType==='arraybuffer')?
        new PROTO.ByteArrayStream :
        new PROTO.Base64Stream
      , target = jQuery(evt.target)
      , fieldcontain = target.closest("div[data-role='fieldcontain']")
      , input = jQuery('input', fieldcontain)
      , changed = (input.length && input ||
        target.closest('li.imagelist-field')
        )
      , path_to_field = (
          changed.attr('name') && changed.attr('name').split('.') ||
          fieldcontain && jQuery('fieldset', fieldcontain)[0].id.split('.'))
      , template_classes = templateFromClassRegex.exec(changed.attr('class'));

    //TODO: handle radio buttons
    if (template_classes.length > 1)
    {
      var template = template_classes[1]
        , node = ui
        , n=path_to_field.length;

      for (var i=0; i<(n-1); i++)
      {
        node = node[path_to_field[i]];
      }
      node[path_to_field[n-1]] = get_value_from_field(changed, template, evt.target.id);

      ui.SerializeToStream(serialized);
      ws.send(serialized.getString());
    }
  };

  jQuery("div[data-role='fieldcontain']", form)
    .on('change', sendChangeAsProtobuf);

  jQuery("div[data-role='fieldcontain'] li", form)
      .on('click', sendChangeAsProtobuf);

  jQuery('.colorpicker').each(function() {
    jQuery(this).farbtastic({
      callback: jQuery(this).prev('input'),
      width: 200
    });
  });
});

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

