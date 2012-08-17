from django.forms import CharField
from django.forms import IPAddressField
from django.forms import ModelForm
from .models import KEY_SIZE
from .models import ApiKey
from .models import generate_unique_api_key


class ApiKeyForm(ModelForm):
    """
    Generate a random API key if one isn't provided.
    """

    class Meta:
        model = ApiKey

    key = CharField(max_length=KEY_SIZE, required=False,
                    help_text=u'If not provided, a random key will be generated.')

    logged_ip = IPAddressField(required=False)

    def clean(self):
        apikey = self.cleaned_data.get('key') or ''
        if not apikey:
            # 'key' is required, but we want to allow generating it
            # server-side.  so we remove its errors if it's not
            # provided.  Note that we can't just define
            # self.clean_key() because that's never called if the key
            # isn't provided.
            self._errors.pop('key', None)
            apikey = generate_unique_api_key()
            self.cleaned_data['key'] = apikey
            if hasattr(self, 'clean_key'):
                # NOW we can call this...
                self.cleaned_data['key'] = self.clean_key()

        # For logged IP, convert blank to NULL
        self.cleaned_data['logged_ip'] = self.cleaned_data.get('logged_ip') or None
        return self.cleaned_data
