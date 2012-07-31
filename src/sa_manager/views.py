from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse
import json
import requests

def index_view(request):
    return render(request, "manager/index.html")


def places_view(request):
    places_uri = request.build_absolute_uri('/v1/places/')

    # TODO Is this the best way to get the API data?
    response = requests.get(places_uri)

    places = json.loads(response.text)
    return render(request, "manager/places.html", {'places': places})


def new_place_view(request):
    places_uri = request.build_absolute_uri('/v1/places/')

    def new(request):
        return render(request, "manager/place.html")

    def create(request):
        # Make a copy of the POST data, since we can't edit the original.
        data = request.POST.dict()

        # Pull out data we don't want to send to the server
        if 'csrfmiddlewaretoken' in data:
            del data['csrfmiddlewaretoken']
        if 'action' in data:
            del data['action']

        # Fix the location to be something the server will understand
        location = {
          'lat': data.get('lat'),
          'lng': data.get('lng')
        }
        del data['lat']
        del data['lng']
        data['location'] = location

        # Fix the visibility to be either true or false (boolean)
        data['visible'] = ('visible' in data)

        # Send the save request
        response = requests.post(places_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})
        if response.status_code == 201:
            data = json.loads(response.text)
            place_id = data.get('id')
            return redirect(reverse('manager_place_detail', args=[place_id]))
        else:
            return HttpResponse(response.text)

    if request.method == 'GET':
        return new(request)
    elif request.method == 'POST':
        return create(request)
    else:
        # TODO 405 on other
        pass


def place_view(request, pk):
    place_uri = request.build_absolute_uri('/v1/places/{0}/'.format(pk))

    def read(request, pk):
        response = requests.get(place_uri)

        place = json.loads(response.text)
        special_fields = ('id', 'location', 'submitter_name', 'name', 'visible',
                          'created_datetime', 'updated_datetime', 'url')
        data_fields = []

        for key, value in place.items():
            if key not in special_fields:
                label = key.replace('_', ' ').title()
                data_fields.append((label, key, value))
        data_fields.sort()

        return render(request, "manager/place.html", {
            'place': place,
            'data_fields': data_fields
        })

    def update(request, pk):
        # Make a copy of the POST data, since we can't edit the original.
        data = request.POST.dict()

        # Pull out data we don't want to send to the server
        if 'csrfmiddlewaretoken' in data:
            del data['csrfmiddlewaretoken']
        if 'action' in data:
            del data['action']

        # Fix the location to be something the server will understand
        location = {
          'lat': data.get('lat'),
          'lng': data.get('lng')
        }
        del data['lat']
        del data['lng']
        data['location'] = location

        # Fix the visibility to be either true or false (boolean)
        data['visible'] = ('visible' in data)

        # Send the save request
        response = requests.put(place_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})
        if response.status_code == 200:
            return redirect(request.get_full_path())
        else:
            return HttpResponse(response.text)


    def delete(request, pk):
        # Send the delete request
        response = requests.delete(place_uri)
        if response.status_code == 204:
            return redirect(reverse('manager_place_list'))
        else:
            return HttpResponse(response.text)


    if request.method == 'GET':
        return read(request, pk)
    elif request.method == 'POST':
        if request.POST.get('action') == 'save':
            return update(request, pk)
        elif request.POST.get('action') == 'delete':
            return delete(request, pk)
        else:
            # TODO ???
            pass
    else:
        # TODO 405 on other
        pass
