/*
   Copyright 2010-2013 Portland Transport

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var transitBoardVertical = {}; // keep state

// constants

transitBoardVertical.APP_NAME 		= "Transit Board Vertical";
transitBoardVertical.APP_VERSION 	= "1.02";
transitBoardVertical.APP_ID 			= "tbdvertical";

// assess environment

transitBoardVertical.is_development = (document.domain == "dev.transitboard.com");
transitBoardVertical.isChumby = navigator.userAgent.match(/QtEmb/) != null;

var orig_query_string = window.location.search;
var app_query_string = orig_query_string.replace(/option\[(top|left|right|bottom)\]=[0-9]*(&|$)/g,"");
var app_url = "/apps/transitBoardByLine/transitBoardByLine.html"+app_query_string;


/**
 * Loosely modeled on jquery.parsequery.js by Michael Manning (http://actingthemaggot.com)
 **/
trArrParseQuery = function(qs) {
	var q = (typeof qs === 'string'?qs:window.location.search);
	var params = {};
	jQuery.each(q.match(/^\??(.*)$/)[1].split('&'),function(i,p){
		//p = unescape(p).replace(/\+/g,' ').replace(/\]/g,'');
		p = p.split('=');
		p[0] = p[0].replace(/\+/g,' ').replace(/\]/g,'');
		var keys = p[0].split('[');
		var value = unescape(p[1]).replace(/\+/g,' ');
		var depth = keys.length;
		if (depth == 1) {
			// actually shouldn't happen, should always have at least two levels
			if (params[keys[0]] == undefined) {
				params[keys[0]] = {};
			}
			params[keys[0]][value] = true;
		}
		if (depth == 2) {
			if (params[keys[0]] == undefined) {
				params[keys[0]] = {};
			}
			if (params[keys[0]][keys[1]] == undefined) {
				params[keys[0]][keys[1]] = {};
			}
			params[keys[0]][keys[1]][value] = true;
		}
		if (depth == 3) {
			if (params[keys[0]] == undefined) {
				params[keys[0]] = {};
			}
			if (params[keys[0]][keys[1]] == undefined) {
				params[keys[0]][keys[1]] = {};
			}
			if (params[keys[0]][keys[1]][keys[2]] == undefined) {
				params[keys[0]][keys[1]][keys[2]] = {};
			}
			params[keys[0]][keys[1]][keys[2]][value] = true;
		}
	});
	return params;
}

function trArrSupportsCors() {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // Supports CORS
    return true;
  } else if (typeof XDomainRequest != "undefined") {
    // IE
    return true;
  }
  return false;
}

var query_params = trArrParseQuery();

// turns options from objects into arrays
var options = {};
for (var option in query_params.option) {
	var opt_array = [];
	for (var value in this.query_params.option[option]) {
		opt_array.push(value);
	}
	options[option] = opt_array;
}

var appliance = {};
for (var appl in query_params.appl) {
	var opt_array = [];
	for (var value in this.query_params.appl[appl]) {
		opt_array.push(value);
	}
	appliance[appl] = opt_array;
}

var second_page = false;
if (options['second_page'] == 1) {
	second_page = true;
}

var num_pages = options['num_pages'] || 1;
if (second_page && num_pages < 2) {
	num_pages = 2;
}
num_pages = num_pages * 1;

var page_delay = options['page_delay'] || 15;
		
	
// initialize screen margins

var body_width 		= options.width || jQuery(window).width();
var body_height 	= options.height || jQuery(window).height();	

var left_border 	= options.left || 0;
var bottom_border = options.bottom || 0;
var top_border 		= options.top || 0;
var right_border 	= options.right || 0;

var split_pct 		= options.splitpct || 100;
var suppl_url 		= options.suppl_url;
var suppl_loc			= options.suppl_loc;

if (suppl_url == "") {
	suppl_url = "http://transitappliance.com/size_info.html";
}

var effective_width = body_width - left_border - right_border;
var effective_height = body_height - bottom_border - top_border;

jQuery("body").css("width",effective_width).css("height",effective_height);
jQuery("body").css("margin","0");

jQuery("body").css('border-left-width',left_border);
jQuery("body").css('border-top-width',top_border);
jQuery("body").css('border-right-width',right_border);
jQuery("body").css('border-bottom-width',bottom_border);
jQuery("body").css('border-color','black');
jQuery("body").css('border-style','solid');
jQuery("body").css('position','relative'); // for reasons I haven't figured out, this has to be set late

var left_width = Math.floor(effective_width * split_pct/100);
var right_width = effective_width - left_width;

var primary_id = appliance['id']+":A";
var app_url = "/apps/loader.html?"+primary_id;
	
// populate html

var html = '<div id="tb_frames" style="position: relative; height: ' + effective_width + 'px; width: ' + effective_height + 'px">';



