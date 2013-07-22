function Progress($scope, model) {
  $scope.debtAccounts = function() {
    var re =  _.filter(model.accounts, function(acct) {
      return acct.type !== "Checking/Savings";
    });
    return re;
  }

  $scope.assetAccounts = function() {
    return _.filter(model.accounts, function(acct) {
      return acct.type === "Checking/Savings";
    });
  }
}
