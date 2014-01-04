'use strict';
define([
  "lib/angular/angular",
  "config/rfz",
  "services",
  "filters",
  "controllers/overview",
  "controllers/progress",
  "controllers/payments",
  "controllers/accounts",
  "controllers/menu",
  "controllers/overlay",
  "directive/tap",
  "directive/progress",
  "directive/toggle",
  "directive/view",
  "directive/scroll-view",
  "directive/paralax-scroll",
  "directive/table-input",
  "directive/side-scroll",
  "utils/pollyfills",
  "utils/scrollView"

], function(
  angular,
  RFZ,
  services,
  filters,
  Overview,
  Progress,
  Payments,
  Accounts
){
console.log("ran ap");
//var consoleEl = $("#console");
function mobileConsole(msg) {
//  consoleEl.css("display", "block").text(msg);
}


// Declare app level module which depends on filters, and services
RFZ.config([function() {
/*    $routeProvider.when('/overview',
                        {templateUrl: 'partials/overview.html',
                         controller: "Overview"});
    $routeProvider.when('/progress',
                        {templateUrl: 'partials/progress.html',
                         controller: "Progress"});
    $routeProvider.when("/payments",
                       {templateUrl: "partials/payments.html",
                        controller: "Payments"})
    $routeProvider.when("/accounts",
                       {templateUrl: "partials/accounts.html",
                        controller: "Accounts"})
    $routeProvider.otherwise({redirectTo: '/overview'});*/
  }]);
});
