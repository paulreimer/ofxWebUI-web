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

