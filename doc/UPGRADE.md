Upgrading from Shareabouts 1.0
================================

String customizations / translations
-------------------------------------

Since we have switched our back-end from Rails to Django, and Django
uses a different translation infrastructure, you'll have to do a bit
of work if you have customized any strings for your Shareabouts
installation.  (If you have not, you can ignore this section.)

The location of the translation file is now
src/sa_web/locale/en_US/LC_MESSAGES/django.po.  (If you're doing a
different language than US english, it would be under a different
subdirectory of src/locale/

Read https://docs.djangoproject.com/en/1.4/topics/i18n/translation/ to
learn more about how to work with translations in Django.

The old translations file for Shareabouts 1.0 (the Rails version) was in 
config/locales/en.yml and was in a different format (YAML).

You will need to copy your versions of the translated strings from the
old en.yml to the new django.po file, while making some changes:

First of all the message ids have changed to be more readable in their
default form, from eg. 'app_name' to 'App Name'.  A table of
(hopefully all) changed message ids follows:


Shareabouts 1.0 id (in yml file)        | Shareabouts 2.0 id (in .po file)
----------------------------------------|-----------------------------------
  app_name:                             | "App Name"
  map_controls: locate_feature:         | "Add Place"
  feature: form: submitter_name_label:  | "Submitter Name"
  activity: point: action:              | (a long one containing 'added a {{ type }} {{# region }} ...')
  activity: point: in_region:           | (was combined with above)
                                        |
  feature: vote_action:                 | XXX THIS IS IN CONFIG FILE, CANNOT TRANSLATE
  feature: comment: action:             | XXX THIS IS IN CONFIG FILE
 auth: sign_in:                         | (a long one containing 'Or sign in with')
  auth: twitter_signin:                 | combined w/ above
  auth: fb_signin:                      | combined w/ above
  feature: description_label:           | "Point Description"
  feature: form: title_label:           | "Location Name"
  feature: form: submit:                | "Submit Location Button"
  feature: submitted_by:                | (a long one containing "added this point\n")
  activerecord: models: user:           | "Anonymous Name"
  feature: form: header:                | "Place Form Header"

  feature:
    purpose: 'This location is a %{type}.'
    sharing:
      email:
        subject: 'I suggested a %{thing}'
        body: 'Check out the %{thing} I suggested: %{url}'
      twitter:
        status: 'Check out this %{thing}! %{url}.'
  activity:
    vote:
      action: supported
    point:
      by_name: "%{name}'s point"
  # Model names and model attribute names
  activerecord:
    models:
      feature_point: point
    attributes:
      feature_point:
        the_geom: location
  # Display formats
  time:
    formats:
      display: "%-m/%-d/%Y"
      date_long: "%B %-d, %Y"
      just_time: "%l:%M %p"


------


Also, variable names in translations are in a slightly different
format now, they are %(varname) instead of %{varname}, so be sure to
change that.

Example:

If your yaml file had this:

en:
  feature:
    purpose: 'This location is a %{type}'

... then your django.po file should have this:

