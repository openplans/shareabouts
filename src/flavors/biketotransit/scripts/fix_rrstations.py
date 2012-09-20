#!/usr/bin/env python
#-*- coding:utf-8 -*-

import csv
import logging
import shareabouts
import sys

logging.basicConfig(level='DEBUG')

def main(api_key):
    api = shareabouts.ShareaboutsApi('http://shareaboutsapi-civicworks.dotcloud.com/api/v1/')
    api.authenticate_with_key(api_key)
    dataset = 'biketotransit'
    owner = 'biketotransit'

    railstations_url = api.build_uri('place_collection', username=owner,
                                     dataset_slug=dataset)

    railstations = api.get(railstations_url)
    for station in railstations:
        changed = False

        if station['station'] not in (station['name'], station['name'][:-8]):
            station['label'] = station['name']
            station['name'] = station['station'] + ' Station'
            changed = True

        if station['name'].endswith('Center Station'):
            station['name'] = station['name'][:-8]
            changed = True

        if station['location_type'] == 'Subway-Elavated':
            station['location_type'] = 'Subway-Elevated'
            changed = True

        if station.get('zone_') == 'na':
            station.pop('zone_')
            changed = True

        if changed:
            # These are special fields.  This needs to be handled more gracefully.
            station.pop('created_datetime')
            station.pop('updated_datetime')
            station.pop('dataset')
            station.pop('id')
            station.pop('submissions')

            response = api.send('PUT', url=station.pop('url'), data=station)


if __name__ == '__main__':
    api_key = sys.argv[1]
    sys.exit(main(api_key))
