#!/bin/sh
export DRCC_SITE_URL=$(<siteurl.txt)
echo $DRCC_SITE_URL
export DRCC_SITE_KEY=$(<sitekey.txt)
echo $DRCC_SITE_KEY
