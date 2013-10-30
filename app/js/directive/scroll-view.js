define([
  "config/rfz",
  "utils/scrollView",
  "utils/attrs"
], function(
  RFZ,
  ScrollView,
  attrsUtils
){

RFZ.controller("rfzScrollView", function() {
  return {
    height : function() {
      return 0;
    }
  }
});

RFZ.controller("rfzScrollViewListenerCtrl", function() {
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
    controller : "rfzScrollViewListenerCtrl"
  };
});

RFZ.directive("rfzScrollView", function() {
  return {
    restrict : "A",
    require : "?^rfzScrollViewListener",
    replace : true,
    transclude : "element",
    templateUrl : "/partials/scroll-view2.html",
    compile : function() {
      var scroll = 0;
      return function(scope, element, attrs, ctrl) {
        var el = element[0];
        var scroll = new ScrollView({
          container : el.children[0],
          content : el.children[0].children[0],
          canScrollX : attrsUtils.get(attrs, "canScrollX", true, attrsUtils.toBoolean),
          canScrollY : attrsUtils.get(attrs, "canScrollY", true, attrsUtils.toBoolean),
          showIndicatorX : attrsUtils.get(attrs, "showIndicatorX", true, attrsUtils.toBoolean),
          showIndicatorY : attrsUtils.get(attrs, "showIndicatorY", true, attrsUtils.toBoolean),
          pageSizeFactor : attrsUtils.get(attrs, "pageSizeFactor", 1, parseFloat),
          pagingEnabled : attrsUtils.get(attrs, "pagingEnabled", false, attrsUtils.toBoolean)
        });
        if (ctrl && attrs.scrollViewName) {
          ctrl.registerScrollView(attrs.scrollViewName, scroll);
        }
      }
    }
  }
});
});
