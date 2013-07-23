RFZ.directive("toggle", function() {
  function setPosition(slider, percent) {
    var unit = 50 * percent;
    slider.css("-webkit-transform", "translate(-" + unit + "px, 0)");
//    slider.css("left", "-" + unit + "px");
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
      var slider = element.find(".toggle-slider");
      var toggleBg = function() {
        slider.unbind("webkitTransitionEnd", toggleBg);
        toggleBackground(slider, scope.model)
      };
      if(!scope.model) {
        setPosition(slider, 1);
        toggleBackground(slider, scope.model);
      }
      var slidePercent = scope.model ? 0 : 1;

      function slide(distance) {
        //mobileConsole(distance);
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
      var startPosition
      element.bind("touchstart", function(e) {
        sliding = false;
        toggleBackground(slider, true);
        startPosition = e.originalEvent.touches[0].pageX;
        element.addClass("touch-start");
      });

      element.bind("touchmove", function(e) {
        if(!sliding) {
          sliding = true;
          slider.addClass("no-transition");
        }
        e.preventDefault();
        e.stopPropagation();
        slide(e.originalEvent.touches[0].pageX - startPosition);
      });

      element.bind("touchend", function() {
        slider.removeClass("no-transition");
        if (sliding) {
          if (slidePercent === 1) {
            toggleBackground(slider, false);
          } else {
            slidePercent = Math.round(slidePercent);
          }
          scope.model = slidePercent === 0;
          if (!scope.model) slider.bind("webkitTransitionEnd", toggleBg);

          setPosition(slider, slidePercent);
        } else {
          if (scope.model) {
            slider.bind("webkitTransitionEnd", toggleBg);
            scope.model = false;
            setPosition(slider, 1);
          } else {
            scope.model = true;
            setPosition(slider, 0);
          }
        }
      });
    }
  }
});
