Shareabouts Architecture
========================

Shareabouts (SA) is composed primarily of two parts:
the [Shareabouts API](https://github.com/openplans/shareabouts-api)
service, and the [Shareabouts](https://github.com/openplans/shareabouts)
front-end application.

![Shareabouts Architecture](https://docs.google.com/drawings/d/10KdhBgw7lYlpEda77W9ry4ZIxbkGAt84uIRS5JH-2_c/pub?w=960&h=720)

The Shareabouts Web Application
-------------------------------

The web application is mostly client-side JavaScript, using Backbone
and Mustache templates.

There is also a small, nearly static server-side layer which serves a
few purposes:

* Static media - CSS, images.

* Configuration - there is a config file that allows various
  customizations, notably the forms that the client displays for user
  input. See [the config documentation](CONFIG.md).

* Proxy - In order to ensure that the JavaScript layer can make AJAX
  requests to the back-end API even if it's running on a different
  domain, we send those requests through a simple HTTP proxy.

The current implementation of the server side is in Django, but it
uses so few features that it could fairly easily be re-implemented
with nearly any web development platform.


The Shareabouts API
-------------------

This is a separate web service. It provides a RESTful API for
creating and retrieving geographic points and metadata about them.
It also includes a management UI for creating datasets and
inspecting the raw data stored by the back end.

For more about this, see [the Shareabouts API docs](https://github.com/openplans/shareabouts-api/tree/master/doc).

Shareabouts Data Model
-----------------------

The data served by the Shareabouts API and used by the web app is
composed of just a few kinds of flexible objects:

### Data Sets

A user of the API can create any number of "data sets".
All location information you create or retrieve is associated with a
single Data Set.  Currently, the SA web app can only be configured to
work with a single Data Set.

### Places

A Place represents a geographic point and can have a few data
attributes stored on it:

* data - this is an arbitrary JSON object.
* submitter name - a string.
* dataset - a Place belongs to a single Data Set.

### Submissions

A Submission represents some data attached to a Place.
Every Submission has a type, which is represented by its parent
SubmissionSet (see below).  A Submission has these data attributes:

* data - an arbitrary JSON object containing the submitted data.
* submitter_name - a string.
* parent - the SubmissionSet it belongs to.


### SubmissionSets

A SubmissionSet is a group of Submissions attached
to a single Place.  A SubmissionSet has these attributes:

* place
* submission_type - a string identifying the type of these
  submissions; for example, "comment" or "rating" or "vote".


### Activity

Activity represents all user activity on the site. Any time you
create, modify, or delete a Place or Submission, an Activity is
generated, identifying who did it, what happened, and when.

These are used for the "activity stream" that appears on the right
sidebar on the default Shareabouts design.
