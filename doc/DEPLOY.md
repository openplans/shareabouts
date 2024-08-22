These instructions apply only to the "Shareabouts Web" application.
If you are also building and installing the Shareabouts API yourself,
it has its own documentation.

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

         heroku buildpacks:set "https://github.com/heroku/heroku-buildpack-nodejs.git#v61"
         heroku buildpacks:add "https://github.com/cyberdelia/heroku-geo-buildpack.git#e1b845b"
         heroku buildpacks:add "https://github.com/piotras/heroku-buildpack-gettext.git#b4323a7"
         heroku buildpacks:add "https://github.com/heroku/heroku-buildpack-python.git#v52"
         heroku config:set SHAREABOUTS_FLAVOR=<flavor name> \
                           SHAREABOUTS_DATASET_ROOT=<dataset root url> \
                           SHAREABOUTS_DATASET_KEY=<dataset api key>

Should be all done!


Deploying to Google Cloud Platform (GCP)
----------------------------------------

The following instructions are for running the Shareabouts client as a Google Cloud Run service. The instructions rely on the `gcloud` command line tool.

1.  Open the _Dockerfile_ and update the line that says:
    ```dockerfile
    ARG SHAREABOUTS_FLAVOR=defaultflavor
    ```
    Replace `defaultflavor` with the flavor you want to deploy.

2.  Following Google's instructions to set up [Continuous deployment from Git using Cloud Build](https://cloud.google.com/run/docs/continuous-deployment-with-cloud-build):
    - Enable the [Cloud Build API](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com&_ga=2.154952125.480138861.1722945645-1388705808.1708553493) on your project
    - [Deploy a new service](https://cloud.google.com/run/docs/deploying#service) on Cloud Run. You can do this via the command line with `gcloud`, but the easiest way to set up Cloud Build continuous deployment at the same time is to use the GUI. The default "Container(s), Volumes, Networking, Security" settings should be fine.

3.  To set the environment variables for the Cloud Run service, create a .env file for each deployment environment (something like _.env.stg_ and _.env.prod_). The contents of the file should look like this:
    ```shell
    SHAREABOUTS_FLAVOR=<flavor name>
    SHAREABOUTS_DATASET_ROOT=<dataset root url>
    SHAREABOUTS_DATASET_KEY=<dataset api key>
    ```

    These environment files can be used to test your settings locally. To apply the settings to the Cloud Run service, you can use the `gcloud` command line tool:

    ```shell
    # Set env vars
    gcloud run services update shareabouts-client-stg --env-vars-file=<(cat .env.stg | python3 env2yml.py)
    
    # View vars
    gcloud run services describe shareabouts-client-stg
    ```