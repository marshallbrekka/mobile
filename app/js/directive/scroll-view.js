define(["config/rfz", "utils/scrollView"], function(RFZ, ScrollView){


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
    templateUrl : "/partials/scroll-view2.html",
    compile : function() {
      var scroll = 0;
      return function(scope, element) {
        var el = element[0];
        var scroll = new ScrollView({
          container : el.children[0],
          content : el.children[0].children[0],
          canScrollX : false
        });
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
