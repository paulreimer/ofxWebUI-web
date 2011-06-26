$(document).bind("mobileinit", function(){
  var form = $('#form');
  var ui = new protobuf.ui;
  for (var field in ui.properties_)
  {
    var options = ui.properties_[field].options;
    var input = [];
    switch (options.widget)
    {
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
    }
    if (input.length)
    {
      var el = $(input.join(''));
      $(el).change({
        'field': field,
        'widget': options.widget
      }, function(evt) {
        if (!live || !ws)
          return;

        var ui = new protobuf.ui;
        var serialized = ws.binaryType? new PROTO.ByteArrayStream
          : new PROTO.Base64Stream;
        var value = null;

        switch (evt.data['widget'])
        {
          case 'slider':
            value = $('input', this).val();
            break;
          case 'radio':
            $('input[type="radio"]', this).each(function(idx, radio) {
              var checked = ($(this).attr('id') === evt.target.id);
              $(this)
                .attr('checked', checked)
                .checkboxradio('refresh');
              if (checked)
                value = idx;
            })
            break;

          case 'toggle':
            value = ( $('select', this)[0].selectedIndex > 0 );
            break;
        }

        ui[evt.data['field']] = value;
        ui.SerializeToStream(serialized);

        ws.send(serialized.getString());
      });
      form.append(el);
    }
  }
});
