"""

Place API
---------

GET /v1/places/
  - should return a list of places
  - each place should have a location

Submission API
--------------

GET /v1/places/:id/:type/
  - should return a list of submissions of the type for the place
  - should return an empty list if the place has no submissions of the type
POST /v1/places/:id/:type/
  - should create a new submission of the given type on the place
  - should create the submission set of the given type if none exists for the place

"""
