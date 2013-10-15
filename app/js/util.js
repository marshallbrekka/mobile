define([], function() {
  function onTouch(element, fn) {
    function touchEnd() {
      removeClassAndEvents();
      fn();
    }
    
    function TouchObj(element) {
      this.element = element;
    }


    function removeClassAndEvents() {
      element.removeClass("touch-start");
      element.unbind("touchend", touchEnd);
      element.unbind("touchmove", removeClassAndEvents);
    }
    
    element.bind("touchstart", function(e) {
      element.addClass("touch-start");
      element.bind("touchend", touchEnd);
      element.bind("touchmove", removeClassAndEvents);
    });
  }
  return {onTouch : onTouch};
});
