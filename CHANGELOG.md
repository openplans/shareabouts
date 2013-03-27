Copy the following template when creating a new version entry:

2.X.x
-----------------------------
  * Bug Fixes:
    - ...

  * New Features:
    - ...

  * Upgrade Steps:
    - ...


Development (master)
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
