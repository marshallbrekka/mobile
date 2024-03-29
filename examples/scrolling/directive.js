module.directive("paralaxScroll", ["$rfz.util.scrollView", function(ScrollView) {
  return {
    restrict : "A",
    require : "rfzScrollViewListener",
    link : {
      pre : function(scope, element, attr, ctrl) {
        var views = {};
        var distanceFactor = parseFloat(attr.distanceFactor);

        var listener = {
          handleScrollEvent : function (e, view, args) {
            var viewName = _.chain(views)
              .pairs()
              .filter(function(kv) {
                return kv[1] == view;
              })
              .first().first().value();
            if (e === ScrollView.CHANGE_POSITION_EVENT) {
              var position, targetView;
              switch(viewName) {
              case "header":
                position = view.position.copy().divide(view.pageSizeFactor);
                targetView = views.content;
                break;
              case "content":
                position = view.position.copy().multiply(views.header.pageSizeFactor);
                targetView = views.header;
                break;
              }
              if (targetView) {
                if (args) {
                  targetView.setPositionAnimated(position, true, args);
                } else {
                  targetView.setPosition(position);
                }
              }

            } else if (e === ScrollView.MOVE_TRANSITION_END_EVENT ||
                       e === ScrollView.END_DECELERATION_EVENT) {
              if (viewName === "header") {
                views.content.adjustHeight();
              }
              views.container.calculateMaxPoint();
              views.container.snapPositionToBounds(true);
            }
          }
        }
        
        ctrl.setAddListener(function(nameAdded) {
          views = ctrl.getScrollViews();
          views[nameAdded].addListener(listener);
        });

        views = ctrl.getScrollViews();
        _.each(views, function(v) {
          v.addListener(listener);
        });
      }
    }
  }
}]);
