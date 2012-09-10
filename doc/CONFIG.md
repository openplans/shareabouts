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

The properties of icons are as per the Leaflet docs, see http://leaflet.cloudmade.com/reference.html#icon
But briefly:

The *iconUrl* is relative to the root of the website. Put the corresponding
image file in src/sa_web/static/sa/css/images/.
The iconSize you specify in config.yml should match that of the image.

*iconAnchor* is measured in pixels, and specifies where relative to the
map point the center of the icon is placed; useful for eg. place
markers that look best sticking up from the point rather than centered
on it.


### Input forms

Users can do basically three things with places:

* Create one
* Add some information to an existing one
* Support or Like one

All of this happens in the 'place' section of the config.yml file.

#### Creating places

The 'place' section of the config file starts like this:

    place:
      adding_supported: true
      title: The title of the form.

If adding_supported is set to false, users cannot add places, and can
only comment on or support the places you provide.

Next you can have any number of input widgets to appear on the place
adding form. These go in the *items* subsection, under *place*.
Each one looks like:

    items:
      - prompt: Your Name
        type: text
        name: submitter_name
        optional: true
        attrs:
          - key: placeholder
            value: Type Your Name Here
          - key: size
            value: 30

The *prompt* is used to label the form. The *type*, *name*, and any
*attrs* are used directly as HTML attributes.  This example would
generate the following HTML:

    <label for="place-submitter_name">Your Name (optional)</label>
    <input id="place-submitter_name type="text"
     name="submitter_name"
	 size="30" placeholder="Type Your Name Here">

The *optional* setting adds some text to the form
label, but it also is used when validating your form, so if optional
is omitted or set to false, the user will get an error if they don't
provide a value.

##### Choosing a place type

If you have only one *place type* (see above), you'll want to specify
it as a hidden input named *location_type*, like so:

    - type: hidden
      name: location_type
      attrs:
        - key: value
          value: <your place type name goes here>

(Yes, it's odd that the names are inconsistent. Needs to be fixed;
see https://www.pivotaltracker.com/story/show/35697987)

If you have more than one place type, and want your users to be able to
choose which type they're adding, then use a select input, like so:

    - prompt: Location Type
      type: select
      options:
        - Landmark
        - Park
        - School



Once a Place has been created, users can click on it and see a form to
add more information. There are two parts to this: a simple Support
section, and a section with one or more inputs to add more info.  Both
parts are configurable, see below.

#### Survey Form Configuration

The survey form is configured in the *survey* section.
First you can configure display of existing submissions.
The options you can set are:

Option               | Type    | Description
---------------------|---------|----------------
submission_type      | string  | What type of submissions these are, eg. "comments"
show_responses       | boolean | Whether previous submissions should be shown with the form.
response_name        | string  | Label to use when displaying previous submissions.
response_plural_name | string | Plural label for displaying previous submissions.
 action_text         | string  | For example, "commented on"



Next is the survey form itself.  This is much like the Place creation
form described above.  You can supply an arbitrary number of form items.
Here's an example:

    # Survey form config
    title: Leave a Comment
    form_link_text: Leave a Comment
    submit_btn_text: Comment
    items:
      - prompt: Comment
        label: Comment
        type: textarea
        name: comment
      - prompt: Your Name
        type: text
        name: submitter_name


#### Support Form Configuration

This is a simple form with a single button, in the *support* section.
The options you can set are:

Option               | Type    | Description
---------------------|---------|----------------
submission_type      | string  | Name for a type of submission a "support" is saved as, eg. "support"
submit_btn_txt       | string  | Text on the submit button itself.
action_text          | string  | Past-tense verb for display in the activity view, eg. "supported"


### Interface Text

Much of the text in Shareabouts can be customized via the Django
localization (translation) machinery.  Even if you're only creating a
site in english, this is useful to change various strings used on the
site.

The translations file is
src/sa_web/locale/en_US/LC_MESSAGES/django.po
You can edit this file with any text editor,
or with any tool that supports .po files, such as
[poedit](http://www.poedit.net/).

Edit the translations as desired, save it, then run this command:

    cd src/sa_web
	../manage.py compilemessages

A few notable messages you will definitely want to edit:

* msgid "App Title"

* msgid "App Description"

* msgid "App Name"


### Pages

Shareabouts allows you to create multiple static pages, linked from
the top navigation bar. To create a page:

* To add a page to the navigaton bar, first add a title, slug, and url
  to the "pages" array in config.yml.  For example:

    - title: About
      slug: about
      url: /static/sa/pages/about.html
	  start_page: true

  The *start_page* option allows specifying that this page should be
  open when people first visit the site. If omitted, it defaults to false.

* Create the page content (as HTML) in the file pointed to by the url.
  For the given example, you would edit the content in
  src/sa_web/static/sa/pages/features.html.


### Styling

See [Customizing the Theme](CUSTOM_THEME.md)
