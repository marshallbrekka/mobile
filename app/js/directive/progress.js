RFZ.directive("progress", function() {
  return {
    restrict : "A",
    replace : true,
    scope : {
      account : "="
    },
    templateUrl : "/partials/progress-pane.html"
  }
});
