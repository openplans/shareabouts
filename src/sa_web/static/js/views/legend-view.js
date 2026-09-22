/*globals jQuery _ Backbone Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  'use strict';

  S.LegendItemView = Backbone.View.extend({
    events: {
      'click': 'onClick'
    },

    initialize: function(options) {
      this.options = options || {};
      this.type = String(this.options.type);
      this.legendConfig = this.options.legendConfig || {};
      this.router = this.options.router;
      this.selectedType = this.options.selectedType || null;

      if (this.collection) {
        this.listenTo(this.collection, 'add remove reset', this.updateCount);
      }
      this.updateCount();
      this.setSelected(this.selectedType);
    },

    getCount: function() {
      if (!this.collection) {
        return 0;
      }
      var self = this;
      return this.collection.filter(function(place) {
        return String(place.get('location_type')) === self.type;
      }).length;
    },

    updateCount: function() {
      if (this.legendConfig.show_counts !== false) {
        var count = this.getCount();
        this.$('.legend-count').text(count);
      }
    },

    setSelected: function(selectedType) {
      this.selectedType = selectedType;
      var isSelected = Boolean(selectedType && selectedType !== 'all' && String(this.type) === String(selectedType));

      if (!selectedType || selectedType === 'all') {
        this.$el.removeClass('deselected is-selected');
        this.$el.attr('href', '/filter/' + this.type);
      } else if (isSelected) {
        this.$el.removeClass('deselected').addClass('is-selected');
        this.$el.attr('href', '/filter/all');
      } else {
        this.$el.addClass('deselected').removeClass('is-selected');
        this.$el.attr('href', '/filter/' + this.type);
      }
    },

    onClick: function(evt) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      if (this.legendConfig.filter_places === false) {
        return false;
      }

      var router = this.router || (this.options && this.options.router) || window.app;
      var isAlreadySelected = (this.selectedType && String(this.selectedType) === String(this.type)) || this.$el.hasClass('is-selected');
      var targetRoute = isAlreadySelected ? '/filter/all' : ('/filter/' + this.type);

      if (router && router.navigate) {
        router.navigate(targetRoute, {trigger: true});
      } else if (Backbone.history) {
        Backbone.history.navigate(targetRoute, {trigger: true});
      }

      return false;
    }
  });

  S.LegendView = Backbone.View.extend({
    tagName: 'section',
    className: 'legend-container',

    events: {
      'click .legend-toggle': 'onToggleClick'
    },

    initialize: function(options) {
      this.options = options || {};
      this.placeTypes = this.options.placeTypes || {};
      this.legendConfig = this.options.legendConfig || {};
      this.router = this.options.router;
      this.itemViews = [];
      this.selectedType = null;
    },

    getTemplateData: function() {
      var self = this;
      var placeTypesData = [];
      _.each(this.placeTypes, function(config, type) {
        var count = 0;
        if (self.collection) {
          count = self.collection.filter(function(place) {
            return String(place.get('location_type')) === String(type);
          }).length;
        }
        placeTypesData.push({
          type: type,
          label: config.label || type,
          count: count,
          color: config.color
        });
      });

      return {
        collapsible: this.legendConfig.collapsible !== false,
        show_counts: this.legendConfig.show_counts !== false,
        placeTypes: placeTypesData
      };
    },

    render: function() {
      var self = this;

      _.each(this.itemViews, function(view) {
        view.remove();
      });
      this.itemViews = [];

      var template = Handlebars.templates['legend'];
      if (template) {
        this.$el.html(template(this.getTemplateData()));
      }

      var isOpen = this.$('.legend-wrapper').hasClass('open') || this.$el.hasClass('open');
      this.$('.legend-toggle').attr('aria-expanded', isOpen ? 'true' : 'false');

      this.$('.legend-item').each(function() {
        var $item = $(this);
        var type = $item.attr('data-place-type') || $item.data('place-type');
        var itemView = new S.LegendItemView({
          el: this,
          type: type,
          collection: self.collection,
          router: self.router,
          legendConfig: self.legendConfig,
          selectedType: self.selectedType
        });
        self.itemViews.push(itemView);
      });

      return this;
    },

    onToggleClick: function(evt) {
      if (evt) {
        evt.preventDefault();
      }
      this.toggle();
    },

    toggle: function() {
      if (this.legendConfig.collapsible !== false) {
        var $wrapper = this.$('.legend-wrapper');
        var isOpen;
        if ($wrapper.length) {
          $wrapper.toggleClass('open');
          isOpen = $wrapper.hasClass('open');
        } else {
          this.$el.toggleClass('open');
          isOpen = this.$el.hasClass('open');
        }
        this.$('.legend-toggle').attr('aria-expanded', isOpen ? 'true' : 'false');
      }
    },

    setSelectedType: function(type) {
      this.selectedType = (!type || type === 'all') ? null : type;
      _.each(this.itemViews, function(itemView) {
        itemView.setSelected(this.selectedType);
      }, this);
    },

    filter: function(type) {
      this.setSelectedType(type);
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
