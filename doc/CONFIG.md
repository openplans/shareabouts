Setting up a Shareabouts Web instance
=====================================

Step 0: Create a Dataset
------------------------

You'll need an account on a Shareabouts API server.

Log in to the API manager and create a new dataset. Remember the slug
for your dataset, as you'll use it later. You will also need the API
key for this dataset, which you can get from the "API Keys" tab of the
manage UI.


Step 1: Configuration
---------------------

Copy the *project/config.yml.template* file to *project/config.yml*. (If you
would like to use a different path for your configuration file, edit
the SHAREABOUTS_CONFIG path in the file *project/settings_local.py*.)


### Dataset

Enter your username and dataset, along with your API key, into the
config.yml file.

**NOTE: You don't want to check this information in to your
repository, as anyone would be able to write to your data using your
API key.**

### The Map

The map options are for initial map setup and match the [Leaflet Map
options](http://leaflet.cloudmade.com/reference.html#map-options).


Option       |Type      |Default   |Description
-------------|----------|----------|-----------
`center`     |Object    |None      |Latitude and longitude for the
initial center. eg. "lat: 39.9523524" and "lng: -75.1636075"
`zoom`       |Integer   |None      |The initial zoom level.
`minZoom`    |Integer   |None      |The minimum zoom level supported.
`maxZoom`    |Integer   |None      |The maximum zoom level supported.
`maxBounds`  |Array     |None      |Restricts the map area to this bounding box, an array of arrays defining the southwest corner and the northeast corner. ie. `[ [swLat, swLng], [neLat, neLng] ]` or `[ [39.786, -75.463], [40.118, -74.864] ]`

### Base Layer Options

The base_layer value configures a single
[TileLayer](http://leaflet.cloudmade.com/reference.html#tilelayer) as the base
layer for the map. This section is completely optional and defaults to MapBox
Streets tiles based on OpenStreetMap. Common options are listed below, and all
options are defined
[here](http://leaflet.cloudmade.com/reference.html#tilelayer).

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`url`          |String    |None      |The URL template to the tile server. eg. `http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png`. See [this](http://leaflet.cloudmade.com/reference.html#url-template) description for details.
`attribution`  |String    |None      |The string used to describe the layer data.

### Extra Layer Options

You can add additional overlays on top of your base layer. To do so,
add to the "layers" array.  This logic
is very basic at this time so please note that only
[TileLayers](http://leaflet.cloudmade.com/reference.html#tilelayer)
are supported, and there is no way to toggle the visibility.

Common options are listed below, and all options are defined [here](http://leaflet.cloudmade.com/reference.html#tilelayer).

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`url`          |String    |None      |The URL template to the tile server. eg. `http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png`. See [this](http://leaflet.cloudmade.com/reference.html#url-template) description for details.
`attribution`  |String    |None      |The string used to describe the layer data.


### Place Types

Shareabouts can handle multiple types of Place. To set up the types
you're interested in, edit config.yml and add an item to the
place_types mapping, like so:

  place_types:
    Landmark:
      default: blue
      focused: red

The name of this type is "Landmark", and we've identified by name two
icon configurations to use when this place type is selected or not.
These icons are configured in the separate place_type_icons section,
like so:

  place_type_icons:
    blue:
      iconUrl: /static/sa/css/images/feature-point.png
      iconSize:
        width: 17
        height: 18
      iconAnchor:
        x: 9
        y: 9
      popupAnchor:
        x: 9
        y: 9


The *iconUrl* is relative to the root of the website. Put the corresponding
image file in src/sa_web/static/sa/css/images/.
The iconSize you specify in config.yml should match that of the image.

*iconAnchor* is measured in pixels, and specifies where relative to the
map point the center of the icon is placed; useful for eg. place
markers that look best sticking up from the point rather than centered
on it.

*popupAnchor*, also in pixels, specifies where to place the tip of the
popup that appears when you click a point.


### Input forms

Once a Place has been created, users can click on it and see a form to
add more information. There are two parts to this:: a simple Support
section, and a section with one or more inputs to add more info.  Both
parts are configurable.

#### Support Form Configuration

TODO

#### Survey Form Configuration

TODO

### Interface Text

TODO


### Pages

Shareabouts allows you to create multiple static pages, linked from
the top navigation bar. To create a page:

* First add a title, slug, and url to the "pages" array in config.yml.
  For example:

    - title: Features
      slug: features
      url: /static/sa/pages/features.html

* Create the page content (as HTML) in the file pointed to by the url.
  For the given example, you would edit the content in
  static/sa/pages/features.html.

### Styling

See [Customizing the Theme](CUSTOM_THEME.md)
