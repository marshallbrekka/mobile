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


/*
When the directive is first initialized the value for
rfz-view-stack becomes the first view on the history stack.

With nested view stacks, if the length of the history is equal to 1
and the $pop method was called, then it looks for its controller on
its parent and calls $pop there, thus removing the current view from
the stack, as well as the last view on the parents stack.
*/
lib.directive("rfzViewStack", ["$animate", function($animate) {
  function transitionClass(type) {
    return "rfz-view-stack-transition-" + type;
  }

  return {
    restrict : "A",
    controller : function() {
      this.views = {};
      this.history = [];
      this.$$pop = function(){};
      this.depthIndex = 1;
    },
    link : function(scope, element, attr, ctrl) {
      var parentController = element.parent().controller("rfzViewStack");
      if (parentController) {
        ctrl.depthIndex = parentController.depthIndex + 1;
      }
      function popView() {
        if (ctrl.history.length === 1){
          if (parentController) {
            parentController.$$pop();
          } else {
            throw new Error("rfzViewStack: tried to call $pop, but already at beginning" + 
                            " of stack, and no parent stack exists.");
          }
        } else {
          // Remove the current view, and reveal the previous one.
          var current = ctrl.history.pop();
          var previous = ctrl.history[ctrl.history.length - 1];
          element.addClass(transitionClass(current.transition));
          current.scope.$destroy();
          $animate.removeClass(previous.element, "ng-hide");
          $animate.leave(current.element, function() {
            element.removeClass(transitionClass(current.transition));
          });
          ctrl.depthIndex--;
        }
      }

      function pushView(name, transitionType) {
        var viewObj = ctrl.views[name];
        if (!viewObj) {
          throw new Error("rfzViewStack: tried to push the view " + name +
                          " but no view by that name exists");
        }
        element.addClass(transitionClass(transitionType));
        // Properties to use for the new view
        var newScope = scope.$new();
        var view = {
          scope : newScope,
          transition : transitionType
        };

        viewObj.transclude(view.scope, function(clone) {
          clone.addClass("rfz-pane");
          clone.css("z-index", ctrl.depthIndex++ + "");
          view.element = clone;
          var anchor = viewObj.element;
          if (ctrl.history.length === 0) {
            newScope.$rfzViewProperties = {};
          } else {
            var current = ctrl.history[ctrl.history.length - 1];
            newScope.$rfzViewProperties = {
              canGoBack : true,
              previousTitle : current.scope.$rfzViewProperties.title
            };
            $animate.addClass(current.element, "ng-hide");
          }
          ctrl.history.push(view);
          $animate.enter(clone, anchor.parent(), anchor, function() {
            element.removeClass(transitionClass(transitionType));
          });
        });
      }

      ctrl.$$pop = popView;

      element.addClass("rfz-view");
      var previousStack = scope.$rfzViewStack;
      scope.$rfzViewStack = {
        $push : function(name, transitionType) {
          pushView(name, transitionType);
        },
        $pop : function() {
          popView();
        }
      };
      pushView(attr.rfzViewStack, "none");
    }
  }
}]);

lib.directive("rfzView", function() {
  return {
    transclude: 'element',
    priority: 800,
    require: '^rfzViewStack',
    link: function(scope, element, attr, ctrl, $transclude) {
      ctrl.views[attrs.rfzView] = {
        transclude : $transclude,
        element : element
      };
    }
  }
});


// Creates the pane header, the value of the attribute becomes the
// title of the header. It also adds some classes for us.
//
// <div rfz-pane-header="Overview">
lib.directive("rfzViewHeader", function() {
  return {
    restrict : "A",
    compile : function(element, attrs) {
      element.append(angular.element("<div class='rfz-view-header-name'>" + 
                                     attrs.rfzViewHeader + "</div>"))
        .removeAttr("rfzViewHeader")
        .addClass("rfz-view-header");
      return function(scope, element, attr) {
        if (scope.$rfzViewProperties) {
          scope.$rfzViewProperties.title = attrs.rfzViewHeader;
        }
      }
    }
  }
});

lib.directive("rfzViewHeaderButton", function() {
  return {
    restrict : "A",
    compile : function(elem, attrs, link) {
      elem.addClass("rfz-view-header-button");
      elem.addClass("rfz-view-header-button-" + attrs.position);
      if (attrs.type === "back") {
        elem.addClass("rfz-view-header-button-back");
      }
      elem.removeAttr("position").removeAttr("type").removeAttr("action");
    }
  }
});

// This directive simply adds a class to its element, which is
// neccesary for the pane change animation, where the body slides
// but the header fades.
lib.directive("rfzViewBody", function() {
  return {
    restrict : "A",
    compile : function(element) {
      element.addClass("rfz-view-body");
    }
  }
});
