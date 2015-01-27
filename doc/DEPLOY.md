These instructions apply only to the "Shareabouts Web" application.
If you are also building and installing the Shareabouts API yourself,
it has its own documentation. If you'd rather use OpenPlans' hosted API, [contact us](api.shareabouts.org).

You can deploy to any server that supports Django, but using a PaaS providers and our instructions below may be easier. The easist approach is to deploy via our "Deploy to Heroku" button.

Deploying to Heroku with the button
----------------------------

The fastest way to deploy Shareabouts is to click the "Deploy to Heroku" button in the [README](https://github.com/openplans/shareabouts#shareabouts-). This will deploy the Shareabouts code for you on [Heroku](https://heroku.com), a popular cloud platform for running software. 

After clicking the button, you will see the configuration settings. Click "Deploy" confirm the setup, and in a few moments you'll have a Shareabouts map. 

if you don't have a Heroku account, you'll be prompted to create one. Your account will be free, and setting up Shareabouts will also be free (later you may pay some monthly hosting costs if you scale up, but this is explained and easy to control via the Heroku Dashboard).


Deploying to Heroku manually
--------------------------

From the root Shareabouts directory...

* Create a new application:

         heroku apps:create <instance name>

* Add the necessary addons:

         heroku addons:add heroku-postgresql:standard-0
         heroku addons:add rediscloud

* Push to the application

         git push heroku master:master

* Set your environment variables:

  You will need your dataset root API URL for this step.  Suppose you are using an API server named *api.shareabouts.org* with a username *mjumbewu* and a dataset called *niceplaces*. In this case, your dataset root will be `http://api.shareabouts.org/api/v2/mjumbewu/datasets/niceplaces/`.  In general, it will always be `http://<api server>/api/v2/<username>/datasets/<dataset slug>/`.

         heroku config:set BUILDPACK_URL="https://github.com/ddollar/heroku-buildpack-multi.git" \
                           SHAREABOUTS_FLAVOR=<flavor name> \
                           SHAREABOUTS_DATASET_ROOT=<dataset root url> \
                           SHAREABOUTS_DATASET_KEY=<dataset api key>

Should be all done!

Deploying to Dotcloud manually
--------------------------

At OpenPlans, we deployed to Heroku and DotCloud internally, so all 
of the files necessary are already in the repository. Other PaaS providers should be simple
variations on these.


From the root Shareabouts directory...

* Create a new application:

         dotcloud create <instance name> -f live

  This will create the application on DotCloud using the live flavor, and prompt you connect it to your current directory: `Connect the current directory to "<instance name>"?` If you choose yes, this application will become your default and you can ignore the `-A <instance name>` flags below.

* Push to the application


         dotcloud push --application <instance name> -b master --git

  Note you should either push all your changes to your master repository (eg. github or whatever you're using for version control); otherwise you must omit the `--git` option and _everything_ in your current directory will be pushed up.

  For more options, see `dotcloud push --help`


* Set your flavor, and dataset API key and root URL:

  You will need your dataset root API URL for this step.  Suppose you are using an API server named *api.shareabouts.org* with a username *mjumbewu* and a dataset called *niceplaces*. In this case, your dataset root will be `http://api.shareabouts.org/api/v2/mjumbewu/datasets/niceplaces/`.  In general, it will always be `http://<api server>/api/v2/<username>/datasets/<dataset slug>/`.

  *DotCloud*

         dotcloud env --application <instance name> set SHAREABOUTS_FLAVOR=<flavor name> \
                                             SHAREABOUTS_DATASET_ROOT=<dataset root url> \
                                             SHAREABOUTS_DATASET_KEY=<dataset api key>


Should be all done!


Deploying to WebFaction
-----------------------

0. Create a Django application using Django 1.5 and Python 2.7 in the control panel (Applications -> Add New Application). In this case an application called 'shareabouts_front' was created.

1. SSH into your server and check out the project alongside wherever WebFaction created your `myproject` app:

        cd webapps/shareabouts_front
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
        WSGIDaemonProcess shareabouts_front processes=2 threads=12 python-path=/home/<HOME_DIR>/webapps/shareabouts_front:/home/<HOME_DIR>/webapps/shareabouts_front/shareabouts/src:/home/<HOME_DIR>/webapps/shareabouts_front/lib/python2.7

        WSGIProcessGroup shareabouts_front
        WSGIRestrictEmbedded On
        WSGILazyInitialization On

        #####
        # AND THIS LINE WAS CHANGED to refer to your Shareabouts WSGI module
        WSGIScriptAlias / /home/<HOME_DIR>/webapps/shareabouts_front/shareabouts/src/project/wsgi.py


6. Edit the WSGI module (shareabouts/src/project/wsgi.py).  This is so that the project runs in the same environment where all of its dependencies have been installed  *If you did not set up a virtual environment, you can skip this step*:

   After...

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

   Add...

        activate_this = os.path.expanduser("~/webapps/shareabouts_front/venv/bin/activate_this.py")
        execfile(activate_this, dict(__file__=activate_this))


7. Update the shareabouts/src/project/urls.py file to be able to find the site's static assets.  **NOTE: it would be better if this pointed to an actual static file server.  See http://docs.webfaction.com/software/django/config.html#serving-django-static-media for more information**:

   At the top, add...

        from django.contrib.staticfiles.urls import staticfiles_urlpatterns

   And change

        urlpatterns = patterns('',

   to

        urlpatterns = staticfiles_urlpatterns() + patterns('',
