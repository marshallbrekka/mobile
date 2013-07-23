function Menu($scope, $location) {
  $scope.paths = ["overview", "progress", "payments", "accounts"];
  $scope.pathIndex = 0;
  $scope.go = function(index) {
    $scope.pathIndex = index;
    $location.path("/" + $scope.paths[index]);
  }
  $scope.openSettings = function() {
    $("#overlay-view").css("-webkit-transform","translate(0,0)");
  }
  $scope.closeSettings = function() {
    $("#overlay-view").css("-webkit-transform","");
  }
  
}
