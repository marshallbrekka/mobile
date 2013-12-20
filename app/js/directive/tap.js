/*
Listeners for a complete pointer start->end, event, with many options
for how to claim the event.
*/
define([
  "config/rfz",
  "utils/events",
  "utils/dom",
  "utils/point",
  "utils/edges"
], function(
  RFZ,
  events,
  dom,
  Point,
  Edges
) {

  /*
  Apply to any element you wish to recieve a pointer start->end event.

  ex:
  <div rfz-tap="myScopeFn()">Click Me</div>
  */
  RFZ.directive("rfzTap", function() {
    return function(scope, element, attrs) {
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

      new events.PointerAction(element[0], function() {
        scope.$apply(attrs["rfzTap"]);
      }, opts);
    }
  });
});

