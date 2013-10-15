define(["config/rfz"], function(RFZ){

RFZ.directive("rfzTableInput", function() {
  return {
    restrict : "A",
    replace : true,
    scope : {
      rfzTableInput : "="
    },
    templateUrl : "/partials/table-input.html",
    link : function(scope, element, attr) {
      scope.model = scope.rfzTableInput;
      scope.$watch("model", function(newVal, oldVal) {
        if(newVal !== oldVal && newVal !== "") {
          var x = parseFloat(newVal);
          if (!isNaN(x)) {
            scope.rfzTableInput = parseFloat(newVal);
          }
        }
      });
      var input = element.find("input");
      element.bind("touchend", function() {
        element.addClass("edit-mode");
        input.focus();
      });
      input.bind("blur", function() {
        console.log(scope.rfzTableInput);
        element.removeClass("edit-mode");
      });
    }
  }
});
});
