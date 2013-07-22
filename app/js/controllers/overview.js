function Overview($scope, model) {
  for (var i in model.accounts) {
    var acct = model.accounts[i];
    if(acct.isTarget) {
      $scope.targetAccount = acct;
      break;
    }
  }
  $scope.dailyInterest = -0.97;
  $scope.cash = 31000;
}
