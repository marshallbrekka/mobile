define([
  "config/rfz",
  "utils/events"
], function(
  RFZ,
  Events
){

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

      function pointerEnd() {
        element.addClass("edit-mode");
        input[0].focus();
      }

      function blur() {
        console.log(scope.rfzTableInput);
        element.removeClass("edit-mode");
      }

      new Events.PointerNested(element[0], {
        end : pointerEnd
      });
      Events.bind(input[0], blur, ["blur"]);
    }
  }
});
});
