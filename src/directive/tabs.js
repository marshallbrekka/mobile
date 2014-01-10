lib.directive("rfzTabs", ["$animate", function($animate) {
  return {
    restrict : "A",
    require : "rfzTabs",
    controller : ["$scope", function() {
      this.cases = {};
    }],
    link : function(scope, element, attr, ctrl) {
      var visibleView, watchExpr = attr.rfzTabs;
      scope.$watch(watchExpr, function(val) {
        var nextView = ctrl.cases["!" + val];
        if (!nextView) {
          throw new Error("rfzTabs: no tab exists with the name " + val);
        }
        // If the next view has aleady been created once, just show
        // its hidden view
        if (nextView.clone) {
          $animate.removeClass(nextView.clone, "ng-hide");
          $animate.addClass(visibleView, "ng-hide");
          visibleView = nextView.clone;
        } else {
          nextView.scope = scope.$new();
          nextView.transclude(nextView.scope, function(clone) {
            nextView.clone = clone;
            $animate.enter(clone, nextView.element.parent(), nextView.element);
            if (visibleView) {
              $animate.addClass(visibleView, "ng-hide");
            }
            visibleView = clone;
          });
        }
      });
    }
  }
}]);

lib.directive("rfzTab", function() {
  return {
    restrict : "A",
    transclude : "element",
    priority : 800,
    require : "^rfzTabs",
    link : function(scope, element, attrs, ctrl, $transclude) {
      ctrl.cases["!" + attrs.rfzTab] = {
        transclude : $transclude,
        element : element
      };
    }
  }
});
