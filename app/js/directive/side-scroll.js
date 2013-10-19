define(["config/rfz"], function(RFZ){

//window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

RFZ.controller("SideScrollBind", function() {
  console.log("OMG CTRL");
  var viewA;
  var viewB;
  return {
    addLink : function(view) {
      if (!viewA) {
        viewA = view;
      } else if (!viewB) {
        viewB = view;
        viewA.delegate = view;
        viewB.delegate = viewA;
      } else {
        throw new Exception("can only bind at most 2 scroll views");
      }
    }
  }
});

RFZ.directive("rfzSideScrollBind", function() {
  return {
    restrict : "A",
    controller : "SideScrollBind",
    link : function(scope, element, attrs, ctrl) {
      ctrl._bindElement = element[0];
    }
  }
});

RFZ.directive("rfzSideScroll", function() {
  // To make this easier in the future record everything as x/y points
  // Scrolling down should result in a negative y, then on a touch
  // release use this logic 
  // c.x = Math.min(Math.max(this.minPoint.x, this._contentOffset.x), 0);
  // c.y = Math.min(Math.max(this.minPoint.y, this._contentOffset.y), 0);
  // Where contentOffset is where we currently are;
  // THis is only for dragging byond bounds
  function Point(x, y) {
    this.x = x != null ? x : 0;
    this.y = y != null ? y : 0;
  }

  function translateXCSS(x) {
    return "translate3d(" + x + "px, 0, 0)";    
  }

  Point.fromEvent = function (e) {
    var e = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
    return new Point(e.pageX, e.pageY);
  }

  Point.copy = function(pt) {
    return new Point(pt.x, pt.y);
  }

  function ScrollView(container, slider, width, pages, startIndex) {
    this._container = container;
    this._slider = slider;
    this._width = width;
    this._pages = pages;
    this.pageIndex = startIndex;
    this._contentOffset = new Point(width * pages.length * startIndex * -1);
    this.pagingEnabled = true;
    this.bounces = true;
    this.clipsToBounds = true;
    this.endFriction = 0.5;
    this.tracksTouchesOnceTouchesBegan = true;
    this.adjustableHeight = false;
    slider.addEventListener("webkitTransitionEnd", this, false);
    slider.addEventListener("webkitTransitionEnd", this, false);
    slider.addEventListener("touchstart", this, true);

    if (this.pagingEnabled) {
      this.callWithDelay(function() {
        if (this.adjustableHeight) {
          this.setHeight(startIndex);
        }
      }, 500);
    }
  }

  ScrollView.prototype.setHeight = function(pageIndex) {
    var self = this;
    requestAnimationFrame(function() {
      
      var newHeight = self._pages[pageIndex].offsetHeight;
      var containerRect = self._container.getBoundingClientRect();
      if (newHeight < containerRect.height) {
        var calcHeight = true;
        var parentRect = self._container.offsetParent.getBoundingClientRect();
        while (calcHeight) {
          self._container.style.height = (containerRect.height - 1) + "px";

          var newParent = self._container.offsetParent.getBoundingClientRect();
          if (newParent.height == parentRect.height || containerRect.height == newHeight) {
            calcHeight = false;
          } else {
            var containerRect = self._container.getBoundingClientRect();
          }
          parentRect = newParent;
        }
        newHeight = containerRect.height;
      }
      self._container.style.height = newHeight + "px";
    });
  }

  ScrollView.prototype.callWithDelay = function(fn, delay) {
    var self = this;
    return setTimeout(function() {
      fn.call(self);
    }, delay);
  }

  ScrollView.minimumTrackingForDrag = 5;
  ScrollView.maxTrackingTime = 100;
  ScrollView.acceleration = 15;
  ScrollView.pagingPenetrationDeceleration = 0.5;
  ScrollView.pagingPenetrationAcceleration = 0.2;
  ScrollView.penetrationDeceleration = 0.03;
  ScrollView.penetrationAcceleration = 0.08;
  ScrollView.minVelocityForDeceleration = 1;
  ScrollView.minVelocityForDecelerationWithPaging = 4;
  ScrollView.minVelocityForPaginBounce = 10;
  ScrollView.desiredAnimationFrameRate = 1000 / 60;
  ScrollView.decelerationFrictionFactor = 0.95;
  ScrollView.pagingDecelerationFrictionFactor = 0.98;
  ScrollView.pagingTransitionDuration = "0.25s";
  ScrollView.minimumVelocity = 0.01;

  ScrollView.prototype.handleEvent = function (e) {
    switch (e.type) {
    case "touchstart":
      this.beginTracking(e);
      break;
    case "touchmove":
      this.touchesMoved(e);
      break;
    case "touchend":
      this.touchesEnded(e);
      break;
    case "touchcancel":
      this.touchesEnded(e);
      break;
    case "webkitTransitionEnd":
      this.transitionEnded(e);
      break;
    }
  }

  ScrollView.prototype.didScroll = function(animate) {
    if (this.delegate) {
      this.delegate.scrollViewDidScroll(this, animate);
    }
  }

  ScrollView.prototype.didEndScroll = function() {
    this.endScroll();
    if (this.delegate) {
      var d = this.delegate;
      this.delegate = null;
      d.endScroll();
      this.delegate = d;
    }
  }

  ScrollView.prototype.endScroll = function() {
    console.log("END SCROLL");
    if (this.pagingEnabled && this.adjustableHeight) {
      var newPageIndex = Math.round(this._contentOffset.x / this._width) * -1;
      console.log("NEW PAGE INDEX " + newPageIndex);
      if (newPageIndex != this.pageIndex) {
        this.pageIndex = newPageIndex;
        this.setHeight(newPageIndex);
      }
    }
  }

  ScrollView.prototype.scrollViewDidScroll = function(view, animate) {
    var delegate = this.delegate;
    this.delegate = null;
    if (!animate) {
      this.transitionEnded();
    }
    this.delegate = delegate;
    var percentX = view._contentOffset.x / view._width;
    var newX = percentX * this._width;
    this.delegate = null
    this.setContentOffsetWithAnimation(new Point(newX), animate);
    this.delegate = delegate;
  }

  ScrollView.prototype.setContentOffset = function(destination) {
    this.setContentOffsetWithAnimation(destination, false);
  }
  
  ScrollView.prototype.setContentOffsetWithAnimation = function(destination, animate) {
    this._contentOffset = destination;
    this._slider.style.webkitTransform = translateXCSS(this._contentOffset.x);
    if (animate) {
      this.scrollTransitionsNeedRemoval = true;
      this._slider.style.webkitTransitionDuration = ScrollView.pagingTransitionDuration;
    }
    this.didScroll(animate);
  }

  ScrollView.prototype.snapContentOffsetToBounds = function(animate) {
    var animate = false;
    var point = new Point();
    if (this.pagingEnabled) {
      point.x = Math.round(this._contentOffset.x / this._width) * this._width;
      animate = true;
    } else {
      if (this.bounces) {
        point.x = Math.min(Math.max(this.minPoint.x, this._contentOffset.x), 0);
        animate = point.x != this._contentOffset.x; 
X      }
    }
    if (animate) {
      this.setContentOffsetWithAnimation(point, animate);
    }
  }

  ScrollView.prototype.transitionEnded = function (e) {
    if (this.scrollTransitionsNeedRemoval) {
      this.scrollTransitionsNeedRemoval = false;
      this._slider.style.webkitTransitionDuration = 0;
      this.didScroll(false);
      this.didEndScroll();
    }
  };

  ScrollView.prototype.removeEventListeners = function() {
    window.removeEventListener("touchmove", this, true);
    window.removeEventListener("touchend", this, true);
    window.removeEventListener("touchcancel", this, true);
    window.removeEventListener("touchend", this, false);
  }

  ScrollView.prototype.beginTracking = function(e) {
    if (this.tracking) return;
//    e.preventDefault();
    this.stopDecelerationAnimation();
    console.log(this._width + " " + this._pages.length);
    this.minPoint = new Point(this._width - (this._pages.length * this._width), 0);
    console.log("MIN POINT " + this.minPoint.x);
    this.startPosition = this._contentOffset;
    this.startTouchPosition = Point.fromEvent(e);
    this.startTime = e.timeStamp;
    this.startTimePosition = Point.copy(this._contentOffset);
    this.tracking = true;
    this.dragging = false;
    this.bounces = true;
    this.touchesHaveMoved = false;
    window.addEventListener("touchmove", this, true);
    window.addEventListener("touchend", this, true);
    window.addEventListener("touchcancel", this, true);
    window.addEventListener("touchend", this, false);
  }

  ScrollView.prototype.touchesMoved = function(e) {
    this.touchesHaveMoved = true;
    var point = Point.fromEvent(e);
    var xDistance = point.x - this.startTouchPosition.x;
    var yDistance = point.y - this.startTouchPosition.y;
    if (!this.dragging) {
      if (Math.abs(xDistance) <= Math.abs(yDistance)) {
        this.removeEventListeners();
        this.tracking = false;
      } else {
        this.dragging = true;
        this.firstDrag = true;
      }
    }
    if (this.dragging) {
      e.preventDefault();
      var newX = this.startPosition.x + xDistance;
      console.log("PRE NEW X " + newX);
      newX -= (newX < this.minPoint.x ? 
               newX - this.minPoint.x :
               (newX > 0 ? newX : 0)) * this.endFriction;
/*      if (newX < this.minPoint.x) {
        return newX - this.minPoint.x;
      } else if (newX > 0) {
        return newX;
      } else {
        return 0;
      }*/
      console.log("NEW X " + newX);
      if (this.firstDrag) {
        this.firstDrag = false;
        this.startTouchPosition = point;
        return;
      }
      this.setContentOffset(new Point(newX));
      this.lastEventTime = e.timeStamp;
      if (this.lastEventTime - this.startTime > ScrollView.maxTrackingTime) {
        this.startTime = this.lastEventTime;
        this.startTimePosition = Point.copy(this._contentOffset);
      }
    }
  }

  ScrollView.prototype.touchesEnded = function(e) {
    this.tracking = false;
    if (this.dragging) {
      this.dragging = false;
      e.stopPropagation();
      if (e.timeStamp - this.lastEventTime <= ScrollView.maxTrackingTime) {
        this._contentOffsetBeforeDeceleration = Point.copy(this._contentOffset);
        this.startDecelerationAnimation();
      }
    }
    if (!this.decelerating) {
      this.snapContentOffsetToBounds(true);
    }
    this.removeEventListeners();
    if(this.touchesHaveMoved) {
      e.stopPropagation();
    }
  }

  ScrollView.prototype.startDecelerationAnimation = function() {
    var distance = new Point(this._contentOffset.x - this.startTimePosition.x, 0);
    var acceleration = (event.timeStamp - this.startTime) / ScrollView.acceleration;
    this.decelerationVelocity = new Point(distance.x / acceleration, 0);
    this.minDecelerationPoint = Point.copy(this.minPoint);
    this.maxDecelerationPoint = new Point();
    if (this.pagingEnabled) {
      this.minDecelerationPoint.x = Math.max(
        this.minPoint.x,
        Math.floor(this._contentOffsetBeforeDeceleration.x / this._width)
          * this._width);
      this.maxDecelerationPoint.x = Math.min(
        0, Math.ceil(this._contentOffsetBeforeDeceleration.x / this._width) * this._width);
    }
    this.penetrationDeceleration = this.pagingEnabled ?
                                     ScrollView.pagingPenetrationDeceleration :
                                     ScrollView.penetrationDeceleration;
    this.penetrationAcceleration = this.pagingEnabled ?
                                     ScrollView.pagingPenetrationAcceleration :
                                     ScrollView.penetrationAcceleration;

    var minVelocityForDeceleration = this.pagingEnabled ? 
      ScrollView.minVelocityForDecelerationWithPaging :
      ScrollView.minVelocityForDeceleration;
    if (Math.abs(this.decelerationVelocity.x) > minVelocityForDeceleration) {
//      if (this.pagingEnabled && Math.abs(distance.x / acceleration) < 20) {
//        this.decelerationVelocity = new Point(distance.x < 0 ? -25 : 25, 0);
//      }
      this.startDecelerationVelocity = Point.copy(this.decelerationVelocity);
      this.decelerating = true;
      this.lastFrame = new Date();
      this.callWithDelay(this.stepThroughDecelerationAnimation,
                         ScrollView.desiredAnimationFrameRate);
    }
  }

  ScrollView.prototype.stopDecelerationAnimation = function() {
    this.decelerating = false;
    clearTimeout(this.decelerationTimer);
  }

  ScrollView.prototype.stepThroughDecelerationAnimation = function(dontUpdateView) {
    if (!this.decelerating) {
      return;
    }
    var now = new Date();
    var elapsedTime = now - this.lastFrame;
    var frames = dontUpdateView ?
      0 : (Math.round(elapsedTime / ScrollView.desiredAnimationFrameRate) - 1);
    for (var j = 0; j < frames; j++) {
      this.stepThroughDecelerationAnimation(true);
    }
    var newX = this._contentOffset.x + this.decelerationVelocity.x;
    if (!this.bounces) {
        var maxX = Math.min(Math.max(this.minPoint.x, newX), 0);
        if (maxX != newX) {
          newX = maxX;
          this.decelerationVelocity.x = 0;
        }

    }
/*    if (this.pagingEnabled && Math.abs(this.startDecelerationVelocity.x) < 30) {
      if (this.minDecelerationPoint.x != this.maxDecelerationPoint.x) {
        if (newX < this.minDecelerationPoint.x) {
          this.decelerationVelocity.x = 0;
          newX = this.minDecelerationPoint.x;
        } else if (newX > this.maxDecelerationPoint.x) {
          this.decelerationVelocity.x = 0;
          newX = this.maxDecelerationPoint.x;
        }
      }
    }*/
    if (dontUpdateView) {
      this._contentOffset.x = newX;
    } else {
      this.setContentOffset(new Point(newX));
    }
    if (!this.pagingEnabled) {
      this.decelerationVelocity.x *= ScrollView.decelerationFrictionFactor;
    }
    var xVelocity = Math.abs(this.decelerationVelocity.x);
    if(!dontUpdateView && xVelocity <= ScrollView.minimumVelocity) {
      this.decelerating = false;
      this.didEndScroll();
      return;
    }

    if (!dontUpdateView) {
      this.decelerationTime = this.callWithDelay(this.stepThroughDecelerationAnimation,
                                                 ScrollView.desiredAnimationFrameRate);
    }
    if (this.bounces) {
      var point = new Point();
      if (newX < this.minDecelerationPoint.x) {
        point.x = this.minDecelerationPoint.x - newX;
      } else if (newX > this.maxDecelerationPoint.x) {
        point.x = this.maxDecelerationPoint.x - newX;
      }
      if (point.x != 0) {
        if (point.x * this.decelerationVelocity.x <= 0) {
          this.decelerationVelocity.x += point.x *  this.penetrationDeceleration;
        } else {
          this.decelerationVelocity.x = point.x * this.penetrationAcceleration;
        }
      }
    }
    if(!dontUpdateView) {
      this.lastFrame = now;
    }
  }

  return {
    restrict : "A",
    transclude : true,
    require : "^?rfzSideScrollBind",
    compile : function(tElement, tAttrs, transclude) {
      tElement.addClass("side-scroll");
      return {
        pre : function(scope, element, attrs, ctrl) {
/*          var startIndex = 0;
          var itemLength = scope[attrs.rfzSideScroll].length;
          if (attrs.start === "end") {
            startIndex = itemLength - 1;
          }
          var container = $("<div class=\"side-scroll-container\"></div>");
          var pagePercent = (parseFloat(attrs.pagePercent) || 1)
          element.append(container);
          container.width((100 * itemLength * pagePercent) + "%");
          var pages = [];


          for (var i = 0; i < itemLength; i++) {
            var itemScope = scope.$new();
            itemScope[attrs.as] = scope[attrs.rfzSideScroll][i];
            transclude(itemScope, function(clone) {
              clone.css({ "float" : "left", width : (100 / Math.max(itemLength, 1)) +  "%"});
              for (var i = 0; i < clone.length; i++) {
                if (clone[i].nodeType == 1) {
                  pages.push(clone[i]);
                  break;
                }
              }
              container.append(clone);
            });
          }
          scope._sliderSetup = function () {
            var slider = new ScrollView(element[0], 
                                        container[0],
                                        element.width() * pagePercent,
                                        pages, 0);
            if (attrs.adjustableHeight) {
              slider.adjustableHeight = true;
            }
            slider.endFriction += (1 - pagePercent) / 2;
            if (ctrl) {
              ctrl.addLink(slider)
            }
          }*/
        },
        post : function(scope, element, attrs, ctrl) {
//          scope._sliderSetup();
        }
      }
    }        
  }
});

});
