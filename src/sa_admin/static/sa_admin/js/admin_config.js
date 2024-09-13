import {
  formatExact,
  formatDatetime,
  formatBoolean,
} from './formatters.js';

import {
  PlaceFieldBooleanWidget,
  PlaceFieldChoiceWidget,
  PlaceFieldDateTimeWidget,
  PlaceFieldReadOnlyWidget,
  PlaceFieldLongTextWidget,
} from './place_field_widget.js';

import {
  PlacesBooleanFilter,
  PlacesChoiceFilter,
  PlacesDateTimeFilter,
  PlacesSubstringFilter,
} from './places_filter.js';

export const fields = [
  {
    attr: 'id',
    label: 'id',
    format: (value) => `<a target="_blank" href="/place/${value}">${value}</a>`,
    widget: PlaceFieldReadOnlyWidget,
  },
  {
    attr: 'created_datetime',
    label: 'created_datetime',
    format: formatDatetime,
    widget: PlaceFieldDateTimeWidget,
    filter: PlacesDateTimeFilter,
  },
  ...Shareabouts.Config.place.items.map((field) => {
    //   attr: 'location_type',
    //   label: 'location_type',
    //   format: formatExact,
    //   options: Shareabouts.Config.place.items.find(item => item.name === 'location_type').options,
    //   widget: PlaceFieldChoiceWidget,
    //   filter: PlacesChoiceFilter,
    const adminFieldOptions = {
      attr: field.name,
      label: field.name,
      format: formatExact,
    };

    if (field.type === 'select' || field.type === 'radiogroup' || field.type === 'checkboxgroup') {
      adminFieldOptions.options = field.options;
      adminFieldOptions.widget = PlaceFieldChoiceWidget;
      adminFieldOptions.filter = PlacesChoiceFilter;
    }
    else {
      adminFieldOptions.widget = PlaceFieldLongTextWidget;
      adminFieldOptions.filter = PlacesSubstringFilter
    }

    return adminFieldOptions;
  }),
  // {
  //   attr: 'submission_language_code',
  //   label: 'submission_language_code',
  //   format: formatExact,
  //   options: Shareabouts.Config.languages.map(lang => ({ value: lang.code, label: lang.code })),
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  // {
  //   attr: 'city_wide',
  //   label: 'city_wide',
  //   format: formatBoolean,
  //   widget: PlaceFieldBooleanWidget,
  //   filter: PlacesBooleanFilter,
  // },
  // {
  //   attr: 'location',
  //   label: 'location',
  //   format: formatExact,
  //   widget: PlaceFieldLongTextWidget,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'neighborhood',
  //   label: 'neighborhood',
  //   format: formatExact,
  //   options: Shareabouts.Config.place.items.find(i => i.name == 'submitter_neighborhood').options,
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  // {
  //   attr: 'description',
  //   label: 'description',
  //   format: formatExact,
  //   widget: PlaceFieldLongTextWidget,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'benefit',
  //   label: 'benefit',
  //   format: formatExact,
  //   widget: PlaceFieldLongTextWidget,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'location_type',
  //   label: 'location_type',
  //   format: formatExact,
  //   options: Shareabouts.Config.place.items.find(item => item.name === 'location_type').options,
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  // {
  //   attr: 'submission_event_type',
  //   label: 'submission_event_type',
  //   format: formatExact,
  //   options: Shareabouts.Config.place.items.find(i => i.name == 'submission_event_type').options,
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  // {
  //   attr: 'private_submitter_name_first',
  //   label: 'private_submitter_name_first',
  //   format: formatExact,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'private_submitter_name_last',
  //   label: 'private_submitter_name_last',
  //   format: formatExact,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'submitter_name',
  //   label: 'submitter_name',
  //   format: formatExact,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'submitter_neighborhood',
  //   label: 'submitter_neighborhood',
  //   format: formatExact,
  //   options: Shareabouts.Config.place.items.find(i => i.name == 'submitter_neighborhood').options,
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  // {
  //   attr: 'private_submitter_zipcode',
  //   label: 'private_submitter_zipcode',
  //   format: formatExact,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'private_submitter_email',
  //   label: 'private_submitter_email',
  //   format: formatExact,
  //   filter: PlacesSubstringFilter,
  // },
  // {
  //   attr: 'private_submitter_language',
  //   label: 'private_submitter_language',
  //   format: formatExact,
  //   options: Shareabouts.Config.place.items.find(i => i.name == 'private_submitter_language').options,
  //   widget: PlaceFieldChoiceWidget,
  //   filter: PlacesChoiceFilter,
  // },
  {
    attr: 'user_token',
    label: 'user_token',
    format: formatExact,
    widget: PlaceFieldReadOnlyWidget,
    filter: PlacesSubstringFilter,
  },
  {
    attr: 'visible',
    label: 'visible',
    format: formatBoolean,
    widget: PlaceFieldBooleanWidget,
    filter: PlacesBooleanFilter,
  },
];
