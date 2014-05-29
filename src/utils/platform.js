'use strict';
lib.factory("$rfz.util.platform", ["$rootScope", function($rootScope) {
  var vSplit;
  var platform = {
    PLATFORMS : {
      IOS : "ios",
      ANDROID : "android"
    }
  };

  var urlArgs = {};
  _.each(window.location.search.replace(/^\?/, "")
         .replace(/\/$/, "").split("&"), function(pair) {
           var pair = pair.split("=");
           urlArgs[pair[0]] = pair[1];
         });

  var androidRegexUA = /(Android) (\d)\.(\d)/;
  var iOSRegexUA = /(iPhone|iPad).+ OS (\d)_(\d)/;

  var androidMatch = window.navigator.userAgent.match(androidRegexUA);
  var iOSMatch = window.navigator.userAgent.match(iOSRegexUA);
  var userAgentInfo;

  if (androidMatch) {
    userAgentInfo = {os : "android",
                     version : {
                       major : parseInt(androidMatch[2]),
                       minor : parseInt(androidMatch[3])
                     }};
  } else if (iOSMatch) {
    userAgentInfo = {os : "ios",
                     version : {
                       major : parseInt(iOSMatch[2]),
                       minor : parseInt(iOSMatch[3])
                     }};
  }

  // Use os if specified in url args, otherwise pull os from cordova
  // object. Defaults to ios.
  if (urlArgs.os) {
    platform.os = urlArgs.os;
  } else if (window.device && window.device.platform) {
    platform.os = window.device.platform.toLowerCase();
  } else if (userAgentInfo) {
    platform.os = userAgentInfo.os;
  } else {
    platform.os = "ios";
  }

  // Use os version if specified in url args, otherwise pull os
  // version from cordova object. Defaults to 7.0
  if (urlArgs.version) {
    vSplit = urlArgs.version.split(".");
    platform.version = {
      major : parseInt(vSplit[0]),
      minor : parseInt(vSplit[1]) || 0
    };
  } else if (window.device && window.device.version) {
    vSplit = window.device.version.split(".");
    platform.version = {
      major : parseInt(vSplit[0]),
      minor : parseInt(vSplit[1]) || 0
    };
  } else if (userAgentInfo) {
    platform.version = userAgentInfo.version;
  } else {
    platform.version = {
      major : 7,
      minor : 0
    };
  }

  $rootScope.$rfzPlatform = platform;
  return platform;
}]);
