RFZ.directive("rfzTap", function() {
  
  
  return function(scope, element, attrs) {
    element.bind("touchstart", function() {
      element.addClass("touch-start");
      element.bind("touchend", function() {
        element.removeClass("touch-start");
        scope.$apply(attrs["rfzTap"]);
      });
    });
            
/*    element.bind('click', function() {
      scope.$apply(attrs["rfzTap"]);
    });*/
  }
});
