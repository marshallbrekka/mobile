define([], function(){
  var supportsScrolles = "createTouch" in document;
  var events = {POINTER_START : supportsScrolles ? "touchstart" : "mousedown",
                POINTER_MOVE : supportsScrolles ? "touchmove" : "mousemove",
                POINTER_END : supportsScrolles ? "touchend" : "mouseup",
                POINTER_CANCEL : "touchcancel",
                TRANSITION_END : "webkitTransitionEnd"};
  return events;
});
