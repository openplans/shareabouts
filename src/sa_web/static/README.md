Shareabouts Web map Interface Static Assets
===========================================

Assets in this folder will be available on the server at:

    http://<server_hostname>/static/...

In templates, these addresses can be generated dynamically using:

    {{ STATIC_URL }}

(the template variable `{{ STATIC_URL }}` will always point to the right
folder where static assets are stored)
