function get_value_from_field(el, template, target_id)
{
  var value = undefined;
  switch (template)
  {
    case 'color':
      value = parseInt(jQuery('input', el).val().replace('#', '0x'));
      break;

    case 'radio':
      var value = -1;
      jQuery('input[type="radio"]', el).each(function(idx, radio) {
        var checked = (jQuery(el).attr('id') === target_id);
        jQuery(el)
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

    case 'string':
    case 'slider':
      value = jQuery('input', el).val();
      break;

    case 'imagelist':
      value = jQuery(el).index();
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

    case 'string':
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

