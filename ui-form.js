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
