From 0 to Shareabouts in about an hour
======================================
Shareabouts requires python2.6 or greater.

Local set up
------------

Install `pip` and `virtualenv`, if not already installed.  These will keep your
requirements isolated from the rest of your machine.

    easy_install pip
    pip install virtualenv

Create a new virtual environment inside of the repository folder, and install
the project requirements:

    virtualenv env
    source env/bin/activate
    pip install -r requirements.txt

NOTE: If you run in to trouble with gevent, you can safely comment it out of
the requirements.txt file.  It is not needed for local development.  To comment
it out, just add a hash to the beginning of the line for `gevent`.

To run the development server:

    src/manage.py runserver

The server will, by default, be started at http://localhost:8000/.

Static assets
-------------

Static assets for the web map interface should be placed in the
`src/sa_web/static/sa/` folder.  Included libraries and dependencies can be
placed in `src/sa_web/static/libs/`.  These files will be available on the
server at:

    http://localhost:8000/static/sa/...
    http://localhost:8000/static/libs/...
