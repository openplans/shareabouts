$.widget("ui.ticker", (function() {
  return {
    options : {
      url       : "",    // should return HTML of lis, like "<li>thing</li><li>thing2</li>"
      frequency : 30000, // ms between checking for new items
      limit     : 30,    // max number of items to add each refresh
      infinite  : true,  // ticker loads previous items in when scrolled to the bottom
      bottomPixels : 50, // how far from the bottom we are when we pull for more items in infinite scroll
      onclick   : null   // callback for when someone clicks the link (ie. prevent page from reloading and do something else)
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
        this.loader = $("<li>").addClass("loading");
        this.list.append( this.loader );
        this.element.on("scroll", {thisContext:this}, this._handleScroll );
      }

      // Bind click event for the ticker links
      this.list.on('click', 'li > a', function(e) {
        if (self.options.onclick) {
          e.preventDefault();
          self.options.onclick.apply(this, arguments);
        }
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
          self.list.prepend(data.responseText);

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
            $(data.responseText).insertBefore( self.loader );
            self.loading = false;
          },
          dataType: "html"
        });
      }
    }
  };
})());