From 0 to Shareabouts in about an hour
======================================

What's here
------------

This package contains the Shareabouts web map application,
which consists of JavaScript, some configuration files that you use to
tailor the app to your needs, and a small glue layer that talks to the
underlying Shareabouts API server.

The Shareabouts API is *not* part of this package. The easiesy way to get up and running is 
to use the beta hosted API, managed by OpenPlans. 
Go to [api.shareabouts.org](http://api.shareabouts.org) and request access.

For more about the parts of Shareabouts,
see [the architecture documentation](ARCHITECTURE.md). 

If you are converting from Shareabouts 1.0, note that
we have switched platforms. See [upgrade info](UPGRADE.md) and [original docs](https://github.com/openplans/shareabouts/blob/v1/doc/README_FOR_APP).

Local Setup
------------

Shareabouts requires python2.6 or greater.

Install `pip` and `virtualenv`, if not already installed.  These will keep your
python code isolated from the rest of your machine and ensure you have
the correct versions.

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

NOTE: If you run into trouble with gevent, you can safely comment it out of
the requirements.txt file.  It is not needed for local development.  To comment
it out, just add a hash "#" to the beginning of the line for `gevent`.

NOTE: If you have trouble with `pip install -r requirements.txt`, you may need to
install the Python development libraries (for Python.h). The Windows installation has them by default,
but some UNIX-based systems with a pre-installed Python may not. On such systems, you may
need to run `sudo apt-get install python-dev` or download a fresh installer from python.org.

NOTE: Mac OS X users need a command line C/C++ compiler in place for the above steps to work. 
This can be done by downloading Xcode from the App Store and then installing the Command Line Tools
via Xcode's Preferences > Downloads area.

To run the development server:

    src/manage.py runserver

The server will, by default, be started at [http://localhost:8000/](http://localhost:8000/).
But it won't be very useful [till you configure it](CONFIG.md).

NOTE: If you're new to programming with virtualenv, be sure to remember
to activate your virtual environment every time you start a new terminal session:

    source env/bin/activate


Running the Shareabouts API Service
------------------------------------

For local development, your best bet is to use OpenPlans' hosted API. 
Go to [data.shareabouts.org](http://data.shareabouts.org) and request access.

Alternatively, install and run the
back-end API service yourself.  To do so, you will want clone the
[Shareabouts API](https://github.com/openplans/shareabouts-api).

Configuration
--------------

Next you need to configure the Shareabouts web app.
See [the config docs](CONFIG.md).


Static assets
-------------

Static assets for the web map interface should be placed in the
`src/sa_web/static/` folder.  Included libraries and dependencies can be
placed in `src/sa_web/static/libs/`.  These files will be available on the
local development server at:

    http://localhost:8000/static/...
    http://localhost:8000/static/libs/...


Deployment
-------------

See [the deployment docs](https://github.com/openplans/shareabouts/blob/master/doc/DEPLOY.md).


Testing
--------

To run the tests, see [the testing docs](TESTING.md).
