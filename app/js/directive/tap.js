RFZ.directive("rfzTap", function() {
  return function(scope, element, attrs) {
    element.bind('click', function() {
      scope.$apply(attrs["rfzTap"]);
    });
  }
});
