#!/bin/sh

# libevent development files are required for gevent
sudo apt-get install libevent-dev

# Install the python requirements
sudo pip install -r requirements.txt

# Initialize the project settings
cp src/project/local_settings.py.template src/project/local_settings.py

# Install Jasmine dependencies
bundle install --gemfile="src/sa_web/jasmine/Gemfile"
