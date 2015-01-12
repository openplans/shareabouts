# Set up Shareabouts with the Heroku Button 

The Heroku Button for Shareabouts helps you set up a Shareabouts maps on 
reliable Heroku hosting in minutes. Here are the steps.

1. Click the Heroku Button.
1. Shareabouts will automatically be set up on Heroku
1. Download the code locally to make configuration changes
1. Deploy your code changes on Heroku
1. Start collecting data!

## Before you start

### Create a Heroku account

If you don't already have one, create a [Heroku](https://heroku.com) account. 

You'll need to add a credit card to your Heroku account in order to deploy. 
Shareabouts 
costs money to host each month. The API uses a Postgres database, which costs 
$50/mo. If you want your app to always be awake, it needs more than one dyno, 
which costs $34/mo. Later, you might want to scale up components, which will 
add to the cost. You can always scale up and down as needed, so 
you won't be taken by surprise. And if you delete the app soon after creating 
it, the monthly pro rated billing will be very low.

### Set up your computer with Heroku Toolbelt

Set up the [Heroku Toolbelt](https://toolbelt.heroku.com/) to easily 
deploy your edits back to Heroku.

Your computer should be set up with `git` (comes with Heroku Toolbelt), 
`pip`, and `virtualenv`. 

Shareabouts requires python2.6 or greater.

### Read up about deploying on Heroku
Some familarity with the 
[Heroku deployment process](https://devcenter.heroku.com/articles/git), 
git, and Github will be useful but is not required.

## Setting up on Heroku

### Click the Heroku Button. 

Click the button [on the homepage of this repo](https://github.com/openplans/shareabouts/#heroku-button).

If you get a timeout message around compiling the multi-pack, try running the process again. 

### Configure App Name and Region 
After clicking the button, you'll be taken to a configuration screen on Heroku, listing out the settings
that your Shareabouts map will be deployed with.
 
Optionally, choose an App Name. Your map will be available at 
_App-Name_.herokuapp.com, so add one unless you're planning to use a 
custom domain. Otherwise, Heroku will give it a name like _warm-eyrie-7543_.

Optionally, choose a region (defaults to United States).

### Click Deploy
Scroll down to see the various environment variables that will be set. You can
change these later.

Scroll to the end and click "Deploy".

Wait while Shareabouts is configured. This can take a while.

### View your live map!
Once your Shareabouts is set up, you'll see "Your app was successfully deployed." 

Click _View it_ to see your map. Congratulations!

## Change the admin password

Before going any further with setting up your map, log into the API server and
change the default admin password.

Your API server is accessible at _app-name_.herokuapp.com/admin/ (you need the trailing slash).

User name is _admin_.

Password is _admin_ -- change this!

Later, you can use the admin interface to add additional datasets.

## Making local changes

Once your map is set up on Heroku, you'll want to configure it. For example, you
might want to change the zoom, or style the icons differently. The easiest way 
to do this is to run a local version of Shareabouts, and make changes on the local
version. Once you're happy, deploy those changes on Heroku so your live map is
updated.

To download the code,

1. Login to your Heroku account locally 

    ```
    $ heroku login
    ```

2. Clone the repository

    ```
    $ heroku git:clone -a app-name
    ```

where _app-name_ is whatever you picked above, or the default assigned 
by Heroku.

3. Get your local version running

    ```
    $ cd _app-name_
    $ virtualenv env
    $ source env/bin/activate
    $ pip install -r requirements.txt
    ```

Once these steps complete sucessfully, you should be able to run the server with

    ```
    $ src/manage.py runserver
    ```

The server will, by default, be started at 
[http://localhost:8000/](http://localhost:8000/). 

4. Configure your map locally

The map won't be very useful
[till you configure it](CONFIG.md).

When you get to [setting up your local settings](https://github.com/openplans/shareabouts/blob/master/doc/CONFIG.md#step-2-set-up-your-local-settings), use the server you just deployed to Heroku. If the server name is _shielded-tor-7768_, by default your `DATASET_ROOT` is _shielded-tor-7768_.herokuapp.com/api/v2/demo-user/datasets/demo-data until you make a new user and dataset. 

5. After committing all your local changes, push them to Heroku

    ```
    $ git push heroku master
    ```

Heroku will magically deploy the changes.

## Collaborating with other people

If you want to collaborate with others, push your project to Github.

Make a new repo on Github, and follow instructions there to "push an existing repository from the command line".
