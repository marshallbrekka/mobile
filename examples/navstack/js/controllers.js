var module = angular.module("navstack", ["rfz", "ngAnimate"]);

module.controller("ItemList", ["$scope", function($scope){
  $scope.items = [];
  for (var i = 0; i < 200; i++) {
    $scope.items.push({id : i, name : "item " + i});
  }

  var openedItem;

  $scope.openItem = function(item) {
    console.log("opened");
    openedItem = item;
    item.active = true;
    $scope.$rfzViewProperties.selectedItem = item;
  }

  $scope.$on("$navStackViewFocus", function() {
    $scope.$rfzViewProperties.selectedItem = null;
    console.log("focused");
    if (openedItem) {
      openedItem.active = false;
      openedItem = null;
      $scope.$digest();
    }
  });

}]);