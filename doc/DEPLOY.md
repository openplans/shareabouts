These instructions apply only to the "Shareabouts Web" application.
If you are also building and installing the Shareabouts API yourself,
it has its own documentation.

You can of course deploy to any server that supports Django.

Deploying to DotCloud
---------------------


At OpenPlans, we have been deploying Shareabouts to DotCloud internally, so many
of the files necessary are already in the repository.

* First, create a new dotcloud application from the contents of the `sa-web` branch:

    dotcloud create <instance name>

* Push the code to DotCloud

    dotcloud push <instance name> -b sa-web

  Note you should either push all your changes to your master
  repository (eg. github or whatever you're using for version
  control);  otherwise you must use the dotcloud push --all option.

  Also be sure to specify a branch if you're using one. See
  `dotcloud push --help` for more info.

* Set your API key and root URL:

    dotcloud var set <instance name> SHAREABOUTS_API_KEY=<api key> \
	                                 SHAREABOUTS_API_ROOT=<api root url>


TODO: do we still need to do this? There is some commented out stuff
in postinstall:
ssh to the shareabouts.www server and
Enter the following into the nginx configuration:

    location /static/ { root /home/dotcloud ; }

Save it and close the file. For good measure, back up your local_settings module
and your nginx config:

    cd
    cp current/src/project/local_settings.py .
    cp current/nginx.conf .
    exit



Now restart the application:

    dotcloud restart shareabouts.www

Should be all done!
