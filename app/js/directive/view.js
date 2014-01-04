define([
  "config/rfz",
  "utils/events"
], function(
  RFZ,
  Events
) {

/**
The following controller and directives make up all the pieces that
are neccesary to make the pane views/transitions work correctly, and
be controlled easily through setting html attributes.


Usage starts with a parent element with the attr rfzView, which can
contain any number of rfzPane's, where only one is shown at a time,
and switching between them emulates the standard iOS transitions.

* Sample Structure *
<div rfz-view="settings"> // Sets the default pane to settings
  <div rfz-pane="settings"> // gives the pane name settings
    <div rfz-pane-header="Settings"> // The headers displayed title is 
                                     // Settings
      <div rfz-pane-header-button
           rfz-change-pane="notifications" // When tapped will change
                                           // pane to notifications
           rfz-change-direction="right" // The pane will come from the right
           position="right">
        Notifications
      </div>
    </div>
    <div rfz-pane-body>Content Of Settings Pane</div>
  </div>
  <div rfz-pane="notifications"> // gives the pane name notifications
    <div rfz-pane-header="Noticiations"> // The headers displayed title is 
                                         // Notifications
      <div rfz-pane-header-button
           rfz-change-pane="settings" // When tapped will change
                                      // pane to settings
           rfz-change-direction="left" // The pane will come from the left
           position="left"
           type="back">
        Settings
      </div>
    </div>
    <div rfz-pane-body>Content Of Notifications Pane</div>
  </div>
</div>

*/


// The rfzView controller sets the function openPane (which is
// available to all children of the rfzView directive) which is used
// to control which pane is shown, and what direction it should come
// from when being shown.
/*RFZ.controller("rfzView", function($scope) {
  console.log("made controller");
  $scope.value = "rfzView";
  return {
    cases : {},
    openPane : function(paneName, direction) {
      $scope.rfzViewDirection = direction;
      $scope.rfzView = paneName;
      if(!$scope.$$phase) $scope.$digest();
    }
  }
});*/


/**
 * Return the siblings between `startNode` and `endNode`, inclusive
 * @param {Object} object with `startNode` and `endNode` properties
 * @returns jQlite object containing the elements
 */
function getBlockElements(block) {
  if (block.startNode === block.endNode) {
    return angular.element(block.startNode);
  }
  var element = block.startNode;
  var elements = [element];
  do {
    element = element.nextSibling;
    if (!element) break;
    elements.push(element);
  } while (element !== block.endNode);
  return angular.element(elements);
}


RFZ.controller("rfzNavStack", function($scope) {
  var stack = [];
  $scope.$rfzNavState = {};
  $scope.$rfzNavDepth = 0;

  function push(viewName, enterType) {
    stack.push({name : $scope.$rfzViewName,
                exitType : enterType});
    $scope.$rfzNavState[$scope.$rfzViewName] = true;
    $scope.$rfzViewName = viewName;
    $scope.$rfzViewTransition = enterType;
    $scope.$rfzNavDepth++;
  }

  function pop() {
    var previousView = stack.pop();
    delete $scope.$rfzNavState[previousView.name];
    $scope.$rfzViewName = previousView.name;
    $scope.$rfzViewTransition = previousView.exitType;
    $scope.$rfzNavDepth--;
  }

  $scope.$rfzNavPush = push;
  $scope.$rfzNavPop = pop;

  return {
    push : push,
    pop : pop
  };
});

RFZ.directive("rfzView", function() {
  return {
    restrict : "A",
    require : "rfzView",
    controller : "rfzNavStack",
    scope : true,
    compile : function(tElement) {
      tElement.addClass("rfz-view");
      return {
        pre : function(scope, element, attr, ctrl) {
          scope.$rfzViewName = attr.rfzView;
          scope.$watch("$rfzViewTransition", function(transitionType, previousTransitionType) {
            element.addClass("rfz-nav-stack-" + transitionType);
            element.removeClass("rfz-nav-stack-" + previousTransitionType);
          });
        }
      };
    }
  }
});

  RFZ.directive("rfzPane", ["$animate", function($animate) {
    return {
      restrict : "A",
      require : "^rfzView",
      transclude : "element",
      priority : 10000,
      $$tlb : true,
      compile : function(tElement) {
        tElement.addClass("rfz-pane");
        return {
          pre : function(scope, element, attr, ctrl, $transclude) {
            var childScope, block, isVisible;
            scope.$on("$includeContentRequested", function() {
              console.log("content requested");
            });
            
            scope.$watch("$rfzNavState." + attr.rfzPane, function(val) {
              if (block) {
                if (val) {
                  $animate.addClass(angular.element(block.startNode), "ng-hide");
                } else {
                  $animate.removeClass(angular.element(block.startNode), "ng-hide");
                }
              }
            });

            scope.$watch("$rfzViewName", function rfzPaneWatchAction(name, previousName) {
              if (name === attr.rfzPane) {
                if (!childScope) {
                  childScope = scope.$new();
                  console.log("pre transclude");
                  $transclude(childScope, function(clone) {
                    console.log("transcluded");
                    clone.addClass("rfz-pane");
                    clone[0].style.zIndex = new String(scope.$rfzNavDepth);
                    block = {
                      startNode : clone[0],
                      endNode : clone[clone.length++] = document.createComment(" end rfzPane: " 
                                                                               + attr.rfzPane + " ")
                    };
                    $animate.enter(clone, element.parent(), element);
                    console.log("entered");
                  });
                }
              } else if (previousName === attr.rfzPane && !scope.$rfzNavState[attr.rfzPane]) {
                if (childScope) {
                  childScope.$destroy();
                  childScope = null;
                }
                if (block) {
                  $animate.leave(getBlockElements(block));
                  block = null;
                }
              }
            });
          }
        }
      }

    };
  }]);

  // Creates the pane header, the value of the attribute becomes the
  // title of the header. It also adds some classes for us.
  //
  // <div rfz-pane-header="Overview">
  RFZ.directive("rfzPaneHeader", function() {
    return {
      restrict : "A",
      compile : function(element, attrs) {
        element.append(angular.element("<div class='header-name'>" + attrs.rfzPaneHeader + "</div>"))
          .removeAttr("rfzPaneHeader")
          .addClass("header");
      }
    }
  });

  RFZ.directive("rfzPaneHeaderButton", function() {
    return {
      restrict : "A",
      require : "^rfzView",
      compile : function(elem, attrs, link) {
        elem.attr("compiled", true);
        elem.addClass("header-button");
        elem.addClass(attrs.position);
        if (attrs.type === "back") elem.addClass("back");
        elem.removeAttr("position").removeAttr("type").removeAttr("action");
      }
    }
  });

  // This directive simply adds a class to its element, which is
  // neccesary for the pane change animation, where the body slides
  // but the header fades.
  RFZ.directive("rfzPaneBody", function() {
    return {
      restrict : "A",
      link : function(scope, element) {
        element.addClass("rfz-pane-body view");
      }
    }
  });
});
