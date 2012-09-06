#!/bin/sh

# libevent development files are required for gevent
sudo apt-get install libevent-dev

# Install GeoDjango dependencies -- see
# https://docs.djangoproject.com/en/dev/ref/contrib/gis/install/#ubuntu
sudo apt-get install binutils gdal-bin libproj-dev postgresql-9.1-postgis \
     postgresql-server-dev-9.1 python-psycopg2

# Install the python requirements
sudo pip install -r requirements.txt

# ... and this, optional testing stuff
sudo pip install coverage

# Create a PostGIS template database
psql -c "CREATE DATABASE template_postgis;" -U postgres
psql -c "UPDATE pg_database SET datistemplate='true' WHERE datname='template_postgis';" -U postgres
createlang plpgsql template_postgis -U postgres
# Loading the PostGIS SQL routines
psql -d template_postgis -f /usr/share/postgresql/9.1/contrib/postgis-1.5/postgis.sql -q
psql -d template_postgis -f /usr/share/postgresql/9.1/contrib/postgis-1.5/spatial_ref_sys.sql -q
# Enabling users to alter spatial tables.
psql -d template_postgis -c "GRANT ALL ON geometry_columns TO PUBLIC;"
psql -d template_postgis -c "GRANT ALL ON geography_columns TO PUBLIC;"
psql -d template_postgis -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"

# Initialize the database
psql -U postgres <<EOF
    CREATE USER shareabouts WITH PASSWORD 'shareabouts';
    CREATE DATABASE shareabouts_v2 WITH TEMPLATE = template_postgis;
    GRANT ALL ON DATABASE template_postgis TO shareabouts;
    GRANT ALL ON DATABASE shareabouts_v2 TO shareabouts;
    ALTER USER shareabouts WITH CREATEDB;
EOF

# Initialize the project settings
cp src/project/local_settings.py.template src/project/local_settings.py
