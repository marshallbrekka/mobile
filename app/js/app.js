'use strict';
var directives = angular.module('RFZ.directives', []);
var services = angular.module('RFZ.services', []);
var filters = angular.module('RFZ.filters', []);

var consoleEl = $("#console");
function mobileConsole(msg) {
  consoleEl.css("display", "block").text(msg);
}




// Declare app level module which depends on filters, and services
var RFZ = angular.module('RFZ', ['RFZ.filters', 'RFZ.services', 'RFZ.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/overview',
                        {templateUrl: 'partials/overview.html',
                         controller: Overview});
    $routeProvider.when('/progress',
                        {templateUrl: 'partials/progress.html',
                         controller: Progress});
    $routeProvider.when("/payments",
                       {templateUrl: "partials/payments.html",
                        controller: Payments})
    $routeProvider.when("/accounts",
                       {templateUrl: "partials/accounts.html",
                        controller: Accounts})
    $routeProvider.otherwise({redirectTo: '/overview'});
  }]);


