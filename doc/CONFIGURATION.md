Setting up a Shareabouts Web instance
=====================================

Step 0: Create a Dataset
------------------------
You'll need an account on a Shareabouts API server.

Log in to the API manager and create a new dataset.  Remember the slug for your dataset, as you'll use it later.

When you create a dataset, an API key is created.  Get the API key **by contacting your API administrator** (this has to be changed).


Step 1: Configuration
---------------------

Copy the *project/config.yml.template* file to *project/config.yml*.  (If you would like to use a different path for your configuration file, edit the path in the file *project/settings.py*.)  Enter your username and dataset, along with your API key, into the config file.  **NOTE: You don't want to check this information in to your repository, as anyone will be able to write to your data using your API key.**

### The Map

The map options are for initial map setup and match the [Leaflet Map options](http://leaflet.cloudmade.com/reference.html#map-options).


Option       |Type      |Default   |Description
-------------|----------|----------|-----------
`center`     |Array     |None      |An array for the initial center. ie. `[lat, lng]` or `[39.952, -75.163]`
`zoom`       |Integer   |None      |The initial zoom level.
`minZoom`    |Integer   |None      |The minimum zoom level supported.
`maxZoom`    |Integer   |None      |The maximum zoom level supported.
`maxBounds`  |Array     |None      |Restricts the map area to this bounding box, an array of arrays defining the southwest corner and the northeast corner. ie. `[ [swLat, swLng], [neLat, neLng] ]` or `[ [39.786, -75.463], [40.118, -74.864] ]`

### Base Layer Options

This configures a single [TileLayer](http://leaflet.cloudmade.com/reference.html#tilelayer) as the base layer for the map. This section is completely optional and defaults to MapBox Streets tiles based on OpenStreetMap. Common options are listed below, and all options are defined [here](http://leaflet.cloudmade.com/reference.html#tilelayer).

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`url`          |String    |None      |The URL template to the tile server. eg. `http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png`. See [this](http://leaflet.cloudmade.com/reference.html#url-template) description for details.
`attribution`  |String    |None      |The string used to describes the layer data.

### Layer Options

The layer configuration objects define each layer on your map, including the data source, style, legend, and popups.

Option         |Type      |Default   |Description
---------------|----------|----------|-----------
`id`           |String    |None      |The unique string identifier for this layer.
`url`          |String    |None      |The URL to a GeoJSON feed.
`type`         |String    |jsonp     |Defines the type of requests supported including `jsonp`, `json`, and `geoserver`. The `geoserver` type is available because its query string parameters are not standard.
`visible`      |Boolean   |false     |Whether a layer is visible by default.
`legend`       |Boolean   |true      |Whether a layer will appear in the legend.
`title`        |String    |None      |The title of the layer that will appear in the legend.
`description`  |String    |None      |What will describe the layer in the legend. HTML allowed.
`popupContent` |String    |None      |What will be displayed in the popup. Setting this to a falsey value will disable popups for this layer. Any property in the GeoJSON can be used to style the layer by wrapping it in double mustaches. ie. If the property `bus_route_id` exists on the GeoJSON and its value is `Q29`, then a `popupContent` of `'This is the {{bus_route_id}} bus.'` will render as `This is the Q29 bus.`
`rules`        |Array    |None      |The list of rules for styling this object.



Deploying to DotCloud
---------------------

At OpenPlans, we have been deploying Shareabouts to DotCloud internally, so many of the files necessary are already in the repository.  What you'll need to do is:

* Create a new DotCloud instance
* Push the code to DotCloud

    dotcloud push <instance name>

* Set your API key

    dotcloud var set SHAREABOUTS_API_KEY=<api key>
