#!/bin/sh
# Initialize the project settings
cp src/project/local_settings.py.template src/project/local_settings.py

# Install Jasmine dependencies
bundle install --gemfile="src/sa_web/jasmine/Gemfile"
