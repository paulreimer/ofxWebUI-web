jQuery(document).bind("mobileinit", function() {
  var form = jQuery('#form')
    , ui = new protobuf.ui
    , macros = {}
    , field_template_els = jQuery('script.field-template')
    , field_templates = {};

  jQuery.map(field_template_els, function(el, i) {
    field_templates[el.id] = doT.template(el.text, undefined, macros);
  });

  for (var field_name in ui.properties_)
  {
    var options = ui.properties_[field_name].options || {}
      , field = {
        'name': field_name,
        'options' : options
      }
      , template_name = field.options.template+'-field-template';

    if (template_name in field_templates)
    {
      var rendered = field_templates[template_name](field)
        , el = jQuery(rendered)
        , sendChangeAsProtobuf = function(evt) {
          if (!live || !ws)
            return;

          var ui = new protobuf.ui
            , serialized = (ws.binaryType==='arraybuffer')?
              new PROTO.ByteArrayStream :
              new PROTO.Base64Stream
            , template = evt.data['options']['template'];

          ui[evt.data['name']] = get_value_from_field(this, template, evt.target.id);
          ui.SerializeToStream(serialized);

          ws.send(serialized.getString());
        };

      jQuery(el).change(field, sendChangeAsProtobuf);
      jQuery('li', el).click(field, sendChangeAsProtobuf);

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

