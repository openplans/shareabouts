var Shareabouts = Shareabouts || {};
Shareabouts.SpecData = Shareabouts.SpecData || {};

Shareabouts.SpecData.AppConfig = {
  "defaultPlaceTypeName": "",
  "userToken": "session:408462e73b5735016a142cba9ba23c7c",
  "flavor": {
    "app": {"meta_description": "Shareabouts is a mapping tool to gather crowd sourced public input. Use it to collect suggested locations and comments in a social, engaging process.", "meta_author": "OpenPlans.org", "name": "Shareabouts", "title": "Shareabouts"},
    "map": {"layers": [{"style": "mapbox://styles/mapbox/streets-v8", "type": "mapbox", "accessToken": "pk.eyJ1Ijoib3BlbnBsYW5zIiwiYSI6ImZRQzRPYnMifQ.f75KI3Q9rFXRY2Zciz6DKw"}, {"url": "/static/data/philadelphia.geojson", "rules": [{"style": {"color": "#444", "opacity": 0.6, "fillOpacity": 0.1, "weight": 1 }, "condition": "true"} ], "type": "json"} ], "geolocation_onload": false, "geocode_bounding_box": [39.830159, -75.478821, 40.167331, -74.781189], "geolocation_enabled": true, "geocode_field_label": "Enter an address...", "geocoding_enabled": true, "options": {"maxZoom": 17, "minZoom": 10, "center": {"lat": 39.9523524, "lng": -75.1636075 }, "zoom": 14 }},
    "pages": [{"start_page": true, "slug": "about", "name": "overview", "title": "About"}, {"pages": [{"url": "/static/pages/why.html", "slug": "why", "title": "Why Shareabouts?"}, {"url": "/static/pages/features.html", "slug": "features", "title": "Features"} ], "title": "More..."}, {"pages": [{"url": "https://github.com/openplans/shareabouts/tree/master/doc", "external": true, "title": "Documentation"}, {"url": "https://github.com/openplans/shareabouts/issues", "external": true, "title": "Issues"}, {"url": "https://github.com/openplans/shareabouts", "external": true, "title": "GitHub"} ], "title": "Links"}, {"slug": "filter-type", "pages": [{"url": "/filter/all", "external": true, "title": "All"}, {"url": "/filter/landmark", "external": true, "title": "Landmark"}, {"url": "/filter/park", "external": true, "title": "Park"}, {"url": "/filter/school", "external": true, "title": "School"} ], "title": "Filter Places"}],
    "notifications": {"submitter_email_field": "private-submitter_email", "on_new_place": true},
    "survey": {"form_link_text": "Leave a Comment", "submission_type": "comments", "title": "Leave a Comment", "show_responses": true, "items": [{"type": "textarea", "prompt": "Comment", "attrs": [{"key": "required"} ], "name": "comment", "label": "Comment"}, {"type": "text", "prompt": "Your Name", "name": "submitter_name", "sticky": true } ], "submit_btn_text": "Comment", "response_name": "comment", "action_text": "commented on", "anonymous_name": "Someone", "response_plural_name": "comments", "single_submission": false},
    "place": {"show_map_button_label": "Show the Map", "submit_button_label": "Submit", "add_button_label": "Add a Place", "items": [{"prompt": "Your Name", "name": "submitter_name", "optional": true, "sticky": true, "attrs": [{"value": "Name", "key": "placeholder"}, {"value": 30, "key": "size"} ], "type": "text"}, {"prompt": "Your Email", "name": "private-submitter_email", "optional": true, "sticky": true, "attrs": [{"value": "Email address", "key": "placeholder"}, {"value": 30, "key": "size"} ], "type": "text"}, {"type": "text", "prompt": "Location Name", "name": "name", "optional": true, "attrs": [{"value": "Location Name", "key": "placeholder"}, {"value": 30, "key": "size"} ] }, {"type": "select", "options": [{"value": "", "label": "Choose One"}, {"value": "landmark", "label": "Landmark"}, {"value": "park", "label": "Park"}, {"value": "school", "label": "School"} ], "prompt": "Location Type", "attrs": [{"key": "required"} ], "name": "location_type"}, {"type": "textarea", "prompt": "Description", "name": "description", "optional": true, "attrs": [{"value": "Description...", "key": "placeholder"} ] }, {"prompt": "Image", "name": "my_image", "optional": true, "attrs": [{"value": "image/*", "key": "accept"} ], "inputfile_label": "Add an Image", "type": "file"} ], "title": "Tell us more...", "adding_supported": true, "action_text": "created", "show_list_button_label": "List All Places", "anonymous_name": "Someone", "location_item_name": "location"},
    "activity": {"interval": 30000, "enabled": true},
    "place_types": {"landmark": {"rules": [{"style": {"color": "#0d85e9", "opacity": 0.9, "radius": 3, "fillOpacity": 1, "weight": 1 }, "condition": "\"{{location_type}}\" === \"landmark\" && {{map.zoom}} < 13 && {{layer.focused}} === false"}, {"condition": "\"{{location_type}}\" === \"landmark\" && {{map.zoom}} >= 13 && {{layer.focused}} === false", "icon": {"iconSize": [17, 18 ], "iconUrl": "/static/css/images/markers/dot-0d85e9.png", "iconAnchor": [9, 9 ] } }, {"condition": "\"{{location_type}}\" === \"landmark\" && {{layer.focused}} === true", "icon": {"iconSize": [25, 41 ], "iconUrl": "/static/css/images/markers/marker-0d85e9.png", "iconAnchor": [12, 41 ], "shadowSize": [41, 41 ], "shadowUrl": "/static/css/images/marker-shadow.png"} } ], "label": "Landmark"}, "school": {"rules": [{"focus_style": {"color": "#f95016", "opacity": 0.9, "radius": 16, "fillOpacity": 0.4, "weight": 4 }, "style": {"color": "#f95016", "opacity": 0.9, "radius": 8, "fillOpacity": 0.4, "weight": 4 }, "condition": "\"{{location_type}}\" === \"school\" && {{submission_sets.comments.length}} > 0"}, {"focus_style": {"color": "#f95016", "opacity": 0.9, "radius": 16, "fillOpacity": 0.4, "weight": 1 }, "style": {"color": "#f95016", "opacity": 0.9, "radius": 8, "fillOpacity": 0.4, "weight": 1 }, "condition": "\"{{location_type}}\" === \"school\""} ], "label": "School"}, "park": {"rules": [{"style": {"color": "#4bbd45", "opacity": 0.9, "fillOpacity": 0.7, "weight": 3 }, "condition": "\"{{location_type}}\" === \"park\" && {{layer.focused}}", "icon": {"iconSize": [25, 41 ], "iconUrl": "/static/css/images/markers/marker-4bbd45.png", "iconAnchor": [12, 41 ], "shadowSize": [41, 41 ], "shadowUrl": "/static/css/images/marker-shadow.png"} }, {"style": {"color": "#4bbd45", "opacity": 0.9, "fillOpacity": 0.4, "weight": 1 }, "condition": "\"{{location_type}}\" === \"park\"", "icon": {"iconSize": [17, 18 ], "iconUrl": "/static/css/images/markers/dot-4bbd45.png", "iconAnchor": [9, 9 ] } } ], "label": "Park"}},
    "support": {"response_plural_name": "supports", "submit_btn_text": "Support", "response_name": "support", "action_text": "supported", "anonymous_name": "Someone", "submission_type": "support"}
  },
  "place": {
    "show_map_button_label": "Show the Map",
    "submit_button_label": "Submit",
    "add_button_label": "Add a Place",
    "items": [{"prompt": "Your Name", "name": "submitter_name", "optional": true, "sticky": true, "attrs": [{"value": "Name", "key": "placeholder"}, {"value": 30, "key": "size"} ], "type": "text", "is_input": true, "is_textarea": false, "is_select": false, "is_file": false, "is_fileinput_supported": true }, {"prompt": "Your Email", "name": "private-submitter_email", "optional": true, "sticky": true, "attrs": [{"value": "Email address", "key": "placeholder"}, {"value": 30, "key": "size"} ], "type": "text", "is_input": true, "is_textarea": false, "is_select": false, "is_file": false, "is_fileinput_supported": true }, {"type": "text", "prompt": "Location Name", "name": "name", "optional": true, "attrs": [{"value": "Location Name", "key": "placeholder"}, {"value": 30, "key": "size"} ], "is_input": true, "is_textarea": false, "is_select": false, "is_file": false, "is_fileinput_supported": true }, {"type": "select", "options": [{"value": "", "label": "Choose One"}, {"value": "landmark", "label": "Landmark"}, {"value": "park", "label": "Park"}, {"value": "school", "label": "School"} ], "prompt": "Location Type", "attrs": [{"key": "required"} ], "name": "location_type", "is_input": false, "is_textarea": false, "is_select": true, "is_file": false, "is_fileinput_supported": true }, {"type": "textarea", "prompt": "Description", "name": "description", "optional": true, "attrs": [{"value": "Description...", "key": "placeholder"} ], "is_input": false, "is_textarea": true, "is_select": false, "is_file": false, "is_fileinput_supported": true }, {"prompt": "Image", "name": "my_image", "optional": true, "attrs": [{"value": "image/*", "key": "accept"} ], "inputfile_label": "Add an Image", "type": "file", "is_input": false, "is_textarea": false, "is_select": false, "is_file": true, "is_fileinput_supported": true }],
    "title": "Tell us more...",
    "adding_supported": true,
    "action_text": "created",
    "show_list_button_label": "List All Places",
    "anonymous_name": "Someone",
    "location_item_name": "location"
  },
  "placeTypes": {
    "landmark": {"rules": [{"style": {"color": "#0d85e9", "opacity": 0.9, "radius": 3, "fillOpacity": 1, "weight": 1 }, "condition": "\"{{location_type}}\" === \"landmark\" && {{map.zoom}} < 13 && {{layer.focused}} === false"}, {"condition": "\"{{location_type}}\" === \"landmark\" && {{map.zoom}} >= 13 && {{layer.focused}} === false", "icon": {"iconSize": [17, 18 ], "iconUrl": "/static/css/images/markers/dot-0d85e9.png", "iconAnchor": [9, 9 ] } }, {"condition": "\"{{location_type}}\" === \"landmark\" && {{layer.focused}} === true", "icon": {"iconSize": [25, 41 ], "iconUrl": "/static/css/images/markers/marker-0d85e9.png", "iconAnchor": [12, 41 ], "shadowSize": [41, 41 ], "shadowUrl": "/static/css/images/marker-shadow.png"} } ], "label": "Landmark"},
    "school": {"rules": [{"focus_style": {"color": "#f95016", "opacity": 0.9, "radius": 16, "fillOpacity": 0.4, "weight": 4 }, "style": {"color": "#f95016", "opacity": 0.9, "radius": 8, "fillOpacity": 0.4, "weight": 4 }, "condition": "\"{{location_type}}\" === \"school\" && {{submission_sets.comments.length}} > 0"}, {"focus_style": {"color": "#f95016", "opacity": 0.9, "radius": 16, "fillOpacity": 0.4, "weight": 1 }, "style": {"color": "#f95016", "opacity": 0.9, "radius": 8, "fillOpacity": 0.4, "weight": 1 }, "condition": "\"{{location_type}}\" === \"school\""} ], "label": "School"},
    "park": {"rules": [{"style": {"color": "#4bbd45", "opacity": 0.9, "fillOpacity": 0.7, "weight": 3 }, "condition": "\"{{location_type}}\" === \"park\" && {{layer.focused}}", "icon": {"iconSize": [25, 41 ], "iconUrl": "/static/css/images/markers/marker-4bbd45.png", "iconAnchor": [12, 41 ], "shadowSize": [41, 41 ], "shadowUrl": "/static/css/images/marker-shadow.png"} }, {"style": {"color": "#4bbd45", "opacity": 0.9, "fillOpacity": 0.4, "weight": 1 }, "condition": "\"{{location_type}}\" === \"park\"", "icon": {"iconSize": [17, 18 ], "iconUrl": "/static/css/images/markers/dot-4bbd45.png", "iconAnchor": [9, 9 ] } } ], "label": "Park"}
  },
  "survey": {
    "form_link_text": "Leave a Comment",
    "submission_type": "comments",
    "title": "Leave a Comment",
    "show_responses": true,
    "items": [{"type": "textarea", "prompt": "Comment", "attrs": [{"key": "required"} ], "name": "comment", "label": "Comment"}, {"type": "text", "prompt": "Your Name", "name": "submitter_name", "sticky": true }],
    "submit_btn_text": "Comment",
    "response_name": "comment",
    "action_text": "commented on",
    "anonymous_name": "Someone",
    "response_plural_name": "comments",
    "single_submission": false
  },
  "support": {
    "response_plural_name": "supports",
    "submit_btn_text": "Support",
    "response_name": "support",
    "action_text": "supported",
    "anonymous_name": "Someone",
    "submission_type": "support"
  },
  "map": {
    "layers": [
      {"url": "https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ"},
      {"url": "/static/data/philadelphia.geojson", "rules": [{"style": {"color": "#444", "opacity": 0.6, "fillOpacity": 0.1, "weight": 1 }, "condition": "true"} ], "type": "json"}
    ],
    "geolocation_onload": false,
    "geocode_bounding_box": [39.830159, -75.478821, 40.167331, -74.781189],
    "geolocation_enabled": true,
    "geocode_field_label": "Enter an address...",
    "geocoding_enabled": true,
    "options": {"maxZoom": 17, "minZoom": 10, "center": {"lat": 39.9523524, "lng": -75.1636075 }, "zoom": 14}
  },
  "activity": {
    "interval": 30000,
    "enabled": true
  },
  "pages": [
    {"start_page": true, "slug": "about", "name": "overview", "title": "About"},
    {"pages": [{"url": "/static/pages/why.html", "slug": "why", "title": "Why Shareabouts?"}, {"url": "/static/pages/features.html", "slug": "features", "title": "Features"} ], "title": "More..."},
    {"pages": [{"url": "https://github.com/openplans/shareabouts/tree/master/doc", "external": true, "title": "Documentation"}, {"url": "https://github.com/openplans/shareabouts/issues", "external": true, "title": "Issues"}, {"url": "https://github.com/openplans/shareabouts", "external": true, "title": "GitHub"} ], "title": "Links"},
    {"slug": "filter-type", "pages": [{"url": "/filter/all", "external": true, "title": "All"}, {"url": "/filter/landmark", "external": true, "title": "Landmark"}, {"url": "/filter/park", "external": true, "title": "Park"}, {"url": "/filter/school", "external": true, "title": "School"} ], "title": "Filter Places"}
  ]
};

