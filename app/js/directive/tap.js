RFZ.directive("rfzTap", function() {
  return function(scope, element, attrs) {
    function touchEnd() {
      element.removeClass("touch-start");
      element.unbind("touchend", touchEnd);
      scope.$apply(attrs["rfzTap"]);
    }
    element.bind("touchstart", function(e) {
      element.addClass("touch-start");
      element.bind("touchend", touchEnd);
    });
  }
});
