App.directive("grid", function() {
  function columns(width) {
    var columns = Math.min(parseInt(width / 250), 8);
    return columns;
  }

  return {
    restrict : "A",
    replace : true,
    scope : {
      results : "=",
      select : "=",
      loading : "=",
      imagetype : "@"
    },
    templateUrl : "/partials/grid.html",
    link : function(scope, el) {
      scope.getWidth = function() {
        return el[0].clientWidth; 
      }
      scope.columns = columns(pixelToRelative(scope.getWidth()));
      scope.$watch(scope.getWidth, function(newValue, oldValue) {
        if(newValue !== oldValue) {
          scope.columns = columns(pixelToRelative(newValue));
        };
      });
      window.onresize = function() {
        scope.$apply();
      }
    }
  }
});
