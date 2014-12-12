def run():
    from sa_api_v2.models import DataSet, User, KeyPermission
    from sa_api_v2.apikey.models import ApiKey
    import os

    username = os.environ.get('SHAREABOUTS_DATASET_USERNAME', 'demo-user')
    slug = os.environ.get('SHAREABOUTS_DATASET_SLUG', 'demo-data')
    key = os.environ.get('SHAREABOUTS_DATASET_KEY', 'NTNhODE3Y2IzODlmZGZjMWU4NmU3NDhj')

    user, created = User.objects.get_or_create(username=username)
    ds, created = DataSet.objects.get_or_create(owner=user, slug=slug)
    key, created = ApiKey.objects.get_or_create(dataset=ds, key=key)

    if created:
        key.permissions.add(KeyPermission(submission_set='places', can_retrieve=True, can_create=True, can_update=False, can_destroy=False))
        key.permissions.add(KeyPermission(submission_set='comments', can_retrieve=True, can_create=True, can_update=False, can_destroy=False))
        key.permissions.add(KeyPermission(submission_set='supports', can_retrieve=True, can_create=True, can_update=False, can_destroy=True))
