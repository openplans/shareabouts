/*globals Backbone _ jQuery Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console) {
    // Handlebars support for Marionette
  Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
  };

  S.PlaceListItemView = Backbone.Marionette.Layout.extend({
    template: '#place-detail',
    tagName: 'li',
    className: 'clearfix',
    regions: {
      support: '.support'
    },
    initialize: function() {
      var supportType = S.Config.support.submission_type;

      this.model.submissionSets[supportType] = this.model.submissionSets[supportType] ||
        new S.SubmissionCollection(null, {
          submissionType: supportType,
          placeModel: this.model
        });

      this.listenTo(this.model, 'show', this.show);
      this.listenTo(this.model, 'hide', this.hide);
    },
    onRender: function(evt) {
      this.support.show(new S.SupportView({
        collection: this.model.submissionSets[S.Config.support.submission_type],
        supportConfig: S.Config.support,
        userToken: S.Config.userToken
      }));
    },
    show: function() {
      this.$el.show();
    },
    hide: function() {
      this.$el.hide();
    }
  });

  S.PlaceListView = Backbone.Marionette.CompositeView.extend({
    template: '#place-list',
    itemView: S.PlaceListItemView,
    itemViewContainer: '.place-list',
    ui: {
      searchField: '#list-search',
      searchForm: '.list-search-form'
    },
    events: {
      'input @ui.searchField': 'handleSearchInput',
      'submit @ui.searchForm': 'handleSearchSubmit'
    },
    handleSearchInput: function(evt) {
      evt.preventDefault();
      this.filter(this.ui.searchField.val());
    },
    handleSearchSubmit: function(evt) {
      evt.preventDefault();
      this.filter(this.ui.searchField.val());
    },
    filter: function(term) {
      var len = S.Config.place.items.length,
          val, key, i;

      term = term.toUpperCase();
      this.collection.each(function(model) {
        var show = false;
        for (i=0; i<len; i++) {
          key = S.Config.place.items[i].name;
          val = model.get(key);
          if (_.isString(val) && val.toUpperCase().indexOf(term) !== -1) {
            show = true;
            break;
          }
        }

        if (show) {
          model.trigger('show');
        } else {
          model.trigger('hide');
        }
      });
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
