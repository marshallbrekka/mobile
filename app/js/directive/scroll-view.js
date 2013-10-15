define(["config/rfz"], function(RFZ){


RFZ.controller("rfzScrollView", function() {
  return {
    height : function() {
      return 0;
    }
  }
});

RFZ.directive("rfzScrollView", function() {
  return {
    restrict : "A",
    replace : true,
    transclude : "element",
    templateUrl : "/partials/scroll-view.html",
    compile : function() {
      var scroll = 0;
      return function(scope, element) {
        if (scroll) {
          element[0].children[0].scrollTop = scroll;
        }
        scope.$on("rfzViewChange", function() {
          scroll = element[0].children[0].scrollTop;
        });
      }
    }
  }
});
});
