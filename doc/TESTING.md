To run the python tests
============================

    src/manage.py test sa_web


To test the JavaScript via Jasmine
====================================

First you need Ruby installed, ideally with RVM.
Next:

    bundle install --gemfile="src/sa_web/jasmine/Gemfile"

Then run the tests:

    cd src/sa_web/jasmine
    bundle exec rake jasmine:ci

