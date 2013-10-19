define(["config/rfz"], function(RFZ) {
  console.log("overlay");
  RFZ.controller("Overlay", ["$scope", function Overlay($scope) {
    $scope.overlayName = "default value";
    $scope.showOverlay = function(overlayName) {
      $scope.overlayName = overlayName;
    }
    $scope.hideOverlay = function() {
      $scope.overlayName = null;
    }
  }]);
});
