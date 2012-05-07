jQuery(document).bind("mobileinit", function() {
  var form = jQuery('#form');
  var ui = new protobuf.ui;
  for (var field in ui.properties_)
  {
    var options = ui.properties_[field].options;
    var input = [];
    switch (options.widget)
    {
      case 'string':
        input.push(
          '<div data-role="fieldcontain">',
            '<label for="', field, '">', field, ':</label>',
            '<input type="text" ',
              'name="', field, '" ',
              'id="', field, '" ',
              'value="" />',
          '</div>'
        );
        break;

      case 'slider':
        var step = options['step'] || "1";
        input.push(
          '<div data-role="fieldcontain">',
            '<label for="', field, '">', field, ':</label>',
            '<input type="range" ',
              'name="', field, '" ',
              'id="', field, '" ',
              'step="', step, '" ',
              'value="0" ',
              'min="', options['min'], '" ',
              'max="', options['max'], '"  />',
          '</div>'
        );
        break;

      case 'radio':
        input.push(
          '<div data-role="fieldcontain">',
            '<fieldset data-role="controlgroup" id="', field, '">',
              '<legend>', field, '</legend>'
        );
        for (var idx in options.choices)
        {
          var choice = options.choices[idx];
          var name = [field, idx].join('_');
          input.push(
            '<input type="radio"',
              'name="', name, '" id="', name, '" value="', idx, '" />',
            '<label for="', name, '">', choice, '</label>'
          );
        }

        input.push(
            '</fieldset>',
          '</div>'
        );
        break;

      case 'image-list':
        input.push(
          '<div data-role="fieldcontain">',
            '<fieldset data-role="controlgroup" id="', field, '">',
              '<legend>', field, '</legend>',
              '<ul data-role="listview">'
        );
        for (var idx in options.choices)
        {
          var item = options.choices[idx];
          var name = [field, idx].join('_');
          input.push(
            '<li><a href="#">',
              '<img src="', item.image, '" />',
              '<h3>', item.title, '</h3>',
              '<p>', item.title, '</p>',
            '</a></li>'
          );
        }

        input.push(
            '</ul>',
            '</fieldset>',
          '</div>'
        );
        break;

      case 'toggle':
        input.push(
          '<div data-role="fieldcontain">',
            '<label for="', field, '">', field, '</label>',
            '<select data-role="slider" ',
              'name="', field, '" ',
              'id="', field, '">',
              '<option value="0">Off</option>',
              '<option value="1">On</option>',
            '</select>',
          '</div>'
        );
        break;

      case 'color':
        input.push(
          '<div data-role="fieldcontain">',
            '<label for="', field, '">', field, '</label>',
            '<input type="text" ',
              'name="', field, '" ',
              'id="', field, '"',
              ' value="#000000" />',
            '<div class="colorpicker"></div>',
          '</div>'
        );
        break;
    }
    if (input.length)
    {
      var el = jQuery(input.join(''));
      jQuery(el).change({
        'field': field,
        'widget': options.widget
      }, function(evt) {
        if (!live || !ws)
          return;

        var ui = new protobuf.ui;
        var serialized = (ws.binaryType==='arraybuffer')?
          new PROTO.ByteArrayStream :
          new PROTO.Base64Stream;
        var value = null;

        switch (evt.data['widget'])
        {
          case 'color':
            value = parseInt(jQuery('input', this).val().replace('#', '0x'));
            break;

          case 'radio':
            jQuery('input[type="radio"]', this).each(function(idx, radio) {
              var checked = (jQuery(this).attr('id') === evt.target.id);
              jQuery(this)
                .attr('checked', checked)
                .checkboxradio('refresh');
              if (checked)
                value = idx;
            })
            break;

          case 'toggle':
            value = ( jQuery('select', this)[0].selectedIndex > 0 );
            break;

          case 'string':
          case 'slider':
            value = jQuery('input', this).val();
            break;

          default:
            value = this.value;
            break;
        }

        ui[evt.data['field']] = value;
        ui.SerializeToStream(serialized);

        ws.send(serialized.getString());
      });

      jQuery('li', el).click({
        'field': field,
        'widget': options.widget
      }, function(evt) {
        if (!live || !ws)
          return;

        var ui = new protobuf.ui;
        var serialized = (ws.binaryType==='arraybuffer')?
          new PROTO.ByteArrayStream :
          new PROTO.Base64Stream;
        var value = null;

        switch (evt.data['widget'])
        {
          case 'image-list':
            value = jQuery(this).index();
            break;
        }

        ui[evt.data['field']] = value;
        ui.SerializeToStream(serialized);

        ws.send(serialized.getString());
      });
      form.append(el);
    }
  }

  jQuery('.colorpicker').each(function() {
    jQuery(this).farbtastic({
      callback: jQuery(this).prev('input'),
      width: 200
    });
  });
});
