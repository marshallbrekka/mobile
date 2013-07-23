RFZ.directive("toggle", function() {
  function setPosition(slider, percent) {
    var unit = 50 * percent;
/*    slider.css("-webkit-transform", "translate(-" + unit + "px,
  0)");*/
    slider.css("left", "-" + unit + "px");
  }

  function toggleBackground(slider, show) {
    slider.css("background-size", (show ? "63px 100%" : "0 0") + ", 64px 100%");
  }

  return {
    restrict : "A",
    replace : true,
    scope : {
      model : "=",
    },
    templateUrl : "/partials/toggle.html",
    link : function(scope, element, attr) {
      var value = true;
      var slider = element.find(".slider");
      var toggleBg = function() {
        slider.unbind("webkitTransitionEnd", toggleBg);
        toggleBackground(slider, value)
      };
      
      element.bind("touchend", function() {
        if(value) slider.bind("webkitTransitionEnd", toggleBg);
        else toggleBackground(slider, !value);
        if (value) {
          value = false;
          setPosition(slider, 1);
        } else {
          value = true;
          setPosition(slider, 0);
        }
      });
    }
  }
});
