#!/usr/bin/env python
#-*- coding:utf-8 -*-

import logging
import shareabouts
import sys

logging.basicConfig(level='DEBUG')

def main(api_key):
#    api = shareabouts.ShareaboutsApi('http://shareaboutsapi-civicworks.dotcloud.com/api/v1/')
    api = shareabouts.ShareaboutsApi('http://localhost:8000/api/v1/')
    api.authenticate_with_key(api_key)
    dataset = 'biketotransit'
    owner = 'biketotransit'

    user_responses_uri = api.build_uri('all_submissions', username=owner,
                                       dataset_slug=dataset, type='surveys') + '?visible=all'

    user_responses = api.get(user_responses_uri)
    for user_response in user_responses:
        changed = False

        if not user_response['visible']:
            user_response['visible'] = True
            changed = True

        if changed:
            # These are special fields.  This needs to be handled more gracefully.
            user_response.pop('created_datetime')
            user_response.pop('updated_datetime')
            user_response.pop('dataset')
            user_response.pop('id')

            response = api.send('PUT', url=user_response.pop('url'), data=user_response)


if __name__ == '__main__':
    api_key = sys.argv[1]
    sys.exit(main(api_key))