Shareabouts.SpecConfig = {
  placeTypesConfig: {
    "Landmark": {"default": "blue", "focused": "red"},
    "School": {"default": "blue", "focused": "red"},
    "Park": {"default": "blue", "focused": "red"}
  },
  placeTypeIconsConfig: {
    "blue": {"iconSize": {"width": 17, "height": 18}, "iconUrl": "/static/css/images/feature-point.png", "iconAnchor": {"y": 9, "x": 9}, "popupAnchor": {"y": 9, "x": 9}},
    "red": {"iconUrl": "/static/css/images/marker-focused.png", "shadowSize": {"width": 41, "height": 41}, "shadowUrl": "/static/css/images/marker-shadow.png", "iconSize": {"width": 25, "height": 41}, "iconAnchor": {"y": 41, "x": 12}, "popupAnchor": {"y": 6, "x": 12}}
  },
  surveyConfig: {
    "response_plural_name": "comments",
    "action_text": "commented on",
    "title": "Leave a Comment",
    "show_responses": true,
    "items": [
      {"prompt": "Comment", "type": "textarea", "name": "comment", "label": "Comment"},
      {"prompt": "Your Name", "type": "text", "name": "submitter_name"}
    ],
    "submit_btn_text": "Comment",
    "response_name": "comment",
    "form_link_text": "Leave a Comment",
    "submission_type": "comments"
  },
  supportConfig: {"submit_btn_text": "Support This!", "action_text": "supported", "submission_type": "support"},
  pagesConfig: [
    {"content": "<h1>About</h1><p>Hello! You're looking at a demo of Shareabouts.", "start_page": true, "slug": "about", "title": "About"},
    {"content": "<h1>What is Shareabouts for?</h1><p>Some ways you can use Shareabouts:</p>", "slug": "features", "title": "Features"}
  ],
  mapConfig: {
    "layers": [
      {"url": "http://{s}.tiles.notrealurl.com//{z}/{x}/{y}.png"}
    ],
    "base_layer": {"url": "http://{s}.tiles.mapbox.com/v3/openplans.map-dmar86ym/{z}/{x}/{y}.png", "attribution": "&copy; OpenStreetMap contributors, CC-BY-SA. <a href=\"http://mapbox.com/about/maps\" target=\"_blank\">Terms &amp; Feedback</a>"},
    "options": {"maxZoom": 17, "minZoom": 10, "center": {"lat": 39.9523524, "lng": -75.1636075}, "zoom": 14}
  },
  placeTypeIcons: {},
  placeTypes: {}
};

// Postprocessing
(function(C){
  // Define each Leaflet Icon type
  _.each(C.placeTypeIconsConfig, function(config, name) {
    C.placeTypeIcons[name] = L.icon({
      iconUrl: config.iconUrl,
      shadowUrl: config.shadowUrl,
      iconSize: L.point(config.iconSize.width, config.iconSize.height),
      iconAnchor: L.point(config.iconAnchor.x, config.iconAnchor.y),
      popupAnchor: L.point(config.popupAnchor.x, config.popupAnchor.y)
    });
  });

  // Init each icon and attach it to its type
  _.each(C.placeTypesConfig, function(config, name) {
    C.placeTypes[name] = {
      'default': C.placeTypeIcons[config['default']],
      'focused': C.placeTypeIcons[config.focused]
    };
  });
})(Shareabouts.SpecConfig);
