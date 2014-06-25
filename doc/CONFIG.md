Setting up a Shareabouts Web instance
=====================================

Step 0: Create a Dataset
------------------------

You'll need an account on a Shareabouts API server.

To use the OpenPlans hosted server, request a dataset and key via support@openplans.org. Your dataset will be on the OpenPlans API server,
[data.shareabouts.org](http://data.shareabouts.org).

Step 1: Create a flavor
-----------------------

A "flavor" is a particular configuration of Shareabouts.

Copy the *flavors/default* folder to a new subdirectory
of *flavors/*.  Name it whatever you want.


Step 2: Set up your local settings
-----------------------

Copy the *project/local_settings.py.template* file to
*project/local_settings.py*.

Edit the new file, changing `SHAREABOUTS_FLAVOR` to the name of the flavor directory you just
created.

Also update `DATASET_ROOT`, and `DATASET_KEY`. Get this info from your API server. In `DATASET_ROOT`, change _v1_ to _v2_.

**NOTE: You don't want to check the API key information in to your
repository, as anyone would be able to write to your data using your
API key.**

If after completing setup you see [a screen like this](https://f.cloud.github.com/assets/146749/1627911/d5e82492-56fe-11e3-89d7-9d6b35f10c6b.png) when saving or supporting a place or submitting a reply, then you probably have you dataset key set incorrectly in your settings.


Step 3: Edit your flavor
-----------------------

Your flavor directory contains a *config.yml* file that you will be
editing throughout the rest of these instructions. Once you're done with config and local testing,
[deploy](https://github.com/openplans/shareabouts/blob/master/doc/DEPLOY.md).

### The Map

The map options are for initial map setup and match the [Leaflet Map
options](http://leaflet.cloudmade.com/reference.html#map-options).


Option       |Type      |Default   |Description
-------------|----------|----------|-----------
`center`     |Object    |None      |Latitude and longitude for the initial center. eg. "lat: 39.9523524" and "lng: -75.1636075"
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
add to the "layers" array.  This array should match the configuration format
for [Argo](https://github.com/openplans/argo/wiki/Configuration-Guide) layer
options.

A sample configuration for Argo layers can be found in the `overlays`
flavor [config file](https://github.com/openplans/shareabouts/blob/master/src/flavors/overlays/config.yml#L24).
The data used in that example can also be found in the flavor under the
[*/static/layers/*](https://github.com/openplans/shareabouts/tree/master/src/flavors/overlays/static/layers)
folder.


### Place Types

Shareabouts can handle multiple types of Place. To set up the types
syou're interested in, edit config.yml and add items to the `place_types`
section. Each Place value should match a location_type.

Look at the config.yml for examples of styling Places. The properties of icons are as per the Leaflet docs, see http://leaflet.cloudmade.com/reference.html#icon
But briefly:

The *iconUrl* is relative to the root of the website. Put the corresponding
image file in src/sa_web/static/css/images/.
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
      location_item_name: address

If `adding_supported` is set to false, users cannot add places, and can
only comment on or support the places you provide.

The `location_item_name` attribute is used when the `geocoding_enabled` flag
is set to true in the map config. When a user is adding a new place to the
map, the location of the place will be reverse-geocoded every time they move
the map. The result of that reverse-geocoding will be a string saved to the
model in the `location_item_name` attribute. E.g., in the above example, the
string will be saved in the `address` field of a place.

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

The *optional* setting can be used to indicate optional items.
* with `optional: true`, the user sees _(optional)_ added to the form
label. The setting has no other effect.
* with `optional:` omitted, users can leave form items blank, and will not see the _(optional)_
label. You may prefer this if all your items are optional.

To make an item required, use the `attr` section to set `key: required` and  `value: true`. We're using HTML5 validation, so browsers handle this differently
(or [not at all](http://caniuse.com/form-validation)).

The *label* setting can also be used for a place item. It is used as the label
for that input value when it is displayed in the place detail view after it
has been saved.

**NOTE** There are three special place input properties: `submitter_name`, `name`,
and `location_type`. These are specially displayed on the place detail view and
therefore ignore the *label* setting.

##### Attaching images to places

You can attach images to places by configuring an input of type `file`. The
configuration should look like this:

    items:
      - inputfile_label: Add an Image
        type: file
        name: my_image
        attrs:
          - key: accept
            value: image/*

This will generate markup that looks similar to this:

    <label for="place-my_image"></label>
    <span class="fileinput-container ">
      <span>Add an Image</span>
      <input id="place-my_image" name="my_image" type="file" accept="image/*">
    </span>

You can restyle the image input by overriding the `.fileinput-container` class
in `custom.css` in your flavor.

**NOTE** This does not currently support multiple file inputs or inputs types
other than images.

**NOTE** All images are proportionally resized with a max size of 800 pixels and
converted to JPEGs.

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
      - prompt: Your Email
        type: text
        name: private-submitter_email

##### Collecting Private Data

Sometimes you'll want to collect data from users that you don't want to make
available to the world (e.g., users' email addresses). You can mark data that
is meant to be private with a `private-` prefix. This data will be available
to you through the Shareabouts admin interface, but will not be shown through
in your map. See the section on [survey form configuration](#survey-form-configuration)
for an example.

#### Support Form Configuration

This is a simple form with a single button, in the *support* section.
The options you can set are:

Option               | Type    | Description
---------------------|---------|----------------
submission_type      | string  | Name for a type of submission a "support" is saved as, eg. "support"
submit_btn_txt       | string  | Text on the submit button itself.
action_text          | string  | Past-tense verb for display in the activity view, eg. "supported"


### Translating Interface Text

The text in Shareabouts can be translated via the Django
localization (translation) machinery.

To mark text in your configuration (flavor) as available to be
translated, wrap the text in `_(` and `)`.  For example, in the following
snippet, `Button Label` will be available for translation, but `survey_type`
will not:

    label: _(Button Label)
    type_name: survey_type

You can also translate the content in your pages. Surround any text that you
would like to be translatable with `{{#_}}` and `{{/_}}`. For example:

    <h2>{{#_}}About{{/_}}</h2>

To generate a translation template, run the following from your flavor
directory:

    <project_src_root>/manage.py flavormessages --locale en_US

Do this for each language you want your map to be available in. For the
locale, use a locale name as specified in Django's documentation:
https://docs.djangoproject.com/en/dev/topics/i18n/#term-locale-name

Once your messages files are generated, fill in any translations that should
be made.  If you leave a translation blank, the original string will be used.

To apply your translations, run the following from your flavor directory:

    <project_src_root>/manage.py compilemessages

That's it! The compilemessages task is run automatically for the DotCloud and
Heroku deployments.

### Choosing a Language

By default, Shareabouts will try to infer the target user's language from their
browser settings. If you would like them to be able to explicitly select the
interface language, you can configure a language selector in the application's
title bar.

Specify the available languages by adding this section to your configuration:

    languages:
      - code: en
        label: I Speak English

      - code: es
        label: Hablo Español

      - code: hi
        label: मैं हिंदी बोलते हैं

The `code` should be one of the [ISO-639-1 language codes](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes),
and the `label` should be the string that you want to appear in the language
selector drop-down menu. Note that the language labels should not be marked for
translation, and should be written in the target language.

Don't forget to [translate your interface text](#translating-interface-text)
into each of your desired target languages.

For more information on language codes, see the [Django documentation](https://docs.djangoproject.com/en/1.3/topics/i18n/#term-language-code).

### Pages and Links

Shareabouts allows you to create multiple static pages, linked from
the top navigation bar. To create a page:

* To add a page to the navigaton bar, first add a *title*, and *slug*
  to the "pages" array in config.yml.  For example:

        - title: About
          slug: about
      	  start_page: true

  The *start_page* option allows specifying that this page should be
  open when people first visit the site. If omitted, it defaults to false.

* Create the page content (as HTML). Shareabouts will look for your content
  in a file in your flavor called *jstemplates/pages/about.html*. The filename
  matches the slug by default. If you want to use a different name for your
  page file, you can specify a *name* attribute as well, e.g.:

        - title: About
          slug: about
          name: new
      	  start_page: true

  In this example, your file will be found at *jstemplates/pages/new.html*.

You can also add links to external sites to the navigation bar.  To do
this, simply add a title and url to the "pages" array in config.yml, and
set the "external" property to "true".  For example:

    - title: OpenPlans
      url: http://www.openplans.org/
      external: true

**NOTE** Do not include `<script>` tags in your pages. If you want to do custom
  scripting from within your flavor, add your scripts to the includes template
  (_templates/includes.html_).

### Email Notifications

You can turn on the ability for users to receive notifications after adding a place. In your configuration file, add the following:

    notifications:
      on_new_place: true

By default, this will look for a *submitter_email* field on submitted places to notify. If you want to use a different field you can specify it with the `submitter_email_field` attribute. For example, the following will look for a *private_submitter_email* field:

    notifications:
      on_new_place: true
      submitter_email_field: "private_submitter_email"

If you choose to use email notifications, be sure to set the following in your environment:

    EMAIL_ADDRESS
    EMAIL_USERNAME
    EMAIL_PASSWORD
    EMAIL_HOST
    EMAIL_PORT
    EMAIL_USE_TLS

Refer to your email provider's instructions on configuring a client for sending email with SMTP. Also, if you would like to also be notified of new places posted, you can add yourself to a BCC list for each email by setting the following variable to a comma-separated list of email addresses:

    EMAIL_NOTIFICATIONS_BCC

To change the subject or body of the email that is sent to users, create templates called *new_place_email_subject.txt* and *new_place_email_body.txt* respectively in your flavor's *templates/* folder. These should templates have the variables `request`, `config`, and `place` in the context. See the file *src/sa_web/templates/new_place_email_body.txt* for an example.

### Styling

See [Customizing the Theme](CUSTOM_THEME.md)
