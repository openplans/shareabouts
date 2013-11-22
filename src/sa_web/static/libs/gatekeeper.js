/*globals $ */

var Gatekeeper = {};

(function(NS) {

  NS.getInvalidFormEls = function(form) {
    var invalidEls, val;

    invalidEls = $(form).find('input, select, textarea').map(function() {
      // Only validate visible elements
      if ($(this).is(':visible')) {

        // Does it support the validity object?
        if (this.validity) {
          // Add it to the array if it's invalide
          if (!this.validity.valid) {
            return this;
          }
        } else {
          // Strip whitespace from the value
          val = (this.value || '').replace(/\s+/);

          // Manually support 'required' for old browsers
          if (this.hasAttribute('required') && val === '') {
            return this;
          }
        }
      }
    });

    return invalidEls;
  };

  NS.validate = function(form) {
    // Get invalid elements from the form
    var invalidEls = NS.getInvalidFormEls(form);

    // Indicate that this form has been submitted
    $(form).addClass('form-submitted');

    if (invalidEls && invalidEls.length > 0) {
      // Focus on the first invalid element
      invalidEls[0].focus();
      if (invalidEls[0].select) { invalidEls[0].select(); }

      return false;
    }
    return true;
  };

  NS.onValidSubmit = function(success, error) {
    return function(evt) {
      evt.preventDefault();

      if (NS.validate(evt.target)) {
        if (success) {
          success.apply(this, arguments);
        }
      } else {
        if (error) {
          error.apply(this, arguments);
        }
      }
    };
  };
}(Gatekeeper));