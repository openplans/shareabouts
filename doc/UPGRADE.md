Upgrading from Shareabouts 1.0
================================

Database Migration
----------------------

This would happen on the Shareabouts API, not Shareabouts Web.
... And needs to be written.


String customizations / translations
-------------------------------------

Since we have switched our platform from Rails to Django, and Django
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

First of all, the message ids have changed to be more readable in their
default form, from eg. 'app_name' to 'App Name'.  A table of
(hopefully all) changed message ids follows.
Note that some values are translatable; others are configurable in
project/config.yml but NOT translatable; others no longer exist.


Shareabouts 1.0 id (in yml file)                                             | Shareabouts 2.0 file and id, or N/A
-----------------------------------------------------------------------------|---------------------------------------------
 app_name:                                                                   | django.po: "App Name"
 map_controls: locate_feature:                                               | django.po: "Add Place"
 feature: form: submitter_name_label:                                        | django.po: "Submitter Name"
 activity: point: action:                                                    | django.po: (a long one containing 'added this point')
 activity: point: in_region:                                                 | django.po: (was combined with above)
 feature: vote_action:                                                       | config.yml: survey: support: submit_btn_text:
 feature: comment: action:                                                   | config.yml: survey: submit_btn_txt:
 auth: sign_in:                                                              | django.po: (a long one containing 'Or sign in with')
 auth: twitter_signin:                                                       | django.po: combined w/ above
 auth: fb_signin:                                                            | django.po: combined w/ above
 feature: description_label:                                                 | django.po: "Point Description"
 feature: form: title_label:                                                 | django.po: "Location Name"
 feature: form: submit:                                                      | django.po: "Submit Location Button"
 feature: submitted_by:                                                      | django.po: (a long one containing "added this point\n")
 activerecord: models: user:                                                 | django.po: "Anonymous Name"
 feature: form: header:                                                      | django.po: "Place Form Header"
 activity: point: by_name:                                                   | N/A
 activity: vote: action:                                                     | config.yml: support: action_text:
 time: formats: display:                                                     | N/A
 time: formats: date_long:                                                   | N/A
 time: formats: just_time:                                                   | N/A
 feature: purpose:                                                           | N/A
 feature: sharing: email: subject:                                           | N/A
 feature: sharing: email: body:                                              | N/A
 feature: sharing: twitter: status:                                          | N/A
 activerecord: models: feature_point:                                        | N/A
 activerecord: attributes: feature_point: the_geom:                          | N/A


Also, variable names in translations are in a slightly different
format now, they are %(varname) instead of %{varname}, so be sure to
change that.
