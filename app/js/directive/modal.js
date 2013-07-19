App.directive("modal", function() {
  function enabled(val) {
    if (val) {
      return "enabled";
    }
    return "";
  }

  return {
    restrict : "A",
    replace : true,
    transclude:true,
    scope : {
      bgclose : "&",
      open : "=",
      title : "=",
      nextEnabled : "=",
      backEnabled : "=",
      next : "=",
      back : "="
    },
    templateUrl : "/partials/modal.html",
    link : function(scope, el, attrs) {
      scope.$watch("nextEnabled", function(n, o) {
        scope.nextClass = enabled(n);
      });

      scope.$watch("backEnabled", function(n, o) {
        scope.backClass = enabled(n);
      });

      scope.internalBack = function() {
        if (scope.backEnabled) {
          scope.back();
        }
      }

      scope.internalNext = function() {
        if (scope.nextEnabled) {
          scope.next();
        }
      }
      
      var ele = el[0];
      el.bind("click", function(e) {
        if (e.toElement === ele && scope.bgclose()) {
          scope.open = false;
          scope.$apply();
        }
      });
    }
  }
});
