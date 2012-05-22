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
