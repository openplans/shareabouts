These instructions apply only to the "Shareabouts API" application.
If you are also building and installing the Shareabouts web front-end,
it has its own documentation.

Deploying to DotCloud
---------------------

At OpenPlans, we have been deploying Shareabouts to DotCloud internally, so many
of the files necessary are already in the repository.

* First, create a new dotcloud application from the contents of the `sa-service` branch:

    dotcloud create <instance name>

* Push the code to DotCloud.  This will take several minutes the first time.

    dotcloud push <instance name> -b sa-service

  Note you should first either push all your changes to your master
  repository (eg. github or whatever you're using for version
  control);  otherwise you must use the dotcloud push --all option.

  For more options, see `dotcloud push --help`


* On first deploy only: You'll want to create a superuser to get in to
  the management UI:

    dotcloud run <instance name>.www current/src/manage.py createsuperuser
