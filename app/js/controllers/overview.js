function Overview($scope, model) {
  $scope.targetAccount = function() {
    console.log("target account");
    for (var i in model.accounts) {
      var acct = model.accounts[i];
      if(acct.isTarget) {
        return acct;
      }
    }
  }

  $scope.dailyInterest = -0.97;
  $scope.cash = 31000;

  $scope.refresh = function() {
    model.change(function() {
//      $scope.$digest();
    });
  }
}
