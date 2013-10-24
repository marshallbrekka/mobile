define(
["config/rfz", "utils/events"],
function(RFZ, EVENTS) {
  RFZ.directive("rfzTap", function() {
    return function(scope, element, attrs) {
      new EVENTS.PointerAction(element[0], function() {
        scope.$apply(attrs["rfzTap"]);
      });
    }
  });
});

