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

To run the development server:

    src/manage.py runserver

The server will, by default, be started at http://localhost:8000/.
