Copy the following template when creating a new version entry:

Development (master)
-----------------------------
  * Bug Fixes:
    - Fix checkboxgroup value filtering in the admin to work with arrays of selected values

  * New Features:
    - ...

  * Upgrade Steps:
    - ...

4.1.0
-----------------------------
  * New Features:
    - Update mapbox geocoder widget to take proximity to the center of the map into account.
    - Add event hooks for place form submission success/failure/completion
    - Sticky field values are stored for each user token in the browser's local storage
    - Simple admin dashboard for viewing/managing submitted places.

  * Upgrade Steps:
    - To see the admin interface:
      1. Navigate to http://localhost:8000/login/
      2. Enter a username and password for a user that has access to the dataset for the site (this could be the dataset owner, for instance, or you could create a Group on the dataset that has permissive access to the submissions therein, and add users to that group)
      3. Click the button to go to the admin interface (or go to http://localhost/admin/)


4.0.0
-----------------------------
  * New Features:
    - Updated to Django 3.2
    - Support patching in model sync -- This makes it possible to modify the visibility of an idea, even when it 
has a logged-in submitter.
    - A few tests -- The Shareabouts client has been woefully light on tests, which has made me squeamish about major updates in the past. Trying to not let that hold the project back in the future.
  
  * Upgrade Steps:
    - The Shareabouts configuration should be backwards-compatible with 3.26.1, with the exception of any Django settings that may be in a local_settings.py file. If you have any settings in that file that aren't specific to Shareabouts, please refer to the appropriate Django release notes.

3.26.1
-----------------------------
  * Changes:
    - Style moderation button similarly to other buttons

3.26.0
-----------------------------
  * Changes:
    - Allow overriding config parameters with environment variables

      The majority of the configuration values in *config.yml* can be overridden
      with environment variables. You can determine what the environment
      variable to override a setting should be called by joining the setting's
      path with double underscores, converting to uppercase, and prepending with
      `SHAREABOUTS__`. For example, say you have the configuration options:

      ```yml
      place:
        adding_supported:
          from: 2017-03-07 09:00 -0500
          until: 2017-04-04 09:00 -0400
      ```

      You could override these settings with the two env variables:

      ```
      SHAREABOUTS__PLACE__ADDING_SUPPORTED__FROM = 2017-03-07 09:00 -0500
      SHAREABOUTS__PLACE__ADDING_SUPPORTED__UNTIL = 2017-04-04 09:00 -0400
      ```

    - Allow hiding/showing places and comments with appropriate permissions.

      The following handlebars helpers can be used to check the current user's
      permissions:

      - `{{# can_add_places }}` -- Checks whether adding is supported or the
        current user is in a `place.editors` group.
      - `{{# can_moderate_places }}` -- Checks whether the current user is in a
        `place.moderators` group. Moderators can show or hide places.
      - `{{# can_edit_places }}` -- Checks whether the current user is in a
        `place.editors` group. Editors can change the content of places, and
        add places outside of the adding supported time.

      When `can_add_places` is true, the add button show up on the interface.
      When `can_edit_places` or `can_moderate_places` is true, a control bar with
      show/hide and delete buttons is available on each place detail page.

3.25.0
-----------------------------
  * Changes:
    - Show logged-in avatar URL, if available, for password-based login page.

3.24.0
-----------------------------
  * Changes:
    - Removed use of non-unique id for support checkboxes

  * Upgrade Steps
    - If you're overloading the style of the support label in custom.css you
      may need to move a few things around. Instead of styling `.user-support label`,
      style `.support-label-content`.

2.1
-----------------------------
  * New Features:
    - Translatable pages

  * Upgrade Steps:

    In order to update your Shareabouts codebase beyond commit [714c41f3](https://github.com/openplans/shareabouts/commit/714c41f3f00aeebaa0b25bf9297f4d0e67f92826), you will have to do the following:

    Go into your flavor directory

        $ cd flavors/myflavor

    Move your existing pages into a folder called `jstemplates`

        $ mkdir jstemplates
        $ git mv static/pages/ jstemplates/

    In your `config.yml` file, update your pages section. For example, if you had:

        pages:
          - title: _(About)
            slug: about
            url: /static/pages/overview.html
            start_page: true

          - title: _(Why Shareabouts?)
            slug: why
            url: /static/pages/why.html

          - title: _(Features)
            slug: features
            url: /static/pages/features.html

          - title: _(Feedback)
            external: true
            url: https://openplans.zendesk.com/anonymous_requests/new

    You should change to:

        pages:
          - title: _(About)
            slug: about
            name: overview
            start_page: true

          - title: _(Why Shareabouts?)
            slug: why

          - title: _(Features)
            slug: features

          - title: _(Feedback)
            external: true
            url: https://openplans.zendesk.com/anonymous_requests/new

    Things to note:

    * If the name of the template is the same as the page slug (e.g., "Features"
      has a slug 'features' and a filename of 'features.html') then you only need
      to specify the slug. If they differ (e.g., "About" has a slug 'about', but
      a file name of 'overview.html') you'll need to specify the page name in
      addition to the slug.
    * External links are the same as they were before.

    See the [configuration documentation](https://github.com/openplans/shareabouts/blob/714c41f3f00aeebaa0b25bf9297f4d0e67f92826/doc/CONFIG.md#pages-and-links) for more information.

2.0.1
-----------------------------
  * New Features:
    - Now deployable to Heroku!
    - Add data layers to your map using [Argo configurations](https://github.com/openplans/argo/wiki/Configuration-Guide)
    - Make your configuration strings translatable
    - Upload images

  * Upgrade Steps:
    - The configuration values for setting the dataset root and api key have
      moved from the flavor *config.yml* file into the `settings` module.  If
      your *config.yml* file contained the following:

          dataset: user-name/dataset-name
          api_root: http://api.shareabouts.org/api/v1/
          dataset_api_key: abcd1234

      You would now delete those values from the config file, and instead, in
      your *local_settings.py* file include the following:

          SHAREABOUTS = {
              'FLAVOR': 'flavor_name',
              'DATASET_ROOT': 'http://api.shareabouts.org/api/v1/datasets/user-name/dataset-name/'
              'DATASET_KEY': 'abcd1234',
          }

      **NOTE that the `SHAREABOUTS_FLAVOR` variable also moved in here as the
      `FLAVOR` attribute.**

      The format of the dataset root URL will usually be:

          'http://<hostname>/api/v1/datasets/<username>/<dataset>/'

    - If you have a Shareabouts client deployed on DOTCLOUD, you will need to
      update your environment variables as follows:
      * `SHAREABOUTS_FLAVOR` stays the same
      * `SHAREABOUTS_API_KEY` becomes `SHAREABOUTS_DATASET_KEY`
      * `SHAREABOUTS_API_ROOT` becomes `SHAREABOUTS_DATASET_ROOT`, and should use the format above.


2.0.0
-----------------------------
  * Started keeping versions

-------------------------------------------------------------------------------

# What the version numbers mean

We use this version scheme: 2.M.m-i

We'll be on 2 for a while, so we'll consider the 2nd number the major version.
The major version changes when we introduce code that requires users to change
their code to keep it working (backwards-incompatible change).  The minor
number may change when we add a significant feature. If a change will not break
existing users' instances, but they may make a change to take advantage of some
new functionality, the minor version should be bumped.

The incremental version will usually not change, though may be useful for
support purposes.  It may be a letter or a number or a datetime stamp.  We'll
figure that out when we have a use for it.

# What version am I on

Whichever version number heading is at the top of this file is the current
version of this project. If the version is Development (master), the last
marked version is the next version number down.

# When to mark a version

Any time we introduce a new feature, or make a change in a current feature, we
should mark a new version.  Each version should correspond to a tag in the git
repository.

# How to mark a new version

1.  Update this file.  Whatever's under the heading 'Development (master)'
    will now be under a new heading corresponding to the new version number.
2.  Commit this file, and create a tag labeled with the version number.
3.  Add a new 'Development (master)' section for recording ongoing changes.
