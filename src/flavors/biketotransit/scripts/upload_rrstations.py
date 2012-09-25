#!/usr/bin/env python
#-*- coding:utf-8 -*-

import csv
import logging
import shareabouts
import sys

logging.basicConfig(level='DEBUG')

def main(api_key):
    api = shareabouts.ShareaboutsApi('http://api.shareabouts.org/api/v1/')
    api.authenticate_with_key(api_key)
    dataset = 'biketotransit'
    owner = 'biketotransit'

    railstations_url = api.build_uri('place_collection', username=owner,
                                     dataset_slug=dataset)

    with open('transpo-centers.csv') as railstationsfile:
        headers = None
        reader = csv.reader(railstationsfile)
        for row in reader:
            if headers is None:
                headers = [header.lower() for header in row]
                continue

            station = dict(zip(headers, row))
            station['location'] = {
                'lat': float(station.pop('lat')),
                'lng': float(station.pop('long'))
            }
            station['name'] = station.get('label')
            station['location_type'] = station.pop('type')
            station['visible'] = True

            response = api.send('POST', url=railstations_url, data=station)


if __name__ == '__main__':
    api_key = sys.argv[1]
    sys.exit(main(api_key))
