define([
  "config/rfz",
  "utils/scrollView",
  "utils/attrs"
], function(
  RFZ,
  ScrollView,
  attrsUtils
) {

RFZ.controller("rfzScrollViewListener", function() {
  var scrollViews = {};
  var cb;
  return {
    registerScrollView : function(name, view) {
      scrollViews[name] = view;
      cb(name);
    },
    getScrollViews : function() {
      return scrollViews;
    },
    setAddListener : function(callback) {
      cb = callback;
    }
  }
});


RFZ.directive("rfzScrollViewListener", function() {
  return {
    controller : "rfzScrollViewListener",
    require : "rfzScrollViewListener",
    scope : true
  };
});

RFZ.directive("rfzScrollView", function() {
  return {
    restrict : "A",
    require : "?^rfzScrollViewListener",
    replace : true,
    transclude : true,
    templateUrl : "/partials/scroll-view2.html",
    compile : function(tElement, attrs) {
      var scroll = 0;
      return {post : function(scope, element, attrs, ctrl) {
        var el = element[0];
        var content = element.children();
        if (content.attr("rfz-scroll-view-body") === undefined) {
          throw new Error("rfz-scroll-view requires an rfz-scroll-view-body");
        } else {
          content = content[0];
        }
        var scroll = new ScrollView({
          container : el,
          content : content,
          canScrollX : attrsUtils.get(attrs, "canScrollX", true, attrsUtils.toBoolean),
          canScrollY : attrsUtils.get(attrs, "canScrollY", true, attrsUtils.toBoolean),
          showIndicatorX : attrsUtils.get(attrs, "showIndicatorX", true, attrsUtils.toBoolean),
          showIndicatorY : attrsUtils.get(attrs, "showIndicatorY", true, attrsUtils.toBoolean),
          pageSizeFactor : attrsUtils.get(attrs, "pageSizeFactor", 1, parseFloat),
          pagingEnabled : attrsUtils.get(attrs, "pagingEnabled", false, attrsUtils.toBoolean),
          autoPageHeight : attrsUtils.get(attrs, "autoPageHeight", false, attrsUtils.toBoolean)
        });
        if (ctrl && attrs.rfzScrollView) {
          ctrl.registerScrollView(attrs.rfzScrollView, scroll);
        }

        // adjust height on next tick to ensure that all content has
        // been inserted according to angulars watch/digest lifecycle.
        setTimeout(function() {
          if (scroll.autoPageHeight) {
            scroll.adjustHeight();
          }
          scroll.calculateMaxPoint();
        }, 4);


      }}
    }
  }
});

RFZ.directive("rfzScrollViewBody", function() {
  return {
    restrict : "A",
    replace : true,
    transclude : true,
    template : "<div class='scroll-content' ng-transclude></div>",
    link : function(scope) {
      console.log(arguments);
    }
  }
});
});
