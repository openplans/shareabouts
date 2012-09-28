These instructions apply only to the "Shareabouts Web" application.
If you are also building and installing the Shareabouts API yourself,
it has its own documentation.

You can of course deploy to any server that supports Django.

Deploying to a PaaS provider
----------------------------

At OpenPlans, we have been deploying Shareabouts to DotCloud internally, so many
of the files necessary are already in the repository.  We also have the files
necessary for deploying to Heroku.  Other PaaS providers should be simple
variations on these.

* Create a new application:

  *DotCloud*

      dotcloud create <instance name>

  *Heroku*

      heroku apps:create <instance name>

* Push to the application

  *DotCloud*

      dotcloud push <instance name> -b master

  Note you should either push all your changes to your master
  repository (eg. github or whatever you're using for version
  control);  otherwise you must use the dotcloud push --all option.

  For more options, see `dotcloud push --help`

  *Heroku*

      git push heroku master:master

* Set your flavor, and dataset API key and root URL:

  *DotCloud*

      dotcloud var set <instance name> SHAREABOUTS_FLAVOR=<flavor name> \
	                                   SHAREABOUTS_DATASET_ROOT=<dataset root url> \
	                                   SHAREABOUTS_DATASET_KEY=<dataset api key>
	                                     
  *Heroku*
  
      heroku config:set SHAREABOUTS_FLAVOR=<flavor name> \
	                    SHAREABOUTS_DATASET_ROOT=<dataset root url> \
	                    SHAREABOUTS_DATASET_KEY=<dataset api key>

Should be all done!
