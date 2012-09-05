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
would like to use a different path for your configuration file, edit the path in
the file *project/settings.py*.)


### Dataset

Enter your username and dataset, along with your API key, into the
config.yml file.

**NOTE: You don't want to check this information in to your
repository, as anyone will be able to write to your data using your
API key.**

### The Map

The map options are for initial map setup and match the [Leaflet Map
options](http://leaflet.cloudmade.com/reference.html#map-options).


Option       |Type      |Default   |Description
-------------|----------|----------|-----------
`center`     |Array     |None      |An array for the initial center. ie. `[lat, lng]` or `[39.952, -75.163]`
`zoom`       |Integer   |None      |The initial zoom level.
`minZoom`    |Integer   |None      |The minimum zoom level supported.
`maxZoom`    |Integer   |None      |The maximum zoom level supported.
`maxBounds`  |Array     |None      |Restricts the map area to this bounding box, an array of arrays defining the southwest corner and the northeast corner. ie. `[ [swLat, swLng], [neLat, neLng] ]` or `[ [39.786, -75.463], [40.118, -74.864] ]`

### Base Layer Options

This configures a single
[TileLayer](http://leaflet.cloudmade.com/reference.html#tilelayer) as the base
layer for the map. This section is completely optional and defaults to MapBox
Streets tiles based on OpenStreetMap. Common options are listed below, and all
options are defined
[here](http://leaflet.cloudmade.com/reference.html#tilelayer).

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`url`          |String    |None      |The URL template to the tile server. eg. `http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png`. See [this](http://leaflet.cloudmade.com/reference.html#url-template) description for details.
`attribution`  |String    |None      |The string used to describes the layer data.

### Extra Layer Options

You can add additional overlays on top of your base layer. This logic
is very basic at this time so please note that only
[TileLayers](http://leaflet.cloudmade.com/reference.html#tilelayer)
are supported, and there is no way to toggle the visibility.

Common options are listed below, and all options are defined [here](http://leaflet.cloudmade.com/reference.html#tilelayer).

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`url`          |String    |None      |The URL template to the tile server. eg. `http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png`. See [this](http://leaflet.cloudmade.com/reference.html#url-template) description for details.
`attribution`  |String    |None      |The string used to describes the layer data.


### Input forms

TODO

### Interface Text

TODO

