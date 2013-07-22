'use strict';

// Declare app level module which depends on filters, and services
var RFZ = angular.module('RFZ', ['RFZ.filters'/*, 'RFZ.services', 'RFZ.directives'*/]).
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
var directives = angular.module('RFZ.directives', [])
