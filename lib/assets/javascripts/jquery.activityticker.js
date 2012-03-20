if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

$.widget("ui.activityticker", (function() {
  return {
    options : {
      url          : "",    // should return HTML of lis, like "<li>thing</li><li>thing2</li>"
      frequency    : 30000, // ms between checking for new items
      limit        : 30,    // max number of items to add each refresh
      infinite     : true,  // ticker loads previous items in when scrolled to the bottom
      bottomPixels : 50, // how far from the bottom we are when we pull for more items in infinite scroll
      loaderClass  : 'loading' // class name for li that holds the spinner, for infinite tickers
    },

    /**
     * Constructor
     */
    _create : function() {
      var self = this;

      this.list = $( "<ul>" ).appendTo( this.element );
      this.refresh();
      this._trigger("toggle"); // Display the ticker

      if (this.options.infinite) {
        this.loader = $("<li>").addClass(this.options.loaderClass).spin({lines:6,length:4,width:2,radius:5,color:"#fff"});
        this.list.append( this.loader );
        this.element.on("scroll", {thisContext:this}, this._handleScroll );
      }

      // Bind click event for the ticker links
      this.list.on('click', 'li > a', function(e) {
        self._trigger('click', e, {
          featureId: parseInt($(this).parent('li').attr('data-feature-id'), 10)
        });
      });
    },

    /**
     * Periodic refresh at top
     */
    refresh : function(activity_id) {
      var self = this;

      $.ajax({
        type : 'GET',
        url  : this.options.url,
        data : {after:activity_id, limit:this.options.limit},
        complete : function(data, status){
          self._handleResponse( data.responseText, function(){ self.list.prepend(data.responseText) } );

          self.loadedInitially = true; // to prevent infinite scroll when nothing's loaded

          var after_id = self.list.find("li:first").data("id");

          self.timeout = window.setTimeout(function(){
            self.refresh(after_id);
          }, self.options.frequency);
        },
        dataType: "html"
      });
    },

    /**
     * Infinite scroll refresh at bottom
     */
    _handleScroll : function(eventData) {
      var self = eventData.data.thisContext;

      if (self.loading || !self.loadedInitially) return;

      var isScrollable = (self.list.height() - self.element.height() <= self.element.scrollTop() + self.options.bottomPixels);

      if (isScrollable) {
        self.loading = true; // to prevent pulling for infinite scroll more than once at a time

        var prevId   = self.loader.prev().data("id");

        $.ajax({
          type     : 'GET',
          url      : self.options.url,
          data     : {before:prevId, limit:self.options.limit},
          complete : function(data, status) {
            self._handleResponse( data.responseText, function(){ $(data.responseText).insertBefore( self.loader ) } );
            self.loading = false;
          },
          dataType: "html"
        });
      }
    },

    /**
     * Handles the response from the ajax call.
     * If there is data, insert it via callback.
     * If not, or if all the data is not as tall as the list, disable infinite scroll.
     * @param {String} data text to load into the activity ticker
     * @param {Function} callback function to call which inserts the data into the ticker
     */
    _handleResponse : function(data, callback) {
      if (data.trim().length > 0) callback();
      else this._disableScroll();

      if (!this._canScroll()) this._disableScroll();
    },

    /**
     * Unbinds the scroll handler and hides the spinner item.
     */
    _disableScroll : function() {
      this.list.find('li.' + this.options.loaderClass).hide();
      this.element.unbind("scroll");
    },

    /**
     * Returns true if the list extends beyond the height of the container.
     */
    _canScroll : function() {
      return(this.list.height() - this.element.height() > 0);
    }
  };
})());