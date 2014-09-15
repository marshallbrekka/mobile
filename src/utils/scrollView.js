lib.factory("$rfz.util.scrollView",
           ["$rfz.util.css", "$rfz.util.number", "$rfz.util.point", "$rfz.util.axis",
            "$rfz.util.edges", "$rfz.util.indicator", "$rfz.util.events",
            "$rfz.util.render", "$rfz.util.platform",
            function(css, numb, Point, Axis, Edges, Indicator, Events, render, platform) {

  function easeOutCubic(currentTime, duration, positionDifference, startPosition) {
    var tempTime = (currentTime / duration - 1)
    return positionDifference *
           (tempTime * tempTime * tempTime + 1)
           + startPosition;
  }

  function easeOutExponential(currentTime, duration, positionDifference, startPosition) {
    return positionDifference *
           (-Math.pow(2, -10 * currentTime / duration) + 1)
           + startPosition;
  }

  function Scroll(opts) {
    var opts = _.defaults(opts, {
      bounces          : platform.os === platform.PLATFORMS.IOS,
      canScrollX       : true,
      canScrollY       : true,
      showIndicatorX   : true,
      showIndicatorY   : true,
      pageSizeFactor   : 1,
      pagingEnabled    : false,
      autoPageHeight   : false
    });

    window.S = this;

    if (!opts.container) {
      throw new Error("Scroll view requires a container");
    }
    if (!opts.content) {
      throw  new Error("Scroll view requires a content element")
    }

    // Behavior Settings
    this.container = opts.container;
    this.content = opts.content;
    this.bounces = opts.bounces;
    this.autoPageHeight = opts.autoPageHeight;
    this.pageSizeFactor = opts.pageSizeFactor;
    this.canScroll = new Axis(opts.canScrollX, opts.canScrollY);
    this.showIndicator = new Axis(opts.showIndicatorX, opts.showIndicatorY);
    this.pagingEnabled = opts.pagingEnabled;
    this.indicatorOffsets = new Axis(new Edges(), new Edges());
    Point.applyFn(function(canScroll, showIndicator, offsets, prop) {
      if (canScroll && showIndicator) {
        offsets[prop] = Indicator.THICKNESS + 1;
      }
    }, this.canScroll.copy().swap(), this.showIndicator, this.indicatorOffsets, new Axis("right", "bottom"));

    // Internal use properties
    this.animating = false;
    this.dragging = false;
    this.minPoint = new Point();
    this.maxPoint = null;
    this.position = new Point();
    this.startPosition = null;
    this.startScroll = null;
    this.tracking = null;

    var self = this;

    this.indicator = new Axis(new Indicator("x"), new Indicator("y"));
    Point.applyFn(function(canScroll, indicator) {
      if (canScroll) self.container.appendChild(indicator.element);
    }, this.canScroll, this.indicator);

    new Events.PointerNested(angular.element(this.container), {
      startPreventDefault : false,
//      endPreventDefault : false,
      preStart : _.bind(this.pointerPreStart, this),
      start    : _.bind(this.pointerStart, this),
      preMove  : _.bind(this.pointerPreMove, this),
      move     : _.bind(this.pointerMove, this),
      end      : _.bind(this.pointerEnd, this),
      lost     : _.bind(this.pointerLost, this)
    });

    this.renderId = render.getId();
    this.render = _.bind(function() {
      css.setTranslate(this.content, -this.position.x, -this.position.y);
      this.positionIndicators();
    }, this);

    this.renderDeceleration = _.bind(function() {
      this.stepThroughDeceleration();
    }, this);
  }

  Scroll.prototype.positionElements = function() {
    if (this.animating) {
      css.setTranslate(this.content, -this.position.x, -this.position.y);
      this.positionIndicators();
    } else {
      render.render(this.renderId, this.render);
    }
  }

  // Platform/version specific contants
  // TODO specify values depending on os
  Scroll.DELECERATION_FRICTION = 0.998;
  Scroll.MIN_INDICATOR_LENGTH = 32;
  Scroll.PAGING_ACCELERATION = 3.6E-4;
  Scroll.PAGING_DECELERATION = 0.9668;

  // Generic constants
  Scroll.MAX_TRACKING_TIME = 150;
  Scroll.OUT_OF_BOUNDS_FRICTION = 0.5;
  Scroll.PAGE_TRANSITION_DURATION = 300;
  Scroll.SCROLL_TRANSITION_DURATION = 580;

  Scroll.MINIMUM_VELOCITY = 10;
  Scroll.MIN_OUT_OF_RANGE_DISTANCE = 1;
  Scroll.MIN_VELOCITY_FOR_DECELERATION = 250;
  Scroll.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING = 300;
  Scroll.PENETRATION_DECELERATION = 8;
  Scroll.PENETRATION_ACCELERATION = 5;
  Scroll.SCROLL_TO_ELEMENT_MARGIN = 20;

  Scroll.INDICATOR_DISPLAY_EVENT = "indicatorDisplayEvent";
  Scroll.CHANGE_POSITION_EVENT = "changePositionEvent";
  Scroll.CHANGE_POSITION_END_EVENT = "endDecelerationEvent";
  Scroll.INPUT_START_EVENT = "inputStartEvent";
  Scroll.INPUT_MOVE_EVENT = "inputMoveEvent";
  Scroll.INPUT_END_EVENT = "inputEndEvent";

  /*
    Given a element that should be scrolled to, and a boolean that
    when true indicates it should center the element in the scroll
    view, returns the new y coordinate that should be scrolled to
    in order to show the element.

    If it returns null it means the element is already visible.

    TODO actually impl the center functionality
  */
  Scroll.prototype.getDesiredScrollPosition = function(targetElement, center) {
    var visibleMargin = Scroll.SCROLL_TO_ELEMENT_MARGIN;
    var rects = {
      target : targetElement.getBoundingClientRect(),
      parent : this.container.getBoundingClientRect(),
      body   : this.content.getBoundingClientRect()
    };

    var existingScroll = rects.body.top - rects.parent.top;
    if (center) {
      // If the total height of the element is greater than the height
      // of the visible scroll area then scroll to the top of the
      // target element.

      // add 2x visibleMargin, for the top and bottom of the element
      var targetHeight = rects.target.height + (2 * visibleMargin);
      if (targetHeight <= rects.parent.height) {
        visibleMargin = (rects.parent.height - targetHeight) / 2;
      }
      return -1 * ((rects.parent.top - rects.target.top) +
                   existingScroll + visibleMargin)
    } else {
      // if the target element is above the visible scroll area
      if (rects.parent.top >= rects.target.top - visibleMargin) {
        return -1 * ((rects.parent.top - rects.target.top) +
                     existingScroll + visibleMargin);
      }
      // if the target is below the visible scroll area
      else if (rects.parent.bottom <= rects.target.bottom - visibleMargin) {
        return -1 * ((rects.parent.bottom - rects.target.bottom) +
                     existingScroll - visibleMargin);
      }
      // the target is visible, return nothing.
      return;
    }
  }

  /*
    Given an element to scroll to, and a boolean indicating if the
    element should be centered in the scroll view, it scrolls to
    the element. If center is true and the element is already
    centered, or center is false and the element is already visible,
    no scrolling will occur.
  */
  Scroll.prototype.scrollToElement = function (element, center) {
    var newPosition = this.getDesiredScrollPosition(element, center);
    if (newPosition) {
      this.calculateMaxPoint();
      this.setPositionAnimated(new Point(this.position.x, newPosition), true);
    }
  }

  Scroll.prototype.pointerPreStart = function(e) {
    if (this.animating) {
      return true;
    }
  }

  Scroll.prototype.pointerPreMove = function(e) {
    if (this.firstScroll) {
      var point = Point.fromEvent(e),
          diff = Point.difference(this.startScroll, point),
          abs = diff.copy().abs();
      if (abs.x === abs.y) abs.x += 0.01;
      if ((abs.x > abs.y && this.canScroll.x) ||
          (abs.y > abs.x && this.canScroll.y)) {
        return true;
      }
    } else {
      // If its not our first scroll, then we can assume that
      // we are only being called because this is our 2nd+ time
      // being called after claiming, or its our 2nd+ time being
      // called after another element lost its claim.
      return true;
    }
  }

  Scroll.prototype.pointerLost = function() {
    this.dragging = false;
    this.startDeceleration(Date.now());
    // If the deceleration function determined we weren't going to
    // decelerate then decelerating is false and we should snap to
    // the bounds of minPoint and maxPoint
    if (!this.animating) {
      this.snapPositionToBounds(true);
    }
  }

  Scroll.prototype.addListener = function(obj) {
    this.listeners = this.listeners || [];
    this.listeners.push(obj);
  }

  Scroll.prototype.removeListener = function(obj) {
    this.listeners = _.filter(this.listeners, function(item) {
      return item !== obj;
    });
  }


  Scroll.prototype.callListeners = function(evt, args) {
    if (!this.callingListeners && this.listeners) {
      this.callingListeners = true;
      try {
        for (var i = 0; i < this.listeners.length; i++) {
          this.listeners[i].handleScrollEvent(evt, this, args);
        }
      } catch(e) {
        console.error(e);
      }
      this.callingListeners = false;
    }
  }

  Scroll.prototype.calculateMaxPoint = function() {
    this.containerRect = this.container.getBoundingClientRect();
    var rect = this.containerRect;
    this.maxPoint = Point.applyFn(function(max) {
      return max < 0 ? 0 : max;
    }, new Point(this.content.clientWidth - rect.width,
                 this.content.clientHeight - rect.height));
  }

  Scroll.prototype.calculatePageSize = function() {
    this.containerRect = this.container.getBoundingClientRect();
    var rect = this.containerRect;
    this.pageSize = new Point(rect.width, rect.height).multiply(this.pageSizeFactor);
  }

  Scroll.prototype.adjustHeight = function() {
    if (this.canScroll.x) {
      this.calculatePageSize();
      var pageNumber = Math.round(this.position.x / this.pageSize.x);
      var pagesElement = this.content.children[pageNumber];
      // if the pages have not been rendered yet, then we won't have a
      // pages element
      if (pagesElement) {
        this.container.style.height = pagesElement.clientHeight + "px";
      }
    }
  }

  Scroll.prototype.scrollToPage = function(pageNumber, animate) {
    if (this.canScroll.x) {
      this.calculatePageSize();
      this.calculateMaxPoint();
      if (this.autoPageHeight) {
        var pagesElement = this.content.children[pageNumber];
        this.container.style.height = pagesElement.clientHeight + "px";
      }
      this.setPositionAnimated(new Point(this.pageSize.x * pageNumber, this.position.y),
                               animate,
                               null,
                               easeOutCubic);
    }
  }

  Scroll.prototype.currentPage = function() {
    if (this.canScroll.x) {
      this.calculatePageSize();
      return Math.round(this.position.x / this.pageSize.x);
    }
  }

  Scroll.prototype.trackPosition = function(point, time) {
    this.tracking.push({time : time || Date.now(), point : point});
  }

  Scroll.prototype.clipTrackedPositions = function(time) {
    var now = time || Date.now();
    var tracked = this.tracking;
    var filtered = [];
    for (var i = tracked.length - 1; i >= 0; i--) {
      if (now - tracked[i].time <= Scroll.MAX_TRACKING_TIME) {
        filtered.push(tracked[i]);
      }
      else break;
    }
    this.tracked = null;
    return filtered;
  }

  Scroll.prototype.trackedPositionsToVelocity = function(time) {
    var trackedScrolles = this.clipTrackedPositions(time),
    firstScroll,lastScroll, distance, acceleration;
    if (trackedScrolles.length >= 2) {
      firstScroll = trackedScrolles[trackedScrolles.length - 1];
      lastScroll = trackedScrolles[0];
      var distance = Point.difference(lastScroll.point, firstScroll.point).inverse();
      var acceleration = (lastScroll.time - firstScroll.time) / 1E3;
      return distance.divide(acceleration);
    }
  }

  Scroll.prototype.toggleIndicators = function(show) {
    var method = show ? "show" : "hide";

    Point.applyFn(function(indicator, canScroll, show, maxPoint) {
      if (canScroll && show && (maxPoint !== 0 || method == "hide")) {
        indicator[method]();
      }
    }, this.indicator, this.canScroll, this.showIndicator, this.maxPoint || new Point());
    this.callListeners(Scroll.INDICATOR_DISPLAY_EVENT, show);
  }

  Scroll.prototype.positionIndicators = function(animate, duration) {
    Point.applyFn(function(indicator, canScroll, offsets, props,
                    containerSize, pos, maxPoint) {
      if (canScroll) {
        var contentSize = containerSize + maxPoint;
        var minPosition = offsets[props.start] + 2,
        maxPosition = containerSize - offsets[props.end] - 2,
        maxLength = maxPosition - minPosition;
        actualLength = Math.max(Scroll.MIN_INDICATOR_LENGTH,
                                Math.round(containerSize / contentSize * maxLength));
        if (pos < 0) {
          indicator.setAnchor(Indicator.ANCHOR_START);
          actualLength = Math.round(Math.max(actualLength + pos, Indicator.THICKNESS));
        } else if (pos >= maxPoint) {
          indicator.setAnchor(Indicator.ANCHOR_END);
          actualLength = Math.round(Math.max(actualLength + contentSize - containerSize - pos,
                                             Indicator.THICKNESS));
          minPosition = (offsets[props.end] + 2);
        } else {
          indicator.setAnchor(Indicator.ANCHOR_START);
          minPosition = numb.clampNum(Math.round(pos / (contentSize - containerSize) *
                                                 (maxLength - actualLength) + offsets[props.start]),
                                      minPosition, maxPosition - actualLength);
        }
        indicator.setPosition(minPosition, animate, duration);
        indicator.setLength(actualLength, animate, duration);
      }
    }, this.indicator, this.canScroll, this.indicatorOffsets,
                  new Axis({start : "left", end : "right"}, {start : "top", end : "bottom"}),
                  new Axis(this.containerRect.width, this.containerRect.height),
                  this.position, this.maxPoint);
  }

  Scroll.prototype.pointerStart = function(e) {
    this.animating = false;
    this.firstScroll = true;
    var rect = this.container.getBoundingClientRect();
    var adjustedDiff;
    var point = Point.fromEvent(e);
    this.tracking = [];
    this.startPosition = this.position.copy();
    this.startScroll = point.copy();
    this.trackPosition(point, e.timeStamp);
    this.containerRect = rect;
    this.calculateMaxPoint();

    if (this.bounces) {
      // If the scroll content was pulled out beyond the edges and was
      // let go of, and then grabbed again before it has returned to the
      // nearest edge, then we need to adjust our startScroll to a
      // position that would have resulted in the current out of bounds
      // position had we never let go.
      adjustedDiff = Point.difference(
        this.position,
        this.position.copy().adjustIfOutsideRange(this.minPoint, this.maxPoint,
                                                  Scroll.OUT_OF_BOUNDS_FRICTION))
        .multiply(1 / Scroll.OUT_OF_BOUNDS_FRICTION);
      this.startScroll = Point.add(this.startScroll, adjustedDiff);
    }

    if (this.pagingEnabled) {
      this.calculatePageSize();
    }
    this.callListeners(Scroll.INPUT_START_EVENT, point);
  }

  Scroll.prototype.pointerMove = function(e) {
    e.preventDefault();
    if (this.firstScroll) {
      this.firstScroll = false;
      this.dragging = true;
      this.toggleIndicators(true);
      this.positionElements();
    }

    var point = Point.fromEvent(e),
    diff = Point.difference(this.startScroll, point);
    this.trackPosition(point, e.timeStamp);
    point = Point.add(this.startPosition, diff);
    if (!this.canScroll.y) point.y = 0;
    if (!this.canScroll.x) point.x = 0;


    // If bounces is enabled, adjust the point if it is outside the min
    // or max, otherwise clamp the point.
    if (this.bounces) {
      point.adjustIfOutsideRange(this.minPoint, this.maxPoint, Scroll.OUT_OF_BOUNDS_FRICTION);
    } else {
      point.clamp(this.minPoint, this.maxPoint);
    }
    this.setPositionAnimated(point);
    this.positionIndicators();
    this.callListeners(Scroll.INPUT_MOVE_EVENT, point);
  }

  Scroll.prototype.pointerEnd = function(e) {
    this.callListeners(Scroll.INPUT_END_EVENT);
    if (e.target.tagName !== "INPUT" &&
        e.target.tagName !== "BUTTON") {
      e.preventDefault();
    }
    this.dragging = false;
    this.startDeceleration(e.timeStamp);
    // If the deceleration function determined we weren't going to
    // decelerate then decelerating is false and we should snap to
    // the bounds of minPoint and maxPoint
    if (!this.animating) {
      this.snapPositionToBounds(true);
    }
    // don't combine these if blocks, snapPositionToBounds can result
    // in an animation.
    if (!this.animating) {
      this.callListeners(Scroll.CHANGE_POSITION_END_EVENT);
    }
  }

  /*
  Used externally for calls from listeners.
  */
  Scroll.prototype.setPosition = function(point) {
    (this.position = point.copy()).roundToPx();
    this.positionElements();
  }

  /*
  Given a start point, an end point, a duration (in ms), and an
  optional start time (if no start time is provided it defaults
  to the time the fn was called).
  */
  Scroll.prototype.animateToPosition = function(startPoint, pointDifference, duration, easingFn, startTime) {
    // if animating is false, then something has intercepted our
    // animation, so don't do anything
    if (this.animating) {
      var currentTime = Date.now();
      // if a start time wasn't provided set it to the current time.
      if (!startTime) {
        startTime = currentTime;
      }
      currentTime = currentTime - startTime;

      if (currentTime >= duration) {
        // we are done with the animation now, call listeners, hide the
        // indicators (if they are shown)
        this.setPositionAnimated(Point.add(startPoint, pointDifference));
        this.toggleIndicators(false);
        this.animating = false;
        this.callListeners(Scroll.CHANGE_POSITION_END_EVENT);
      } else {
        var newPosition = Point.applyFn(
          function applyEasingFunction(startPosition, positionDifference) {
            return easingFn(currentTime, duration, positionDifference, startPosition);
          }, startPoint, pointDifference);
        this.setPositionAnimated(newPosition);
        // call ourselves on the next animation frame.
        render.render(this.renderId, _.bind(function() {
          this.animateToPosition(startPoint, pointDifference, duration, easingFn, startTime);
        }, this), true);
      }
    }
  }

  /*
  Moves the scroll view to the given Point.
  Takes a point to move to, an optional boolean that when true will
  trigger an animation to the given point, and an optional duration
  for the animation.
  */
  Scroll.prototype.setPositionAnimated = function(point, animate, duration, animationFn) {
    if (point && !point.equals(this.position)) {
      point = point.copy().roundToPx();
      if (!this.dragging && !this.animating) {
        // If we aren't dragging or decelerating then prevent the
        // view from being scrolled beyond the content edges.
        point.clamp(this.minPoint, this.maxPoint);
      }
      if (animate) {
        this.animating = true;
        this.animateToPosition(this.position.copy(),
                               Point.difference(point, this.position),
                               duration || Scroll.SCROLL_TRANSITION_DURATION,
                               animationFn || easeOutExponential);
      } else {
        this.position = point;
        this.positionElements();
        this.callListeners(Scroll.CHANGE_POSITION_EVENT);
      }
    }
  }

  Scroll.prototype.snapPositionToBounds = function(animate) {
    var useNewPosition = false;
    var position = this.position.copy();
    var animationDuration, animationFn;
    if (this.pagingEnabled && animate) {
      animationDuration = Scroll.PAGE_TRANSITION_DURATION;
      animationFn = easeOutCubic;
      if (!this.pageSize) {
        this.calculatePageSize();
      }
      // if paging set position to the nearest page from the current position.
      position = Point.applyFn(function(curPos, pageSize) {
        return Math.round(curPos / pageSize) * pageSize;
      }, this.position, this.pageSize);
      useNewPosition = true;
    } else {
      position.clamp(this.minPoint, this.maxPoint);
      useNewPosition = !position.equals(this.position);
    }
    if (useNewPosition) {
      this.setPositionAnimated(position, animate, animationDuration, animationFn);
    } else if (animate) {
      this.toggleIndicators(false);
    }
  }

  Scroll.prototype.startDeceleration = function(time) {
    var minDecelerationVelocity, velocity;
    if (!this.bounces || this.position.isInsideRange(this.minPoint, this.maxPoint)) {
      velocity = this.trackedPositionsToVelocity(time);
      if (velocity) {
        this.decelerationVelocity = velocity;
        if (!this.canScroll.y) velocity.y = 0;
        if (!this.canScroll.x) velocity.x = 0;
        this.minDecelerationPoint = new Point();
        this.maxDecelerationPoint = this.maxPoint.copy();

        if (this.pagingEnabled) {
          // Set the minDecelerationPoint to the nearest pageEdge that
          // is < current position, the the maxDecleration point to the
          // nearest pageEdge that is > current position.
          this.minDecelerationPoint = Point.applyFn(function(curPos, pageSize) {
            return Math.max(0, Math.floor(curPos / pageSize) * pageSize);
          }, this.position, this.pageSize);

          this.maxDecelerationPoint = Point.applyFn(function(curPos, pageSize, maxPoint) {
            return Math.min(maxPoint, Math.ceil(curPos / pageSize) * pageSize);
          }, this.position, this.pageSize, this.maxPoint);

          minDecelerationVelocity = Scroll.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING;
        } else {
          minDecelerationVelocity = Scroll.MIN_VELOCITY_FOR_DECELERATION;
        }

        var absVelocity = this.decelerationVelocity.copy().abs();
        // If the abs velocity is greater than the min velocity then
        // start decelerating
        if (absVelocity.test(function(v) {return v > minDecelerationVelocity;})) {
          this.animating = true;
          if (this.pagingEnabled) {
            this.nextPagePosition = Point.applyFn(function(decVel, minDecPoint, maxDecPoint) {
              return decVel > 0 ? maxDecPoint : minDecPoint;
            }, this.decelerationVelocity, this.minDecelerationPoint, this.maxDecelerationPoint);
          }
          this.animatedPosition = this.position.copy();
          var self = this;
          this.previousDecelerationFrame = Date.now();
          render.render(this.renderId, this.renderDeceleration, true);
        }
      }
    }
  }

  Scroll.prototype.adjustVelocityAndPositionForPagingDuration = function(elapsedTime) {
    for (var frame = 0; frame < elapsedTime; frame++) {
      // For each frame when paging, perform maths to adjust the
      // decelerationVelocity, and then apply the velocity to
      // the animated position.
      // TODO ask Nacho for some help with cleaning this up.
      this.decelerationVelocity
        = Point.applyFn(function(decVelocity, position, nextPagePosition) {
          var velocity = decVelocity + 1E3
            * Scroll.PAGING_ACCELERATION
            * (nextPagePosition - position);
          return velocity * Scroll.PAGING_DECELERATION;
        }, this.decelerationVelocity, this.animatedPosition, this.nextPagePosition);

      this.animatedPosition = Point.applyFn(function(curPos, velocity) {
        return curPos + velocity / 1E3;
      }, this.animatedPosition, this.decelerationVelocity);
    }
  }

  Scroll.prototype.adjustVelocityAndPositionForDuration = function(elapsedTime) {
    var decelerationFactor = new Point(Scroll.DELECERATION_FRICTION,
                                       Scroll.DELECERATION_FRICTION)
    var adjustedDecelerationFactorByTime = Point.applyFn(function(decFact) {
      return Math.exp(Math.log(decFact) * elapsedTime);
    }, decelerationFactor);

    decelerationFactor = Point.applyFn(function(decFactByTime, decFact) {
      return decFact * ((1 - decFactByTime) / (1 - decFact));
    }, adjustedDecelerationFactorByTime, decelerationFactor);

    this.animatedPosition = Point.applyFn(function(pos, velocity, decFact) {
      return pos + velocity / 1E3 * decFact;
    }, this.animatedPosition, this.decelerationVelocity, decelerationFactor);
    this.decelerationVelocity = Point.applyFn(function(velocity, decFactByTime) {
      return velocity * decFactByTime;
    }, this.decelerationVelocity, adjustedDecelerationFactorByTime);
  }

  Scroll.prototype.stepThroughDeceleration = function() {
    if (this.animating) {
      var frameTime = Date.now();
      var elapsedTime = frameTime - this.previousDecelerationFrame;
      if (this.pagingEnabled) {
        this.adjustVelocityAndPositionForPagingDuration(elapsedTime);
      } else {
        this.adjustVelocityAndPositionForDuration(elapsedTime);
      }
      if (!this.bounces) {
        // Potentially adjust the decelerationVelocity and the
        // animatedPosition if outside the bounds of minPoint and maxPoint
        var clampedPosition = this.animatedPosition.copy().clamp(this.minPoint, this.maxPoint);
        this.decelerationVelocity = Point.applyFn(function(curPos, clamped, velocity) {
          return curPos != clamped ? 0 : velocity;
        }, this.animatedPosition, clampedPosition, this.decelerationVelocity);

        if (!clampedPosition.equals(this.animatedPosition)) {
          this.animatedPosition = clampedPosition;
        };
      }

      this.setPositionAnimated(this.animatedPosition.copy());
      var belowMinVelocity = Point.applyFn(function(vel, curPos, minPos, maxPos) {
        if (curPos >= minPos && curPos <= maxPos) {
          if  (vel < Scroll.MINIMUM_VELOCITY) {
            return 1;
          }
        } else {
          var offset = curPos < minPos ? -1 * (curPos - minPos) : curPos - maxPos;
          if (offset < Scroll.MIN_OUT_OF_RANGE_DISTANCE && vel < Scroll.MINIMUM_VELOCITY) {
            return 1;
          }
        }
        return 0;
      }, this.decelerationVelocity.copy().abs(), this.position, this.minPoint, this.maxPoint)
        .equals(new Point(1, 1));

      var donePaging = this.pagingEnabled && belowMinVelocity &&
        Point.difference(this.nextPagePosition, this.animatedPosition)
        .test(function(v) {return v <= 1;});

      if ((!this.pagingEnabled && belowMinVelocity) || donePaging) {
        this.decelerationCompleted();
      } else {
        if (!this.pagingEnabled && this.bounces) {
          // Adjust the position and velocity if we move outside of the
          // scroll bounds.
          // overflow is the number of pixels that we are outside of the
          // bounds by for each axis.
          var overflow = Point.applyFn(function(animated, min, max) {
            if (animated < min) return min - animated;
            else if (animated > max) return max - animated;
            return 0;
          }, this.animatedPosition, this.minPoint, this.maxPoint);

          var overflowDecelerationVelocity = Point.applyFn(function(overflow, decelerationVelocity) {
            if (overflow == 0) {
              return decelerationVelocity;
            } else if (overflow * decelerationVelocity <= 0) {
              return decelerationVelocity + overflow * Scroll.PENETRATION_DECELERATION;
            } else {
              return overflow * Scroll.PENETRATION_ACCELERATION;
            }
          }, overflow, this.decelerationVelocity);
          this.decelerationVelocity = overflowDecelerationVelocity;
        }

        var self = this;
        this.previousDecelerationFrame = frameTime;
        render.render(this.renderId, this.renderDeceleration, true);
      }
    }
  }

  Scroll.prototype.decelerationCompleted = function() {
    this.animating = false;
    if (this.pagingEnabled) {
      this.setPositionAnimated(Point.applyFn(function(curPos, pageSize) {
        return (Math.round(curPos / pageSize) * pageSize);
      }, this.position, this.pageSize));
    }
    this.snapPositionToBounds(false);
    if (this.autoPageHeight) {
      this.adjustHeight();
    }
    this.toggleIndicators(false);
    this.callListeners(Scroll.CHANGE_POSITION_END_EVENT);
  }

  return Scroll;
}]);
