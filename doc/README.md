From 0 to Shareabouts in about an hour
======================================

Shareabouts requires python2.6 or greater.

If you are converting from Shareabouts 1.0, note that
we have switched platforms. See UPGRADE.md.

Local set up
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

    src/manage.py runserver

The server will, by default, be started at http://localhost:8000/.

NOTE: If you're new to programming with virtual environments, be sure to remember
to activate your virtual environment every time you start a new terminal session.

    source env/bin/activate

Database
--------

The Shareabouts REST API requires GeoDjango.  To install GeoDjango on your
platform, see https://docs.djangoproject.com/en/dev/ref/contrib/gis/install/#platform-specific-instructions.

Create a development database for the Shareabouts data store. Copy the file
`src/project/local_settings.py.template` to `local_settings.py` and fill in the
credentials for connecting to your development database.  This file will not be
checked in to the repository.

Static assets
-------------

Static assets for the web map interface should be placed in the
`src/sa_web/static/sa/` folder.  Included libraries and dependencies can be
placed in `src/sa_web/static/libs/`.  These files will be available on the
server at:

    http://localhost:8000/static/sa/...
    http://localhost:8000/static/libs/...

Getting Set Up on DotCloud
--------------------------

First, create a new dotcloud application from the contents of the `v1` branch:

    dotcloud create shareabouts
    dotcloud push -b v1

Log on to the database server:

    dotcloud ssh shareabouts.db

Start up `psql`:

    psql

Create a database for the Shareabouts data store:

    create database shareabouts_v1 with template=template1;

Great!  Now exit out of the database server and log in to the web server:

    exit
    dotcloud ssh shareabouts.www

Find out the database connection information:

    cat ~/environment.json

Take note of the `DOTCLOUD_DB_SQL_HOST`, `DOTCLOUD_DB_SQL_PORT`,
`DOTCLOUD_DB_SQL_LOGIN`, and `DOTCLOUD_DB_SQL_PASSWORD` values. Use these to
configure the server:

    cd current/src/project
    cp local_settings.py.template local_settings.py
    nano local_settings.py

Enter the host, port, username, and password for the database. Also, set the
following variables:

    STATIC_ROOT = '/home/dotcloud/static/'
    SHAREABOUTS_API_ROOT = 'http://<hostname>/api/v1/'

Save the file and exit out of the editor. Next, set up the models in the DB, and
move the static files in to the right place:

    cd ../..
    src/manage.py syncdb --migrate
    src/manage.py collectstatic --noinput

Create an nginx configuration file so that the server knows where to look for
the static files:

    nano nginx.conf

Enter the following into the nginx configuration:

    location /static/ { root /home/dotcloud ; }

Save it and close the file. For good measure, back up your local_settings module
and your nginx config:

    cd
    cp current/src/project/local_settings.py .
    cp current/nginx.conf .

Now get off the server and restart the application:

    exit
    dotcloud restart shareabouts.www

Should be all done!
