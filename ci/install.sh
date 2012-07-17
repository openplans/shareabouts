#!/bin/sh

# libevent development files are required for gevent
sudo apt-get install libevent-dev

# Install GeoDjango dependencies -- see
# https://docs.djangoproject.com/en/dev/ref/contrib/gis/install/#ubuntu
sudo apt-get install binutils gdal-bin libproj-dev postgresql-9.1-postgis \
     postgresql-server-dev-9.1 python-psycopg2

# Install the python requirements
sudo pip install -r requirements.txt

# Create a PostGIS template database
psql -c "CREATE DATABASE template_postgis;" -U postgres
createlang plpgsql template_postgis -U postgres
psql -d template_postgis -f /usr/share/postgresql/9.1/contrib/postgis-1.5/postgis.sql -q
psql -d template_postgis -f /usr/share/postgresql/9.1/contrib/postgis-1.5/spatial_ref_sys.sql -q

# Initialize the database
psql -U postgres <<EOF
    CREATE USER shareabouts WITH PASSWORD 'shareabouts';
    ALTER USER shareabouts WITH CREATEDB;
    CREATE DATABASE shareabouts_v1 TEMPLATE template_postgis;
    GRANT ALL ON DATABASE shareabouts_v1 TO shareabouts;
EOF

# Initialize the project settings
cp src/project/local_settings.py.template src/project/local_settings.py
