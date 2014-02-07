var module = angular.module("scrolling", ["rfz", "ngAnimate"]);

module.controller("Appointments", ["$scope", function($scope){
  $scope.appointments = [[{name : "Eng Meeting",
                           date : new Date(),
                           details : "So many meetings!"},
                          {name  : "Dinner with John",
                           details : "Who is john?",
                           date : new Date()},
                          {name  : "Dinner with Karen",
                           details : "Who is john?",
                           date : new Date()},
                          {name  : "Conference",
                           details : "SF?",
                           date : new Date()},
                          {name  : "Avengers",
                           details : "AMC 9",
                           date : new Date()},
                          {name  : "Groceries",
                           details : "Milk, Eggs, Wine.",
                           date : new Date()},
                          {name  : "Get the dog",
                           details : "Kens Kenel",
                           date : new Date()},
                          {name  : "Pick up Susan",
                           date : new Date()},
                          {name  : "Groceries",
                           details : "Milk, Eggs, Wine.",
                           date : new Date()},
                          {name  : "Get the dog",
                           details : "Kens Kenel",
                           date : new Date()},
                          {name  : "Pick up Susan",
                           date : new Date()},
                          {name  : "Pick up Susan",
                           date : new Date()},
                          {name  : "Groceries",
                           details : "Milk, Eggs, Wine.",
                           date : new Date()},
                          {name  : "Get the dog",
                           details : "Kens Kenel",
                           date : new Date()},
                          {name  : "Pick up Susan",
                           date : new Date()}],
                         [{name : "Eng Meeting",
                           date : new Date(),
                           details : "review mobile app"},
                          {name  : "Dinner with John",
                           date : new Date(),
                           details : "Meet at saturn cafe."}]];

    var openedAppointment;

  $scope.openAppointment = function(appointment) {
    openedAppointment = appointment;
    appointment.active = true;
    $scope.$rfzViewProperties.appointment = appointment;
  }

  $scope.$on("$navStackViewFocus", function() {
    $scope.$rfzViewProperties.appointment = null;
    if (openedAppointment) {
      openedAppointment.active = false;
      openedAppointment = null;
      $scope.$digest();
    }
  });

}]);

module.controller("ScrollExamples", ["$scope", function($scope){
  var openedItem;

  $scope.items = [{
    name : "Paralax",
    type : "paralax"
  }];

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
