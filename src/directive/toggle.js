lib.directive("rfzToggle", ["$rfz.util.css", "$rfz.util.number", "$rfz.util.events", "$rfz.util.point", "$rfz.util.platform",
                            function(css, numb, events, Point, platform) {
  return {
    restrict : "A",
    replace : true,
    scope : {
      model : "=rfzToggle"
    },
    template : "<div class='rfz-toggle' ng-class=\"{on : modelValueWhileInteracting}\"><div class='rfz-toggle-handle'></div></div>",
    link : function(scope, element, attr) {
      var handle = element.children();
      var startPosition;
      var targetPoint;
      var hasMoved;
      var iosPointerStartTimer;
      
      // use this to track the toggle control value while the user is
      // interacting with it before assigning the end value to the
      // bound model provided to the directive
      scope.modelValueWhileInteracting;

      scope.$watch("model", function(newValue) {
        scope.modelValueWhileInteracting = newValue;
      });

      function getTargetPoint(start, firstChange) {
        var target = start.copy();
        var unit = firstChange ? 35 : 25;
        if (scope.modelValueWhileInteracting) {
          target.x -= unit;
        } else {
          target.x += unit;
        }
        return target;
      }


      function pointerStartIOS (e) {
        scope.modelValueWhileInteracting = scope.model;
        hasMoved = false;
        startPosition = Point.fromEvent(e);
        iosPointerStartTimer = setTimeout(function() {
          element.addClass("pointer-start");
        }, 50);
        targetPoint = getTargetPoint(startPosition, true);
      }

      function pointerMoveIOS(e) {
        var position = Point.fromEvent(e);
        if (scope.modelValueWhileInteracting) {
          if (position.x <= targetPoint.x) {
            hasMoved = true;
            scope.modelValueWhileInteracting = false;
            targetPoint = getTargetPoint(targetPoint, false);
            scope.$digest();
          }
        } else {
          if (position.x >= targetPoint.x) {
            hasMoved = true;
            scope.modelValueWhileInteracting = true;
            targetPoint = getTargetPoint(targetPoint, false);
            scope.$digest();
          }
        }
      }

      function pointerLostIOS(e) {
        element.removeClass("pointer-start");
      }


      function pointerEndIOS(e) {
        clearTimeout(iosPointerStartTimer);
        pointerLostIOS(e);
        if (!hasMoved) {
          scope.model = !scope.model;
        } else {
          scope.model = scope.modelValueWhileInteracting;
        }
        scope.$apply();
      }

      if (platform.os === platform.PLATFORMS.IOS) {
        new events.PointerNested(element, {
          start : pointerStartIOS,
          preMove : function() {
            return true;
          },
          move : pointerMoveIOS,
          end : pointerEndIOS,
          lost : pointerLostIOS

        });
      } else {
        handle.text(scope.model ? "ON" : "OFF");
        var distance = 47;

        function pointerStartAndroid(e) {
          scope.modelValueWhileInteracting = scope.model;
          hasMoved = false;
          startPosition = Point.fromEvent(e);
          element.addClass("pointer-start");
        }

        function pointerPreMoveAndroid(e) {
          if (hasMoved) {
            return true;
          } else {
            var position = Point.fromEvent(e);
            var delta = Point.difference(startPosition, position);
            delta.abs();
            if (delta.x === delta.y || delta.x > delta.y) {
              return true;
            } else {
              return false;
            }
          }
        }

        function toggleAndroid() {
          scope.modelValueWhileInteracting = !scope.modelValueWhileInteracting;
          handle.text(scope.modelValueWhileInteracting ? "ON" : "OFF");
          scope.$digest();
        }

        function pointerMoveAndroid(e) {
          hasMoved = true;
          var position = Point.fromEvent(e);
          var delta = Point.difference(startPosition, position).x;

          if (scope.model) {
            delta = -numb.clampNum(distance - delta, 0, distance);
          } else {
            delta = numb.clampNum(delta, -distance, 0);
          }

          css.setTranslate(handle[0], -delta, 0, 0);
          if (scope.modelValueWhileInteracting) {
            if (delta > -(distance / 2)) {
              toggleAndroid();
            }
          } else {
            if (delta < -(distance / 2)) {
              toggleAndroid();
            }
          }
        }

        function pointerLostAndroid(e) {
          element.removeClass("pointer-start");
        }

        function pointerEndAndroid(e) {
          pointerLostAndroid(e);
          if (!hasMoved) {
            toggleAndroid();
          }
          scope.model = scope.modelValueWhileInteracting;
          scope.$apply();
          css.setTransform(handle[0], "");
        }

        new events.PointerNested(element, {
          start : pointerStartAndroid,
          preMove : pointerPreMoveAndroid,
          move : pointerMoveAndroid,
          end : pointerEndAndroid,
          lost : pointerLostAndroid
        });
      }
    }
  }
}]);
