lib.directive("rfzToggle", ["$rfz.util.css", "$rfz.util.events", "$rfz.util.point", function(css, EVENTS, Point) {
  function setPosition(slider, percent) {
    var unit = -50 * percent;
    css.setTranslate(slider[0], unit);
  }

  function toggleBackground(slider, show) {
    slider.css("background-size", (show ? "64px 100%" : "0 0") + ", 63px 100%");
  }

  return {
    restrict : "A",
    replace : true,
    scope : {
      model : "=toggle"
    },
    templateUrl : "/partials/toggle.html",
    link : function(scope, element, attr) {
      var slider = angular.element(element[0].getElementsByClassName("toggle-slider")[0]);
      var toggleBg = function() {
        slider.unbind(EVENTS.TRANSITION_END, toggleBg);
        toggleBackground(slider, scope.model)
      };
      if(!scope.model) {
        setPosition(slider, 1);
        toggleBackground(slider, scope.model);
      }
      var slidePercent = scope.model ? 0 : 1;

      function slide(distance) {
        var position;
        if (scope.model) {
          if (distance < 0) {
            position = Math.max(distance, -50);
          } else position = 0;
        } else {
          if (distance > 0) {
            position = - 50 + Math.min(50, distance);
          } else position = -50;
        }
        slidePercent = (position * -1) / 50
        setPosition(slider, slidePercent);
      }

      var sliding = false;
      var startPosition;

      function pointerStart (e) {
        sliding = false;
        toggleBackground(slider, true);
        startPosition = Point.fromEvent(e);
        element.addClass("touch-start");
      }

      function pointerMove(e) {
        e.preventDefault();
        if(!sliding) {
          sliding = true;
          slider.addClass("no-transition");
        }
        slide(Point.fromEvent(e).x - startPosition.x);
      }

      function pointerEnd() {
        slider.removeClass("no-transition");
        if (sliding) {
          if (slidePercent === 1) {
            toggleBackground(slider, false);
          } else {
            slidePercent = Math.round(slidePercent);
          }
          scope.model = slidePercent === 0;
          if (!scope.model) slider.bind(EVENTS.TRANSITION_END, toggleBg);

          setPosition(slider, slidePercent);
        } else {
          if (scope.model) {
            slider.bind(EVENTS.TRANSITION_END, toggleBg);
            scope.model = false;
            setPosition(slider, 1);
          } else {
            scope.model = true;
            setPosition(slider, 0);
          }
        }
      }

      new EVENTS.PointerNested(element, {
        start : pointerStart,
        preMove : function() {
          return true;
        },
        move : pointerMove,
        end : pointerEnd
      });
    }
    }
}]);