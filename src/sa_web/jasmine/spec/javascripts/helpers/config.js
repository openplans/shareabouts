var Shareabouts = Shareabouts || {};

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
