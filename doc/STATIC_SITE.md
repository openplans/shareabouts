Converting your map to a static site
====================================

If you no longer want to use the API to serve your data, you can serve it all
directly from your client using a static snapshot of your map data.

1. **Generate a snapshot of your data.**

   Navigate to the snapshots route for places. Find the snapshot route by taking
   the places collection URL and adding "/snapshots" to the path. Use the query
   string parameters `include_submissions`, which will give you the comments,
   surveys, support, etc. in addition to the place data. To request a new
   snapshot , also include the `new` querystring parameter.

   Your query should look something like `https://shareaboutsapi2.herokuapp.com/api/v2/demo-user/datasets/demo-data/places/snapshots?include_submissions&new`.

   For more information on generating and downloading snapshots, see the
   [Shareabouts API server docs](https://github.com/openplans/shareabouts-api/blob/master/doc/GETTING_YOUR_DATA.md).

2. **Download your snapshot.**

   When the URL provided stops returning 503 responses, your data is ready. You
   can check with `curl -X HEAD "<snapshot-url>"`. Download your data and save
   it in a file in your flavor folder. For example, assuming you're using a
   flavor named *myflavor*, run:

        cd src/flavors/myflavor
        curl "https://shareaboutsapi2.herokuapp.com/api/v2/demo-user/datasets/demo-data/places/snapshots/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" > demo-data.json

3. **Configure your settings.**

   For a static snapshot, you'll have to use a different dataset root URL. To
   test this, in your *local_settings.py* file, change the `DATASET_ROOT`
   setting to `"file://src/flavors/myflavor/demo-data.json"`, substituting
   the appropriate parts of the file path with the location of your own snapshot
   file.

   Now, from the root of your project, run `src/manage.py runserver` like normal
   and your data should be served from your static snapshot.


4. **Turn off submissions and activity.**

   When serving from a snapshot you'll probably also want to adjust your
   *config.yml* file so that the new place button and the activity ticker are
   both hidden. Also, you will probably want to add styles to hide the sign-in
   widgets and the comment/survey forms. In your *custom.css*, add:

        #auth-nav-container {
          display: none;
        }
        .or-sign-in {
          display: none;
        }
        div #reply {
          display: none;
        }
        a.reply-link.btn.btn-small {
          display: none;
        }

   Lastly, you'll want to disable support clicks. In your flavor folder, add a
   JS template file named *jstemplates/place-detail-support.html*. In to this
   file, copy the contents of *src/sa_web/jstemplates/place-detail-support.html*
   and remove all of the `<input>` elements. Your new template should look
   something like:

        <form action="#" method="post" class="btn btn-block btn-small user-support">
          <label><span class="support-count">{{#if count }}{{ count }}{{else}}0{{/if }}</span> {{ support_config.submit_btn_text }}</label>
        </form>

   Then, in your *custom.css*, make sure that your support "button" styles do
   not make the element seem clickable. Add something like this to the bottom of
   the file:

        .support .user-support:hover {
          background-color: #dbef16;
          color: #000;
          cursor: default;
        }
        .support .user-support:hover label {
          background-color: transparent;
          color: #000;
        }

   Use the background and foreground colors appropriate to your theme. Use your
   browser's inspector tool to get the colors of the unhovered state of the 
   button.
