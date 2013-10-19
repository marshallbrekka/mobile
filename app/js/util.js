define(["utils/events"], function(EVENTS) {
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
      element.unbind(EVENTS.POINTER_END, touchEnd);
      element.unbind(EVENTS.POINTER_MOVE, removeClassAndEvents);
    }
    
    element.bind(EVENTS.POINTER_START, function(e) {
      element.addClass("touch-start");
      element.bind(EVENTS.POINTER_END, touchEnd);
      element.bind(EVENTS.POINTER_MOVE, removeClassAndEvents);
    });
  }
  return {onTouch : onTouch};
});