if (suppl_loc == 'bottom') {
	if (right_width > 1) {
		html += '<iframe id="suppl_frame" src="' + suppl_url + '" scrolling="no" style="clear: left; border: none; margin: 0; height: ' + right_width + 'px; width: ' + effective_height+'px"></iframe>';
	}
	html += '<div style="position: relative; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px">';
	html += '<iframe id="app_frame1" src="'+app_url+'" scrolling="no" style="position: absolute; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px"></iframe>';
	if ( num_pages > 1 && appliance['id'] ) {
		for (var i=2;i<=num_pages;i++) {
			var letter = ("ABCDEFGHIJKLMNOPQRSTUVWXYZ").substr(i-1,1);
			//alert(letter);
			var id = appliance['id'];
			var alt_id = id+":"+letter;
			var app_url2 = "/apps/loader.html?"+alt_id;
			html += '<iframe id="app_frame'+i+'" src="'+app_url2+'" scrolling="no" style="position: absolute; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px"></iframe>';
		}
	}
	html += '</div>';

} else {
	html += '<div style="position: relative; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px">';
	html += '<iframe id="app_frame1" src="'+app_url+'" scrolling="no" style="position: absolute; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px"></iframe>';
	if ( num_pages > 1 && appliance['id'] ) {
		for (var i=2;i<=num_pages;i++) {
			var letter = ("ABCDEFGHIJKLMNOPQRSTUVWXYZ").substr(i-1,1);
			//alert(letter);
			var id = appliance['id'];
			var alt_id = id+":"+letter;
			var app_url2 = "/apps/loader.html?"+alt_id;
			html += '<iframe id="app_frame'+i+'" src="'+app_url2+'" scrolling="no" style="position: absolute; float: left; border:none; margin: 0; height: ' + left_width + 'px; width: ' + effective_height + 'px"></iframe>';
		}
	}
	html += '</div>';
	if (right_width > 1) {
		html += '<iframe id="suppl_frame" src="' + suppl_url + '" scrolling="no" style="clear: left; border: none; margin: 0; height: ' + right_width + 'px; width: ' + effective_height+'px"></iframe>';
	}
}

html += '</div>';
	
jQuery('body').html(html);

var translate_x = (body_height-body_width) + "px";
var translate_y = (body_height) + "px";

jQuery("#tb_frames").css("-webkit-transform-origin", "100% 100%").css("-webkit-transform", "rotate(90deg) translateY("+translate_y+") translateX("+translate_x+")");

var current_frame = 0;
function rotate_frames () {
	current_frame = current_frame + 1;
	if (current_frame > num_pages) {
		current_frame = 1;
	}
	//alert(current_frame+" out of "+num_pages);
	for (var i=1;i<=num_pages;i++) {
		if (i == current_frame) {
			//alert( "show "+i);
			jQuery("#app_frame"+i).show(1000);
		} else {
			//alert("hide "+i);
			jQuery("#app_frame"+i).hide(1000);
		}
	}
	setTimeout(rotate_frames,page_delay*1000);
}

if ( num_pages > 1 && appliance['id'] ) {
	setTimeout(rotate_frames,100000); // 100 second delay to let everything load
}


// set up healthcheck/restart logic

var start_time = ((new Date)).getTime();

transitBoardVertical.access_method = "jsonp";
if (trArrSupportsCors()) {
	transitBoardVertical.access_method = "json";
}

jQuery.ajax({
		dataType: transitBoardVertical.access_method,
		url: "http://ta-web-services.com/cgi-bin/health_update.pl",
		data: { timestamp: start_time, start_time: start_time, version: 'N/A', "id": appliance['id'], application_id: transitBoardVertical.APP_ID, application_name: transitBoardVertical.APP_NAME, application_version: transitBoardVertical.APP_VERSION, "height": jQuery(window).height(), "width": jQuery(window).width() }
});

// logging of startup, beat every 30 min goes here
setInterval(function(){
	jQuery.ajax({
			url: "http://ta-web-services.com/cgi-bin/health_update.pl",
			dataType: transitBoardVertical.access_method,
			cache: false,
			data: { timestamp: ((new Date)).getTime(), start_time: start_time, version: 'N/A', "id": appliance['id'], application_id: transitBoardVertical.APP_ID, application_name: transitBoardVertical.APP_NAME, application_version: transitBoardVertical.APP_VERSION, "height": jQuery(window).height(), "width": jQuery(window).width() },
			success: function(data) {
				if( typeof data != "undefined" && data.reset == true ) {
					reset_app();
				}
			}
	});
}, 30*60*1000);


var reset_app = function() {
	if (appliance['id']) {
		if(typeof trLoader == 'function') {
			trLoader(appliance['id']);
		} else {
			window.location = "http://transitappliance.com/cgi-bin/launch_by_id.pl?id="+appliance['id'];
		}
	} else {
		window.location.reload(true);
	}
}
	


