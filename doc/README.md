From 0 to Shareabouts in about an hour
======================================
Shareabouts requires python2.6 or greater.

If you are converting from Shareabouts 1.0, note that
we have switched platforms. See [the upgrade docs](UPGRADE.md).


What's here
------------

This package contains the Shareabouts API web service,
which is a Django web application providing:

* A RESTful web service
* A management user interface, at /manage
* The basic Django admin UI, for low-level superuser tasks, at /admin

The Shareabouts web application JavaScript and related files are
*not* part of this package. You'll need to install that separately.

For more about the parts of Shareabouts,
see [the architecture documentation](ARCHITECTURE.md).


Local setup
------------

Install `pip` and `virtualenv`, if not already installed.  These will keep your
requirements isolated from the rest of your machine.

    easy_install pip
    pip install virtualenv

You may need to use `sudo` to install these tools.

    sudo easy_install pip
    sudo pip install virtualenv

Create a new virtual environment inside of the repository folder, and install
the project requirements:

    virtualenv env
    source env/bin/activate
    pip install -r requirements.txt

NOTE: If you run in to trouble with gevent, you can safely comment it out of
the requirements.txt file.  It is not needed for local development.  To comment
it out, just add a hash to the beginning of the line for `gevent`.

To run the development server:

    src/manage.py runserver 8001

This will start the service at http://localhost:8000/ .

If you don't specify a port, the server will start on port 8000.
We recommend getting in the habit of using port 8001 so you can
work with the sa-web front end application on the same development
host, and run that one on port 8000.

NOTE: If you're new to programming with virtual environments, be sure to remember
to activate your virtual environment every time you start a new terminal session.

    source env/bin/activate

Database
--------

The Shareabouts REST API requires GeoDjango.  To install GeoDjango on your
platform, see https://docs.djangoproject.com/en/dev/ref/contrib/gis/install/#platform-specific-instructions.

Create a development database for the Shareabouts data store.
Typically this is done like:

  createdb -T template_postgis shareabouts_v2

Copy the file
`src/project/local_settings.py.template` to `local_settings.py` and fill in the
credentials for connecting to your development database.  This file will not be
checked in to the repository.

Then bootstrap the development database using the usual Django command:

  src/manage.py syncdb --migrate


Running the Shareabouts Web Application
-----------------------------------------

For local development, you will probably also want to install and run the
front-end mapping application.  To do so, you will want a separate clone
of the shareabouts repository, with the sa-web branch checked out.
(This is as of 2012-09-05; will likely move to a separate repository
in the future.)

For example, in another terminal session, do this:

  git clone https://github.com/openplans/shareabouts/ sa-web
  cd sa-web
  git checkout sa-web

Then follow its own install documentation, in doc/README.md.


Deployment
-------------

See [the deployment docs](DEPLOY.md).


Testing
--------

To run the tests, run this command:

  src/manage.py test

