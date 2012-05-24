/*
 * Copyright Paul Reimer, 2012
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
 * To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/
 * or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

jQuery(document).bind("mobileinit", function() {
  var form = jQuery('#form')
    , templateFromClassRegex = /\s*([^\s]+)-field/
    , ui = new protobuf.ui
    , render_form = function(obj, root)
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

