/**
The following controller and directives make up all the pieces that
are neccesary to make the pane views/transitions work correctly, and
be controlled easily through setting html attributes.
*/

/*
When the directive is first initialized the value for
rfz-view-stack becomes the first view on the history stack.

With nested view stacks, if the length of the history is equal to 1
and the $pop method was called, then it looks for its controller on
its parent and calls $pop there, thus removing the current view from
the stack, as well as the last view on the parents stack.
*/
lib.directive("rfzViewStack", ["$animate", "$parse", "$rfz.util.events", function($animate, $parse, events) {
  function transitionClass(type) {
    return "rfz-view-stack-transition-" + type;
  }

  function stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
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
      // The name of the root view of the stack, can be changed.
      // It is set by watching the value of attr.rfzViewStack.
      var rootView;

      /*
        Pushes the root view onto the stack. The root view can either
        be a string or an object with keys name, and parameters.
      */
      function pushRootView() {
        if (typeof rootView === "string") {
          pushView(rootView, "none", {}, true);
        } else {
          pushView(rootView.name, "none", rootView.parameters, true);
        }
      }

      function rootViewName() {
        if (typeof rootView === "string") {
          return rootView;
        } else if (rootView) {
          return rootView.name;
        }
      }

      var restoreStackFn = $parse(attr["restoreStack"]);
      var notifyStackChangeFn = $parse(attr["onStackChange"]);

      function notifyStackChange() {
        notifyStackChangeFn(scope, {stack : ctrl.history});
      }

      var parentController = element.parent().controller("rfzViewStack");
      if (parentController) {
        ctrl.depthIndex = parentController.depthIndex + 1;
      }

      function removeViewsSilently(views) {
        _.each(views, function(view) {
          view.scope.$destroy();
          view.element.remove();
        });
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
          removeViewsSilently(silentRemove);

          element.addClass(transitionClass(transition));
          current.element.addClass("rfz-js-header-animation-" + transition);
          previous.element.addClass("rfz-js-header-animation-" + transition);
          current.scope.$broadcast("$navStackViewPop");
          current.scope.$destroy();

          events.bind(previous.element[0], stopEvent, events.POINTER_START, true);
          $animate.removeClass(previous.element, "ng-hide", function() {
            events.unbind(previous.element[0], stopEvent, events.POINTER_START, true);
            previous.scope.$broadcast("$navStackViewFocus");
          });
          events.bind(current.element[0], stopEvent, events.POINTER_START, true);
          $animate.leave(current.element, function() {
            events.unbind(current.element[0], stopEvent, events.POINTER_START, true);
            element.removeClass(transitionClass(current.transition));
            previous.element.removeClass("rfz-js-header-animation-" + transition);
          });
          ctrl.depthIndex--;

          if (ctrl.history.length === 1 &&
              rootViewName() === ctrl.history[0].name) {
            document.removeEventListener("backbutton", backButtonHandler, false);
          }
          scope.$rfzViewStack.$$currentViewName = _.last(ctrl.history).name;
          notifyStackChange();
        }
      }

      function pushView(name, transitionType, properties, reset, restoreStackCb) {
        var viewObj = ctrl.views[name];
        if (reset) {
          var silentRemove = ctrl.history;
          ctrl.history = [];
        }
        if (!viewObj) {
          throw new Error("rfzViewStack: tried to push the view " + name +
                          " but no view by that name exists");
        }
        element.addClass(transitionClass(transitionType));
        // Properties to use for the new view
        var newScope = viewObj.scope.$new();
        var view = {
          name : name,
          scope : newScope,
          transition : transitionType
        };
        if (restoreStackCb) {
          transitionType = "none";
        }

        viewObj.transclude(view.scope, function(clone) {
          clone.addClass("rfz-pane");
          clone.addClass("rfz-js-header-animation-" + transitionType);
          clone.css("z-index", ctrl.depthIndex++ + "");
          view.element = clone;
          var anchor = viewObj.element;
          var current;
          newScope.$rfzViewProperties = properties || {};
          if (ctrl.history.length === 0) {
            if (silentRemove) {
              current = silentRemove[silentRemove.length - 1];
            }
          } else {
            current = ctrl.history[ctrl.history.length - 1];
            newScope.$rfzViewProperties.canGoBack = true;
            newScope.$rfzViewProperties.previous = current.scope.$rfzViewProperties;
          }

          ctrl.history.push(view);
          // notify the stack change listener if we aren't being restored
          if (!restoreStackCb) {
            notifyStackChange();
          }
          events.bind(clone[0], stopEvent, events.POINTER_START, true);
          $animate.enter(clone, anchor.parent(), anchor, function() {
            removeViewsSilently(silentRemove);
            events.unbind(clone[0], stopEvent, events.POINTER_START, true);
            element.removeClass(transitionClass(transitionType));
            clone.removeClass("rfz-js-header-animation-" + transitionType);
            if (current) {
              current.element.removeClass("rfz-js-header-animation-" + transitionType);
            }
          });
          if (current) {
            current.element.addClass("rfz-js-header-animation-" + transitionType);
            events.bind(current.element[0], stopEvent, events.POINTER_START, true);
            // attempt to allow the enter animation to start before
            // the class one, which is faster than enter.
            _.defer(function() {
              $animate.addClass(current.element, "ng-hide", function() {
                events.unbind(current.element[0], stopEvent, events.POINTER_START, true);
              });
            });
          }


          if (ctrl.history.length === 2) {
            document.addEventListener("backbutton", backButtonHandler, false);
          } else if (ctrl.history.length === 1) {
            if (rootViewName() !== name) {
              document.addEventListener("backbutton", backButtonHandler, false);
            } else {
              document.removeEventListener("backbutton", backButtonHandler, false);
            }
          }
          scope.$rfzViewStack.$$currentViewName = name;
          if (restoreStackCb) {
            restoreStackCb();
          }

        });
      }

      ctrl.$$pop = popView;

      element.addClass("rfz-view");
      var previousStack = scope.$rfzViewStack;
      scope.$rfzViewStack = {
        $push : function(name, transitionType, params, reset) {
          // wrap in a defer to ensure that any child scope
          // $digest calls have completed.
          _.defer(function() {
            pushView(name, transitionType, params, reset);
            scope.$apply();
          });
        },
        $pop : function(name) {
          // wrap in a defer to ensure that any child scope
          // $digest calls have completed.
          _.defer(function() {
            popView(name);
            scope.$apply();
          });
        },
        $$currentViewName : null
      };

      scope.$watch(attr.rfzViewStack, function(val, previous) {
        rootView = val;
        if (ctrl.history.length === 0) {
          pushRootView();
        } else if (ctrl.history.length === 1 &&
                   ctrl.history[0].name === rootViewName()) {
          document.removeEventListener("backbutton", backButtonHandler, false);
        }
      }, true);

      // Restores the view stack with the result of restoreStackFn if
      // it returns anything.
      (function() {
        var history = restoreStackFn(scope);
        function restoreView() {
          var viewToAdd = history.shift(0, 1);
          pushView(viewToAdd.name, viewToAdd.transition, viewToAdd.parameters, false, (history.length !== 0 ? restoreView : null));
        }

        if (history) {
          restoreView();
        }
      })();

      scope.$on("$destroy", function() {
        notifyStackChangeFn(scope, {stack : null});
        document.removeEventListener("backbutton", backButtonHandler, false);
      });

      // TODO make the back button event handler deal with nested nav stacks.
      function backButtonHandler(e) {
        // wrap $apply in a defer to ensure that any child scope
        // $digest calls have completed.
        _.defer(function() {
          scope.$apply(function() {
            if (ctrl.history.length === 1 &&
                ctrl.history[0].name !== rootViewName()) {
              pushRootView();
              document.removeEventListener("backbutton", backButtonHandler, false);
            } else {
              popView();
            }
          });
        });
      }
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
        element : element,
        scope : scope
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
      element.addClass("rfz-view-header");
      return {
        pre : function(scope, element, attr) {
          scope.$watch(attr.rfzViewHeader, function(val) {
            scope.$viewName = val;
            if (scope.$rfzViewProperties) {
              scope.$rfzViewProperties.title = scope.$viewName;
            }
          });
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


lib.animation('.rfz-js-header-animation-side', ["$rfz.util.css", "$rfz.util.platform",
                                           function($rfzCss, $platform) {
  var duration = 300;
  if ($platform.os === $platform.PLATFORMS.IOS &&
      $platform.version.major >= 7) {
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
          $rfzCss.setTranslate(leftButton,(width / 2) - (size.width / 2) - 27);
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
            $rfzCss.setTranslate(leftButton,
                                 (width / 2) - (buttonSize.width / 2) - 27);
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
            $rfzCss.setTranslate(headerName,
                                 (-1 * (width / 2)) + (size.width / 2) + 27);
            setTimeout(function() {
              $rfzCss.setTransform(headerName, "");
              done();
            }, duration);
          }
        }
      },
      beforeRemoveClass: function(element, className, done) {
        if (className === "ng-hide") {
          var width = element[0].getBoundingClientRect().width;
          var headerName = element[0].querySelector(".rfz-view-header-name");

          if (headerName) {
            var size = $rfzCss.textRect(headerName);
            $rfzCss.setTranslate(headerName,
                                 (-1 * (width / 2)) + (size.width / 2) + 27);
            setTimeout(function() {
              $rfzCss.setTransform(headerName, "");
            }, duration);
          }
          done();

        }
      }
    }
  } else {
    return {}
  };
}]);
