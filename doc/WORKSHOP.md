Notes for a 90 minute workshop on using Shareabouts - we're covering a lot of material today. 

- [What is Shareabouts?](#)
	- [A brief history of Shareabouts](#a-brief-history-of-shareabouts)
	- [Why you might use it](#why-you-might-use-it)
	- [Strengths of Shareabouts](#strengths-of-shareabouts)
	- [Very important considerations in designing your map](#very-important-considerations-in-designing-your-map)
- [The structure of a Shareabouts map](#the-structure-of-a-shareabouts-map)
- [Configuration](#configuration)
	- [Up front work you need to do](#up-front-work-you-need-to-do)
	- [Setting up a map](#setting-up-a-map-1)
	- [Where's my data?](#wheres-my-data)
- [Further assistance](#help)

## What is Shareabouts?

### A brief history of Shareabouts

NYC DOT bike share map ([this is the latest version](http://nycbikeshare.herokuapp.com/)). 
[DOT's report on how it was useful in planning bike share](http://www.nyc.gov/html/dot/downloads/pdf/bike-share-outreach-report.pdf).

Recent successful projects:
* Participatory budgeting
* Street safety mapping
* Ideas for better places
* Bike parking requests

### Why you might use it
* gathering data about current conditions, desires, specific requests
* gathering point data 
* gathering feedback on existing places (e.g. potential locations for bike share, land use parcels)
* engaging a community - supports commenting, discussion

What makes a good collaborative map?
* a strong call to action, in sync with user needs
* a few questions, mostly multiple choice
* good icons, good basemap
* limited text, with more info available if you want it
* not a lot of jargon, instructions, upfront demands

### Strengths of Shareabouts 

Why it's good
* great interface for collecting point data
* very flexible forms
* good on small screens
* fast to modify - most set-up is configuration not coding 
* easy to style
* once you know the setup, easy to extend
* github workflow good for collaborating
* open source so your involvement helps others!

It's a sophisticated tool - there is a learning curve, but you can totally handle it without a lot of 
software experience.

Not so good for...
* presenting data for dynamic analysis
* collecting line data
* very large datasets
* complex field work

There are other tools...
* Google Maps / Fusion Tables
* [CartoDB](http://cartodb.com)
* [Mapbox/Tilemill](https://www.mapbox.com/) 
* [Habitat Map](http://habitatmap.org/markers) 
* [Ushahidi/Crowd Map](http://www.ushahidi.com/)
* [Wikimapper](http://wikimapping.com/wordpress/)

### Very important considerations in designing your map

Barriers to access: "planning literacy", language, technology, knowing the map exists.

Why will anyone use your map? 

What's your outreach plan?

How else can people get involved?

What are you doing with the data? 

How will the experience of participating in this planning process be improved by your map?

What happens next, and how will participants know about it? ("closing the loop")

What questions are you asking?

Avoid: text, long surveys, open-ended questions, too many categories.

Not about: consensus, voting, decisions.


## The structure of a Shareabouts map

Web-based - mobile or desktop

Database - the "API server".

Front end - the map application.

Multiple maps can run on one server.

[Diagram and more info](https://github.com/openplans/shareabouts/blob/master/doc/ARCHITECTURE.md).

The database is schema-less -- will store whatever you put in it

Some flexibility with hosting - you can run a complete self-contained setup 
via the [one-click Heroku Button installer](https://github.com/openplans/shareabouts/blob/master/doc/HEROKU_BUTTON.md), 
or just the map application with an existing data server. Mjumbe Poe at [Poe Public](http://about.mjumbepoe.com/) 
can help.

## Configuration

Lots of [really great documentation already](https://github.com/openplans/shareabouts#shareabouts-), 
notes here are just pointers.

A good place to start might be to take an existing Shareabouts map and customize it -- take a look at [some of the recent OpenPlans maps](https://github.com/openplans/s).

### Up front work you need to do

Get set up with 
* [Github](http://github.com)
* [Heroku](http://heroku.com)
* [Other needed tools on your laptop for development](https://github.com/openplans/shareabouts/tree/master/doc#local-setup)
* A text editor

If you have a Windows computer, best to use a Virtual Machine.

Technical workflow:
* set up a map locally, make changes
* push those changes to github
* deploy from github to Heroku
* data goes into the database
* download it for analysis

### Setting up a map

We're going to set up the front-end only.

Follow the instructions here: [local set up](https://github.com/openplans/shareabouts/blob/master/doc/README.md#local-setup).

Then, configure your map: [Local configuration](https://github.com/openplans/shareabouts/blob/master/doc/CONFIG.md) - dataset key, etc. Run it locally to see how the config looks (make changes, repeat).

Deploy!

### Where's my data?

[Ways to see your data](https://github.com/openplans/shareabouts/blob/master/doc/GETTING_YOUR_DATA.md): 
via web-based API, download via a snapshot, log in to moderate. 


## Help!

Discussions site at [community.openplans.org](http://community.openplans.org)

Expert help from Mjumbe Poe at [Poe Public](http://about.mjumbepoe.com/) 

I'm always available via [@fkh](http://twitter.com/fkh).
