#!/bin/sh

# libevent development files are required for gevent
sudo apt-get install libevent-dev

# Install the python requirements
sudo pip install -r requirements.txt
