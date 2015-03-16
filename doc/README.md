# From 0 to Shareabouts in about an hour


## What's here

This package contains the Shareabouts web map application,
which consists of JavaScript, some configuration files that you use to
tailor the app to your needs, and a small glue layer that talks to the
underlying Shareabouts API server.

The Shareabouts API is *not* part of this package. The easiesy way to get up and running is
to use the beta hosted API, managed by OpenPlans.
Go to [api.shareabouts.org](http://api.shareabouts.org) and request access.

Here's a short, optional [primer on the architecture of Shareabouts](https://github.com/openplans/shareabouts/blob/master/doc/ARCHITECTURE.md#shareabouts-architecture).

## Local Setup

Running a local version of Shareabouts is much easier on a Mac or Linux computer.
If you are using Windows, consider setting up a virtual machine (e.g. [VirtualBox](https://www.virtualbox.org/)) running a Linux distribution
([here are some step-by-step instructions for Ubuntu on Windows with VirtualBox](https://help.ubuntu.com/community/VirtualBox#Installing_Virtualbox_in_Windows)).

Shareabouts requires python2.6 or greater.

### Install `git`

Install `git`, if not already installed, from [http://git-scm.com/downloads](http;//git-scm.com/downloads).

### Install `pip` and `virtualenv`

Install `pip` and `virtualenv`, if not already installed.  These will keep your
python code isolated from the rest of your machine and ensure you have
the correct versions.

    easy_install pip
    pip install virtualenv

You may need to use `sudo` to install these tools.

    sudo easy_install pip
    sudo pip install virtualenv

### Install Shareabouts locally

Use git to download the latest code from Github to your computer:

    git clone https://github.com/openplans/shareabouts.git

Create a new virtual environment inside of the repository folder

    cd shareabouts
    virtualenv env
    source env/bin/activate

To install the project requirements (**NOTE: If you're only installing the web
app, replace *requirements.txt* below with *app-requirements.txt*)**, run

    pip install -r requirements.txt

### Troubleshooting your local install

If you run into trouble with gevent, you can safely comment it out of
the requirements.txt file.  It is not needed for local development.  To comment
it out, just add a hash "#" to the beginning of the line for `gevent`.

If you have trouble with `pip install -r requirements.txt`, you may need to
install the Python development libraries (for Python.h). The Windows installation has them by default,
but some UNIX-based systems with a pre-installed Python may not. On such systems, you may
need to run `sudo apt-get install python-dev` or download a fresh installer from python.org.

Mac OS X users need a command line C/C++ compiler in place for the above steps to work.
This can be done by downloading Xcode from the App Store and then installing the Command Line Tools
via Xcode's Preferences > Downloads area.

## Starting and stopping your local map instance

If you've completed the steps above, you should be ready to run your map locallu. But until [you configure your `local_settings.py`](https://github.com/openplans/shareabouts/blob/master/doc/CONFIG.md#step-2-set-up-your-local-settings), you'll see an error.

To run the development server:

    src/manage.py runserver

The server will, by default, be started at [http://localhost:8000/](http://localhost:8000/).

To stop the server, press `control-c`.

New to `virtualenv`? If you're returning to work on your map later, be sure to remember
to activate your virtual environment every time you start a new terminal session:

    source env/bin/activate

To close out your virtual environment, run

    deactivate

## Running the Shareabouts API Service

For local development, your best bet is to use OpenPlans' hosted API, data.shareabouts.org.
[Contact us](http://openplans.org/about/) and request a dataset key. We'll happily provide
hosting to community and non-commercial projects.

Alternatively, install and run the
back-end API service yourself.  To do so, you will want clone the
[Shareabouts API](https://github.com/openplans/shareabouts-api).

## Configuration

Next you need to configure the Shareabouts web app.
See [the config docs](CONFIG.md).


## Deployment

See [the deployment docs](https://github.com/openplans/shareabouts/blob/master/doc/DEPLOY.md).


## Testing

To run the tests, see [the testing docs](TESTING.md).
