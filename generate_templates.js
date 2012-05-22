var fs          = require('fs')
  , jQuery      = require('jquery')
  , doT         = require('dot')
  , util        = require('util')
  , inputFile   = 'index.html.templates'
  , outputFile  = 'web/ui-templates.js'

fs.readFile(inputFile, function (err, data) {
  if (err) throw err;

  jQuery(data.toString()).appendTo("body");

  var templateSettings = doT.templateSettings
    , macros = {}
    , field_template_els = jQuery('script.field-template')
    , field_templates = {}
    , group_template_els = jQuery('script.group-template')
    , group_templates = {}
    , templateFromClassRegex = /\s*([^\s]+)-field/;

//  templateSettings.strip = false;

  jQuery.map(field_template_els, function(el, i) {
    var func = doT.template(el.text, templateSettings, macros).toString();
    func = func.replace('function anonymous(it)', 'function(it)');
    field_templates[el.id] = func;
  });

  jQuery.map(group_template_els, function(el, i) {
    var func = doT.template(el.text, templateSettings, macros).toString();
    func = func.replace('function anonymous(it)', 'function(it)');

    group_templates[el.id] = func;
  });

  var compiledTemplatesContent = '';

  for (var prop in field_templates)
  {
    compiledTemplatesContent += "field_templates['"+prop+"'] = ";
    compiledTemplatesContent += field_templates[prop] + ';\n';
  }

  for (var prop in group_templates)
  {
    compiledTemplatesContent += "group_templates['"+prop+"'] = ";
    compiledTemplatesContent += group_templates[prop] + ';\n';
  }

  fs.writeFile(outputFile, compiledTemplatesContent, function (err) {
    if (err) throw err;

    console.log('Templates generated in '+outputFile);
  });
});

