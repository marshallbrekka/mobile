/*
Apply to any element you wish to recieve a pointer start->end event.
ex:
<div rfz-tap="myScopeFn()">Click Me</div>
*/
lib.directive("rfzTap", ["$parse", "$rfz.util.events", "$rfz.util.point", "$rfz.util.edges",
                           function($parse, events, Point, Edges) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs["rfzTap"]);
    var opts = {};
    if (attrs.rfzTapClaimX === "true") {
      opts.claimX = true;
    }
    if (attrs.rfzTapClaimY === "true") {
      opts.claimY = true;
    }
    if (attrs.rfzTapDelayedClaim) {
      opts.delayedClaim = parseInt(attrs.rfzTapDelayedClaim);
    }
    if (attrs.rfzTapActiveClass) {
      opts.activeClass = attrs.rfzTapActiveClass;
    }
    if (attrs.rfzTapElementRange) {
      opts.elementRange = parseInt(attrs.rfzTapElementRange);
    }

    new events.PointerAction(element, function() {
      scope.$apply(function() {
        fn(scope);
      });
    }, opts);
  }
}]);
