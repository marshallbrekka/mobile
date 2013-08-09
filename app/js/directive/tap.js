RFZ.directive("rfzTap", function() {
  return function(scope, element, attrs) {
    onTouch(element, function() {
      scope.$apply(attrs["rfzTap"]);
    });
  }
});
