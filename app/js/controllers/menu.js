define(["config/rfz"], function(RFZ) {
  console.log("menu");
  RFZ.controller("Menu", ["$scope", "$location", function Menu($scope, $location) {
    $scope.paths = ["overview", "progress", "payments", "accounts"];
    $scope.pathIndex = 2;
    $scope.mainView = "payments";
    $scope.go = function(index) {
      $scope.pathIndex = index;
      $scope.mainView = $scope.paths[index];
      $location.path("/" + $scope.paths[index]);
    }
    

    $scope.settingOne = false;
    $scope.settingTwo = true;

    $scope.testModel = 7;
  }]);
});
