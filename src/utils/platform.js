'use strict';
lib.factory("$rfz.util.platform", ["$rootScope", function($rootScope) {
  var platform = {
    PLATFORMS : {
      IOS : "ios",
      ANDROID : "android"
    },
    os : "ios",
    version : {
      major : 7,
      minor : 3
    }
  };
  $rootScope.$rfzPlatform = platform;
  return platform;
}]);
