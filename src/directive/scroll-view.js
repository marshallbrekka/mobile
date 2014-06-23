lib.directive("rfzScrollViewListener", function() {
  return {
    controller : function() {
      var scrollViews = {};
      var cb;
      return {
        registerScrollView : function(name, view) {
          scrollViews[name] = view;
          if (cb) {
            cb(name);
          }
        },
        getScrollViews : function() {
          return scrollViews;
        },
        setAddListener : function(callback) {
          cb = callback;
        }
      }
    },
    require : "rfzScrollViewListener",
    scope : true
  };
});

lib.directive("rfzScrollView", ["$rfz.util.scrollView", "$rfz.util.attrs", "$rfz.util.events",
                                function(ScrollView, attrsUtils, events) {
  return {
    restrict : "A",
    require : ["rfzScrollView","?^rfzScrollViewListener"],
    replace : true,
    transclude : true,
    template : "<div class='rfz-scroll-view-container' ng-transclude></div>",
    controller : function(){},
    scope : {
      currentPage : "="
    },
    link : function(scope, element, attrs, ctrls) {
      ctrls[0].element = element;
      var ctrl = ctrls[1];
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
      ctrls[0].scrollView = scroll;

      // adjust height on next tick to ensure that all content has
      // been inserted according to angulars watch/digest lifecycle.
      // Update: this might actually be due to a bug in the
      // animation module in the RC version we are using.
      // TODO: after updating version check if issues still exists.
      setTimeout(function() {
        if (scroll.autoPageHeight) {
          scroll.adjustHeight();
        }
        if (scope.currentPage) {
          scroll.scrollToPage(scope.startPage);
          scope.$watch("currentPage", function(newVal, oldVal) {
            if (newVal !== oldVal) {
              scroll.scrollToPage(newVal, true);
            }
          });
        }
        scroll.calculateMaxPoint();
      }, 4);

      var resize = _.throttle(function() {
        scroll.calculateMaxPoint();
        scroll.snapPositionToBounds(true);
      }, 500);

      events.bind(window, resize, "resize");
      scope.$on("$destroy", function() {
        events.unbind(window, resize, "resize");
      });
    }
  }
}]);

lib.directive("rfzScrollViewBody", function() {
  return {
    restrict : "A",
    replace : true,
    transclude : true,
    controller : function() {},
    require : "rfzScrollViewBody",
    template : "<div class='rfz-scroll-view-content' ng-transclude></div>",
    link : function(scope, element, attr, ctrl) {
      ctrl.element = element;
    }
  }
});
