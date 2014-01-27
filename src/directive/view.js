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
      function popView(viewName) {
        if (ctrl.history.length === 1){
          if (parentController) {
            parentController.$$pop();
          } else {
            throw new Error("rfzViewStack: tried to call $pop, but already at beginning" + 
                            " of stack, and no parent stack exists.");
          }
        } else {
          var previous,
              transition,
              silentRemove = [],
              current = ctrl.history.pop();

          if (viewName) {
            var length = ctrl.history.length;
            while (length) {
              length--;
              var last = ctrl.history.pop();
              if (last.name === viewName) {
                previous = last;
                ctrl.history.push(last);
                continue;
              } else {
                transition = last.transition;
                silentRemove.push(last);
              }
            }
          } else {
            previous = ctrl.history[ctrl.history.length - 1];
            transition = current.transition;
          }
          // Remove the current view, and reveal the previous one.
          _.each(silentRemove, function(view) {
            view.scope.$destroy();
            view.element.remove();
          })
          element.addClass(transitionClass(transition));
          current.scope.$destroy();
          $animate.removeClass(previous.element, "ng-hide", function() {
            previous.scope.$broadcast("$navStackViewFocus");
          });
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
          name : name,
          scope : newScope,
          transition : transitionType
        };

        viewObj.transclude(view.scope, function(clone) {
          clone.addClass("rfz-pane");
          clone.addClass("rfz-js-header-animation");
          clone.css("z-index", ctrl.depthIndex++ + "");
          view.element = clone;
          var anchor = viewObj.element;
          if (ctrl.history.length === 0) {
            newScope.$rfzViewProperties = {};
          } else {
            var current = ctrl.history[ctrl.history.length - 1];
            newScope.$rfzViewProperties = {
              canGoBack : true,
              previous : current.scope.$rfzViewProperties
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
        $pop : function(name) {
          popView(name);
        }
      };
      pushView(attr.rfzViewStack, "none");
    }
  };
}]);

lib.directive("rfzView", function() {
  return {
    transclude: 'element',
    priority: 800,
    require: '^rfzViewStack',
    link: function(scope, element, attr, ctrl, $transclude) {
      ctrl.views[attr.rfzView] = {
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
lib.directive("rfzViewHeader", ["$rfz.util.platform", function(platform) {
  return {
    restrict : "A",
    compile : function(element, attrs) {
      var title = attrs.rfzViewHeader;
      element.removeAttr("rfzViewHeader")
             .addClass("rfz-view-header");
      return {
        pre : function(scope, element, attr) {
          var titleEl = angular.element("<div class='rfz-view-header-name'>" +
                                        title + "</div>");
          element.append(titleEl);
          var dimensions = titleEl[0].getBoundingClientRect();
          if (scope.$rfzViewProperties) {
            scope.$rfzViewProperties.title = attrs.rfzViewHeader;
          }
        }
      }
    }
  }
}]);

lib.directive("rfzViewHeaderButton", function() {
  return {
    restrict : "A",
    compile : function(elem, attrs, link) {
      elem.addClass("rfz-view-header-button");
      elem.addClass("rfz-view-header-button-" + attrs.position);
      if (attrs.type === "back") {
        elem.addClass("rfz-view-header-button-back");
        var wrapper = angular.element("<div class='rfz-view-header-button-back-contents'></div>");
        elem.append(wrapper.append(elem.contents()));
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


lib.animation('.rfz-js-header-animation', ["$rfz.util.css", function($rfzCss) {
  var duration = 300;

  return {
    enter: function(element, done) {
      var width = element[0].getBoundingClientRect().width;
      var headerName = element[0].querySelector(".rfz-view-header-name");
      var leftButton = element[0].querySelector(".rfz-view-header-button-back-contents");

      if (headerName) {
        var size = $rfzCss.textRect(headerName);
        $rfzCss.setTranslate(headerName, (width / 2) + (size.width / 2));
      }
      if (leftButton) {
        var size = $rfzCss.textRect(leftButton);
        $rfzCss.setTranslate(leftButton,(width / 2) - (size.width / 2));
      }

      setTimeout(function() {
        done();
      }, duration);

      //run the animation here and call done when the animation is complete
      return function(cancelled) {
        if (headerName) {
          $rfzCss.setTransform(headerName, "");
        }
        if (leftButton) {
          $rfzCss.setTransform(leftButton, "");
        }
      };
    },

    leave : function(element, done) {
      var width = element[0].getBoundingClientRect().width;
      var headerName = element[0].querySelector(".rfz-view-header-name");
      var leftButton = element[0].querySelector(".rfz-view-header-button-back-contents");

      if (headerName) {
        var headerSize = $rfzCss.textRect(headerName);
        $rfzCss.setTranslate(headerName);
      }
      if (leftButton) {
        var buttonSize = $rfzCss.textRect(leftButton);
      }

      _.delay(function() {
        if (headerName) {
          $rfzCss.setTranslate(headerName, (width / 2) + (headerSize.width / 2));
        }
        if (leftButton) {
          $rfzCss.setTranslate(leftButton, (width / 2) - (buttonSize.width / 2));
        }
      }, 10);

      setTimeout(function() {
        done();
      }, duration);
    },
    addClass: function(element, className, done) {
      if (className === "ng-hide") {
        var width = element[0].getBoundingClientRect().width;
        var headerName = element[0].querySelector(".rfz-view-header-name");

        if (headerName) {
          var size = $rfzCss.textRect(headerName);
          $rfzCss.setTranslate(headerName, (-1 * (width / 2)) + (size.width / 2) + 27);
        }

        setTimeout(function() {
          $rfzCss.setTransform(headerName, "");
          done();
        }, duration);
      }
    },
    beforeRemoveClass: function(element, className, done) {
      if (className === "ng-hide") {
        var width = element[0].getBoundingClientRect().width;
        var headerName = element[0].querySelector(".rfz-view-header-name");

        if (headerName) {
          var size = $rfzCss.textRect(headerName);
          $rfzCss.setTranslate(headerName, (-1 * (width / 2)) + (size.width / 2) + 27);
          console.log(headerName.style.webkitTransform);
          console.log(element[0].className);
        }
        done();
        setTimeout(function() {
          $rfzCss.setTransform(headerName, "");
        }, duration);
      }
    }
  };
}]);
