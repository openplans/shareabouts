$.widget("ui.ticker", (function() {
  return {
    options : {
      url       : "",   // should return HTML of lis, like "<li>thing</li><li>thing2</li>"
      frequency : 30000, // ms between checking for new items
      limit     : 10    // max number of items to add each refresh
    },
  
    /**
     * Constructor
     */
    _create : function() {
      var self = this;
      
      this.expando = $( "<a>" ).attr("href", "#").text("toggle");
      this.toolbar = $( "<div>" ).text("What's happening").append( this.expando ).appendTo( this.element );
      this.list    = $( "<ul>" ).appendTo( this.element );
      
      this.expando.click(function(click) { 
        click.preventDefault();
        self._trigger("toggle");
      });
      
      this.refresh();
      this._trigger("toggle"); // Display the ticker
    },
    
    refresh : function(utc) {
      var self = this;

      $.ajax({
        type : 'GET',
        url  : this.options.url,
        data : {utc:utc, limit:this.options.limit}, 
        complete : function(data, status){
          self.list.prepend(data.responseText);
          
          var utc  = (new Date()).getTime();
              
          self.timeout = window.setTimeout(function(){
            self.refresh(utc);
          }, self.options.frequency);
        }, 
        dataType: "html"
      });
    }
  };
})());