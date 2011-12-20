/*mjuniper 06/21/2011
    based on code from:

http://www.flexmls.com/developers/2011/04/13/

ipad-and-single-finger-scrolling-in-flexmls/
    and http://www.learningjquery.com/2007/10/a-plugin-development-pattern
*/
//
// create closure
//
(function ($) {
    //
    // plugin definition
    //
    $.fn.mobileScroll = function (options) {
        //only do it for iOS devices
        var userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('ipad') > -1 ||
                userAgent.indexOf('iphone') > -1) {
            this.bind('touchstart', function (evt) {
                var e = evt.originalEvent;
                startY = e.touches[0].pageY;
                startX = e.touches[0].pageX;
            });

            this.bind('touchmove', function (evt) {
                //need the touches property of the native dom event
                // - jquery exposes originalEvent for that
                var e = evt.originalEvent;
                var touches = e.touches[0];
                //cache $(this)
                var $this = $(this);

                // override the touch event’s normal functionality
                e.preventDefault();

                // y-axis
                var touchMovedY = startY - touches.pageY;
                startY = touches.pageY; // reset startY for the next call
                $this.scrollTop($this.scrollTop() + touchMovedY);

                // x-axis
                // var touchMovedX = startX - touches.pageX;
                // startX = touches.pageX; // reset startX for the next call
                // $this.scrollLeft($this.scrollLeft() + touchMovedX);
            });
        }

        return this;
    };
    //
    // end of closure
    //
})(jQuery);