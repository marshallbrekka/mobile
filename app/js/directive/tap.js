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

  function inElementRange(element, event) {
    var position = Point.fromEvent(event);
    var elEdges = Edges.fromElement(element);
    elEdges = Edges.toAxis(elEdges);
    return Point.applyFn(function(pointer, edge) {
      if (pointer < edge.start) {
        return pointer < edge.start - 50 ? 0 : 1;
      } else if (pointer > edge.end) {
        return pointer > edge.end + 50 ? 0 : 1;
      }
      return 1;
    }, position, elEdges).test(function(point) {
      return point == 1;
    }, true);
  }


  /*
  Apply to any element you wish to recieve a pointer start->end event.

  ex:
  <div rfz-tap="myScopeFn()">Click Me</div>
  */
  RFZ.directive("rfzTap", function() {
    return function(scope, element, attrs) {
      var addClassTimeout, inRange;
      
      new events.PointerNested(element[0], {
        start : function(e) {
          console.log("START");
          inRange = true;
          addClassTimeout = setTimeout(function() {
            dom.addClass(element[0], "pointer-start")
          }, 50);
        },
        preMove : function(e) {

        },
        move : function(e) {
          if (inElementRange(element[0], e)) {
            if (!inRange) {
              inRange = true;
              dom.addClass(element[0], "pointer-start");
            }
          } else {
            if (inRange) {
              inRange = false;
              dom.removeClass(element[0], "pointer-start");
            }
          }
        },
        end : function(e) {
          clearTimeout(addClassTimeout);
          if (inRange) {
            console.log("end-range");
            dom.addClass(element[0], "pointer-start");
            scope.$apply(attrs["rfzTap"]);
            dom.removeClass(element[0], "pointer-start");
          }
        },
        lost : function() {
          clearTimeout(addClassTimeout);
          dom.removeClass(element[0], "pointer-start");
        }
      });
    }
  });
});

