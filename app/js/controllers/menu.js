function Menu($scope, $location) {
  $scope.paths = ["overview", "progress", "payments", "accounts"];
  $scope.pathIndex = 0;
  $scope.go = function(index) {
    $scope.pathIndex = index;
    $location.path("/" + $scope.paths[index]);
  }
  $scope.openSettings = function() {
    $("#overlay-view").css("display","block").height();
    $("#overlay-view").css("-webkit-transform","translate(0,0)");
  }
  function setZ() {
    $("#overlay-view").css("display", "");
    $("#overlay-view").unbind("webkitTransitionEnd", setZ);
  }

  $scope.closeSettings = function() {
    $("#overlay-view").css("-webkit-transform","").bind("webkitTransitionEnd", setZ);
  }

  $scope.shiftRight = function() {
    $scope.onRight = "main";
    $(".header-content").eq(0).addClass("to-left");
    $(".header-content").eq(1).removeClass("from-right");
  }

  $scope.shiftLeft = function() {
    $scope.onRight = "";
    $(".header-content").eq(0).removeClass("to-left");
    $(".header-content").eq(1).addClass("from-right");
    
  }

  

  $scope.settingOne = false;
  $scope.settingTwo = true;

  $scope.testModel = 7;
  
}
