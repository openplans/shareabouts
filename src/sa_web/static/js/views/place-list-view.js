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
    modelEvents: {
      'show': 'show',
      'hide': 'hide'
    },
    initialize: function() {
      var supportType = S.Config.support.submission_type;

      this.model.submissionSets[supportType] = this.model.submissionSets[supportType] ||
        new S.SubmissionCollection(null, {
          submissionType: supportType,
          placeModel: this.model
        });

      this.supportView = new S.SupportView({
        collection: this.model.submissionSets[S.Config.support.submission_type],
        supportConfig: S.Config.support,
        userToken: S.Config.userToken
      });
    },
    onRender: function(evt) {
      this.support.show(this.supportView);
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
      searchForm: '.list-search-form',
      allSorts: '.list-sort-menu a',
      dateSort: '.date-sort',
      surveySort: '.survey-sort',
      supportSort: '.support-sort'
    },
    events: {
      'input @ui.searchField': 'handleSearchInput',
      'submit @ui.searchForm': 'handleSearchSubmit',
      'click @ui.dateSort': 'handleDateSort',
      'click @ui.surveySort': 'handleSurveyCountSort',
      'click @ui.supportSort': 'handleSupportCountSort'
    },
    initialize: function(options) {
      // Init the views cache
      this.views = {};
    },
    onAfterItemAdded: function(view) {
      // Cache the views as they are added
      this.views[view.model.cid] = view;
    },
    renderList: function() {
      // A faster alternative to this._renderChildren. _renderChildren always
      // discards and recreates a new ItemView. This simply rerenders the
      // cached views.
      var $itemViewContainer = this.getItemViewContainer(this);
      $itemViewContainer.empty();
      this.collection.each(function(model) {
        $itemViewContainer.append(this.views[model.cid].$el);
        // Delegate the events so that the subviews still work
        this.views[model.cid].supportView.delegateEvents();
      }, this);
    },
    handleSearchInput: function(evt) {
      evt.preventDefault();
      this.filter(this.ui.searchField.val());
    },
    handleSearchSubmit: function(evt) {
      evt.preventDefault();
      this.filter(this.ui.searchField.val());
    },
    handleDateSort: function(evt) {
      evt.preventDefault();

      this.dateSort();

      this.ui.allSorts.removeClass('is-selected');
      this.ui.dateSort.addClass('is-selected');
    },
    handleSurveyCountSort: function(evt) {
      evt.preventDefault();

      this.surveyCountSort();

      this.ui.allSorts.removeClass('is-selected');
      this.ui.surveySort.addClass('is-selected');
    },
    handleSupportCountSort: function(evt) {
      evt.preventDefault();

      this.supportCountSort();

      this.ui.allSorts.removeClass('is-selected');
      this.ui.supportSort.addClass('is-selected');
    },

    dateSort: function() {
      this.sort(function(a, b) {
        if (a.get('created_datetime') > b.get('created_datetime')) {
          return -1;
        } else {
          return 1;
        }
      });

      this.ui.allSorts.removeClass('is-selected');
      this.ui.dateSort.addClass('is-selected');
    },
    surveyCountSort: function() {
      this.sort(function(a, b) {
        var submissionA = a.get('submission_sets')[S.Config.survey.submission_type],
            submissionB = b.get('submission_sets')[S.Config.survey.submission_type],
            aCount = submissionA ? submissionA.length : 0,
            bCount = submissionB ? submissionB.length : 0;

        if (aCount > bCount) {
          return -1;
        } else {
          return 1;
        }
      });
    },
    supportCountSort: function() {
      this.sort(function(a, b) {
        var submissionA = a.get('submission_sets')[S.Config.support.submission_type],
            submissionB = b.get('submission_sets')[S.Config.support.submission_type],
            aCount = submissionA ? submissionA.length : 0,
            bCount = submissionB ? submissionB.length : 0;

        if (aCount > bCount) {
          return -1;
        } else {
          return 1;
        }
      });
    },

    sort: function(comparator) {
      this.collection.comparator = comparator;
      this.collection.sort();
      this.renderList();
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
