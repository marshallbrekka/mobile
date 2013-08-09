function onTouch(element, fn) {
  function touchEnd() {
    element.removeClass("touch-start");
    element.unbind("touchend", touchEnd);
    fn();
  }
  element.bind("touchstart", function(e) {
    element.addClass("touch-start");
    element.bind("touchend", touchEnd);
  });
}
