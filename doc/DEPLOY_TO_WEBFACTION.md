These instructions apply only to the "Shareabouts Web" application.
If you are also building and installing the Shareabouts API yourself,
it has its own documentation.

You can of course deploy to any server that supports Django.

Deploying to WebFaction
-----------------------

0. Create a Django application using Django 1.4 and Python 2.7 in the control panel (Applications -> Add New Application). In this case an application called 'shareabouts_front' was created.

1. SSH into your server and check out the project alongside wherever WebFaction created your `myproject` app:

        cd webapps/...
        git clone git://github.com/openplans/shareabouts.git

2. Install pip and (optionally) virtualenv:

        easy_install-2.7 pip
        easy_install-2.7 virtualenv

3. Create a virtual environment.  This is not technically necessary, but is recommended if you have any other non-Shareabouts Python applications running on your server, or if you plan to in the future.  For a brief introduction to virtual environments in Python see http://iamzed.com/2009/05/07/a-primer-on-virtualenv/ or the virtualenv docs at http://www.virtualenv.org/:

        virtualenv venv --no-site-packages
        source venv/bin/activate

4. Install the project dependencies:

        pip install -r shareabouts/requirements.txt

5. Edit the apache2/conf/http.conf file. This is so that Apache knows where to find the project's dependencies, and how to run the WSGI app:

        ...
        SetEnvIf X-Forwarded-SSL on HTTPS=1
        ThreadsPerChild 5

        #####
        # THIS LINE WAS CHANGED to refer to your Shareabouts project path
        WSGIDaemonProcess shareabouts_front processes=2 threads=12 python-path=/home/<HOME_DIR>/webapps/...:/home/<HOME_DIR>/webapps/.../shareabouts/src:/home/<HOME_DIR>/webapps/.../lib/python2.7

        WSGIProcessGroup shareabouts_front
        WSGIRestrictEmbedded On
        WSGILazyInitialization On

        #####
        # AND THIS LINE WAS CHANGED to refer to your Shareabouts WSGI module
        WSGIScriptAlias / /home/<HOME_DIR>/webapps/.../shareabouts/src/project/wsgi.py


6. Edit the WSGI module (shareabouts/src/project/wsgi.py).  This is so that the project runs in the same environment where all of its dependencies have been installed  *If you did not set up a virtual environment, you can skip this step*:

   After...

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

   Add...

        activate_this = os.path.expanduser("~/webapps/shareabouts_front/venv/bin/activate_this.py")
        execfile(activate_this, dict(__file__=activate_this))


7. Update the shareabouts/src/project/urls.py file to be able to find the site's static assets.  **NOTE: it would be better if this pointed to an actual static file server**:

   At the top, add...

        from django.contrib.staticfiles.urls import staticfiles_urlpatterns

   And change

        urlpatterns += patterns('',

   to

        urlpatterns += staticfiles_urlpatterns() + patterns('',
