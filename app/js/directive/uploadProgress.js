App.directive("uploadProgress", function() {
  function updateProgress(el, e) {
    if (e.lengthComputable) {
      var percentComplete = 100 * (e.loaded / e.total);
      el.css("right",  (100 - percentComplete) + "%");
    }
  }

  return {
    restrict : "A",
    scope : {
      class : "@",
      progressClass : "@",
      xhr : "=",
      canStart : "=",
      startUploads : "="
    },
    replace : true,
    transclude : true,
    template : "<div ng-class='class'><div ng-transclude></div><div ng-class='progressClass'></div></div>",
    link : function(scope, el, attrs) {
      var progressDiv = el.children().eq(1);
      scope.xhr.upload.addEventListener("progress", function(evt) {
        updateProgress(progressDiv, evt);
      }, false);
      
      scope.xhr.addEventListener("load", function() {
        el.css("right", "0px");
      });

      if(scope.canStart) {
        scope.startUploads();
      }
    }
  }
});
