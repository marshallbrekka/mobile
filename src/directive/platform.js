lib.directive("rfzPlatform", ["$rfz.util.platform", function($platform) {
  return {
    restrict : "A",
    compile : function(elem, attrs, link) {
      console.log($platform.PLATFORMS[attrs.rfzPlatform]);
      console.log($platform.os);
      if ($platform.PLATFORMS[attrs.rfzPlatform] !== $platform.os ||
          (attrs.rfzPlatFormVersion && attrs.rfzPlatFormVersion !== $platform.version.major)) {
        elem.remove();
      }
    }
  }
}]);

lib.directive("rfzAddPlatform", ["$rfz.util.platform", function($platform) {
  return {
    restrict : "A",
    compile : function(elem, attrs, link) {
      elem.addClass("rfz-os-" + $platform.os);
      elem.addClass("rfz-os-version-" + $platform.version.major);
    }
  }
}]);
