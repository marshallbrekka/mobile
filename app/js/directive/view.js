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
RFZ.controller("rfzView", function($scope) {
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
});

// The rfzView can contain multiple panes, and controlls how they are
// switched between. It is esentially a wrapper for ng-switch, but
// adds a few custom attributes and classes so that we can control the
// slide direction when changing panes.
RFZ.directive("rfzView", function($animator) {
  function directionToClass(dir) {
    if(!dir) dir = "no-animation";
    return "rfz-view-direction-" + dir;
  }

  return {
    restrict: 'A',
    require: 'rfzView',
    controller : "rfzView",
    transclude : true,
    replace : true,
    scope : true,
    template : "<div ng-switch=\"rfzView\" ng-animate=\"'rfz-view'\"><div ng-transclude></div></div>",
    link: function(scope, element, attr, ngSwitchController) {
      scope.rfzView = attr.rfzView;
      scope.$watch("rfzViewDirection", function(value, preValue) {
        
        element.removeClass(directionToClass(preValue));
        element.addClass(directionToClass(value));
      });
      element.addClass("rfz-view");
      if (attr.noMenu) {
        element.addClass("no-menu");
      }
    }
  }
});

// An individual pane contained within an rfzView.
RFZ.directive("rfzPane", function() {
  return {
    restrict : "A",
    transclude : "element",
    priority : 500,
    require : "^ngSwitch",
    compile : function(tElement, attrs, transclude) {
      return function(scope, element, attr, ctrl) {
        element.addClass("rfz-pane");
        ctrl.cases['!' + attrs.rfzPane] = (ctrl.cases['!' + attrs.rfzPane] || []);
        ctrl.cases['!' + attrs.rfzPane].push({ transclude: transclude, element: element });
      };
    }
  }
});


// Creates the pane header, the value of the attribute becomes the
// title of the header. It also adds some classes for us.
//
// <div rfz-pane-header="Overview">
RFZ.directive("rfzPaneHeader", function() {
  return {
    restrict : "A",
    compile : function(element, attrs) {
      if(!attrs.compiled) {
        element.attr("compiled", true);
        element.append($("<div class='header-name'>" + attrs.rfzPaneHeader + "</div>"))
               .removeAttr("rfzPaneHeader")
               .addClass("header");
      }
    }
  }
});

RFZ.directive("rfzPaneHeaderButton", function() {
  return {
    restrict : "A",
    require : "^rfzView",
    compile : function(elem, attrs, link) {
      if (true) {
        elem.attr("compiled", true);
        elem.addClass("header-button");
        elem.addClass(attrs.position);
        if (attrs.type === "back") elem.addClass("back");
        elem.removeAttr("position").removeAttr("type").removeAttr("action");
      }
    }
  }
});

// This directive simply adds a class to its element, which is
// neccesary for the pane change animation, where the body slides
// but the header fades.
RFZ.directive("rfzPaneBody", function() {
  return {
    restrict : "A",
    priority : 1000,
    link : function(scope, element, attrs) {
      element.addClass("rfz-pane-body");
    }
  }
});

// This directive registers an touch event handler that
// when clicked changes the pane that is shown in the parent view.
//
// This will change the pane to "settings" which is revealed from the right.
// <div rfz-change-pane="settings" rfz-change-direction="right">
RFZ.directive("rfzChangePane", function() {
  return {
    restrict : "A", 
    require : "^rfzView",
    link : function(scope, element, attrs, ctrl) {
      onTouch(element, function() {
        scope.$broadcast("rfzViewChange");
        ctrl.openPane(attrs.rfzChangePane, attrs.rfzChangeDirection);
      });
    }
  }
});
