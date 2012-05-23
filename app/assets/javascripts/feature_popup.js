(function(S){
  S.FeaturePopup = function(o) {
    var options = $.extend({}, o),
        self = {};

    // Bind Events

    // TODO: this has a dependency on options.popup/InformationPanel. Since we
    // are planning to decouple this from the Map, we can get rid of the popup
    // object completely and simpify this code.

    // Register click event within InformationPanel
    options.popup.addClickEventListener('form#new_feature_point input:submit', function(mouseEvent, target){
      var $form = $(mouseEvent.target).closest('form');

      // Send form data and url
      // TODO: serialize the form to an object literal instead of passing a
      // jQuery object of the form
      $(S).trigger('submitNewFeature', [$form, $form.attr('action')]);
    });

    // Register click event within InformationPanel
    var throttledVoteCallback = (function() {
      var done = true;
      return function(mouseEvent, target){
        if (done) {
          done = false;
          var $form = $(mouseEvent.target).closest('form'),
              $button = $('button', $form),
              $label = $('.vote-label', $form),
              votes = parseInt($label.text(), 10);

          // Update the state of the button right away
          $button.is('.supported') ? votes-- : votes++;
          $button.toggleClass('supported');
          $label.text(votes);

          $.post( $form.attr('action'), $form.serialize(), function(data) {
            options.popup.setContent(data.view);
          },
          'json').complete(function() { done = true; });
        }
      };
    })();
    options.popup.addClickEventListener('form[data-behavior=load_result_in_popup] :submit', throttledVoteCallback);

    // Focus the permalink text on focus
    $(document).on('focus', '.copy-link', function(){
      this.select();
    });

    // Show the permalink and allow it to be copied
    $(document).on('click', '.link', function(e){
      var $input = $('.copy-link');

      $input.toggle();
      if($input.is(':visible')) {
        $input.focus();
      }

      e.preventDefault();
    });

    // Show the hidden comment form
    $('.reply-link').live('click', function(e) {
      $('#reply').removeClass('hide');
    });

    return self;
  };
})(Shareabouts);