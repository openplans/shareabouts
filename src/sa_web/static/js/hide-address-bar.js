var Shareabouts = Shareabouts || {};

(function(S, $, console) {

  /* --------------------------------------------------
    Auto-scrolling to hide mobile address bar 
    via http://menacingcloud.com/?c=iPhoneAddressBar 
    + function to detect orientation change
    FIXME: Should probably also fire on .close-bttn click. 
  -------------------------------------------------- */

  var bodyTag;
  var executionTime = new Date().getTime(); // JavaScript execution time

  $(function() {
    hideAddressBar(true);
  });


  // Hide address bar on devices like the iPhone
  function hideAddressBar(bPad) {

  	// return undefined on big screens...
    if(screen.width > 980 || screen.height > 980) return;

  	// or in full-screen webapp mode... 
    if(window.navigator.standalone === true) return;

  	// or if the page is zoomed in (or vertical scrollbars)...
  	// might be unnecessary for our purposes
    if(window.innerWidth !== document.documentElement.clientWidth) {
      if((window.innerWidth - 1) !== document.documentElement.clientWidth) return;
    }

  	// Pad content if necessary
    if(bPad === true && (document.documentElement.scrollHeight <= document.documentElement.clientHeight)) {
      bodyTag = document.getElementsByTagName('body')[0];
      bodyTag.style.height = document.documentElement.clientWidth / screen.width * screen.height + 'px';
    }

    setTimeout(function() {
  		// Perform autoscroll
      window.scrollTo(0, 1);

  		// Reset body height and scroll
      if(bodyTag !== undefined) bodyTag.style.height = window.innerHeight + 'px';
      window.scrollTo(0, 0);

    }, 1000);

  }

  // Also fire hideAddressBar() on orientation change
  var supportsOrientationChange = "onorientationchange" in window,
      orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

  window.addEventListener(orientationEvent, function() {
      hideAddressBar(true);
  }, false);

})(Shareabouts, jQuery, Shareabouts.Util.console);