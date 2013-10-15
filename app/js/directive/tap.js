define(
["config/rfz", "util"],
function(RFZ, util) {
  RFZ.directive("rfzTap", function() {
    return function(scope, element, attrs) {
      util.onTouch(element, function() {
        scope.$apply(attrs["rfzTap"]);
      });
    }
  });
});

