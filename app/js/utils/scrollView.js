define(["./css", "./numb", "./point", "./axis", "./edges", "./indicator", "./events"],
function(css, numb, Point, Axis, Edges, Indicator, EVENTS) {

  function merge(obj1, obj2) {
    var re = {};
    for (var k in obj1) {
      if (obj1.hasOwnProperty(k)) {
        re[k] = obj1[k];
      }
    }
    for (var k in obj2) {
      if (obj2.hasOwnProperty(k)) {
        re[k] = obj2[k];
      }
    }
    return re;
  }

  function Scroll(opts) {
    var opts = merge(
      {bounces        : true,
       canScrollX     : true,
       canScrollY     : true,
       showIndicatorX : true,
       showIndicatorY : true,
       pageSizeFactor : 1,
       pagingEnabled  : false},
      opts);

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
    this.pageSizeFactor = opts.pageSizeFactor;
    this.canScroll = new Axis(opts.canScrollX, opts.canScrollY);
    this.showIndicator = new Axis(opts.showIndicatorX, opts.showIndicatorY);
    this.pagingEnabled = opts.pagingEnabled;
    this.indicatorOffsets = new Axis(new Edges(), new Edges());
    Point.applyFn(function(canScroll, showIndicator, offsets, prop) {
      if (canScroll && showIndicator) {
        offsets[prop] = Indicator.THICKNESS + 1;
      }
    }, this.canScroll, this.showIndicator, this.indicatorOffsets, new Axis("right", "bottom"));

    // Internal use properties
    this.animating = false;
    this.dragging = false;
    this.minPoint = new Point();
    this.maxPoint = null;
    this.position = new Point();
    this.scrollTransitionActive = false;
    this.startPosition = null;
    this.startScroll = null;
    this.tracking = null;

    this.addEvents(EVENTS.POINTER_START);
    var self = this;
    this.frameSetTranslate = function() {
      if (self.dragging && !self.deceleration) {
        css.setTranslate(self.content, -self.position.x, -self.position.y);
        window.requestAnimationFrame(self.frameSetTranslate);
      }
    }
    this.indicator = new Axis(new Indicator("x"), new Indicator("y"));
    this.container.appendChild(this.indicator.x.element);
    this.container.appendChild(this.indicator.y.element);
  }

  Scroll.MAX_TRACKING_TIME = 100;
  Scroll.OUT_OF_BOUNDS_FRICTION = 0.5;
  Scroll.PAGE_TRANSITION_DURATION = 0.25;
  Scroll.DELECERATION_FRICTION = 0.998;
  Scroll.MINIMUM_VELOCITY = 10;
  Scroll.MIN_INDICATOR_LENGTH = 32;
  Scroll.MIN_OUT_OF_RANGE_DISTANCE = 1;
  Scroll.MIN_VELOCITY_FOR_DECELERATION = 250;
  Scroll.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING = 300;
  Scroll.DESIRED_FRAME_RATE = 1 / 60;
  Scroll.PENETRATION_DECELERATION = 8;
  Scroll.PENETRATION_ACCELERATION = 5;
  Scroll.PAGING_ACCELERATION = 3.6E-4;
  Scroll.PAGING_DECELERATION = 0.9668;
  Scroll.INDICATOR_DISPLAY_EVENT = "indicatorDeisplayEvent";
  Scroll.MOVE_TRANSITION_END_EVENT = "moveTransitionEndEvent";
  Scroll.CHANGE_POSITION_EVENT = "changePositionEvent";
  Scroll.END_DECELERATION_EVENT = "endDecelerationEvent";

  Scroll.prototype.handleEvent = function(e) {
    e.preventDefault();
    switch(e.type) {
    case EVENTS.POINTER_START:
      this.touchStart(e);
      break;
    case EVENTS.POINTER_MOVE:
      this.touchMove(e);
      break;
    case EVENTS.POINTER_END:
      this.touchEnd(e);
      break;
    case EVENTS.POINTER_CANCEL:
      this.touchCancelled(e);
      break;
    case EVENTS.TRANSITION_END:
      this.transitionEnded(e);
      break;
    }
  }

  Scroll.prototype.addEvents = function() {
    for (var i = 0; i < arguments.length; i++) {
      this.container.addEventListener(arguments[i], this);    
    }
  }

  Scroll.prototype.removeEvents = function() {
    for (var i = 0; i < arguments.length; i++) {
      this.container.removeEventListener(arguments[i], this);
    }
  }

  Scroll.prototype.addListener = function(obj) {
    this.listeners = this.listeners || [];
  }

  Scroll.prototype.callListeners = function(evt, args) {
    if (!this.callingListeners && this.listeners) {
      this.callingListeners = true;
      for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i].handleScrollEvent(evt, args);
      }
      this.callingListeners = false;
    }
  }

  Scroll.prototype.trackPosition = function(point) {
    this.tracking.push({time : Date.now(), point : point});
  }

  Scroll.prototype.clipTrackedPositions = function() {
    var now = Date.now();
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

  Scroll.prototype.trackedPositionsToVelocity = function() {
    var trackedScrolles = this.clipTrackedPositions(),
    firstScroll,lastScroll, distance, acceleration;
    if (trackedScrolles.length > 2) {
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
                    containerSize, contentSize, pos, maxPoint) {
      if (canScroll) {
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
          minPosition = -(offsets[props.end] + 2);
        } else {
          indicator.setAnchor(Indicator.ANCHOR_START);
          minPosition = numb.clampNum(Math.round(pos / (contentSize - containerSize) *
                                                 (maxLength - actualLength) + offsets[props.start]),
                                      minPosition, maxPosition - actualLength);
        }
        indicator.setLength(actualLength, animate, duration);
        indicator.setPosition(minPosition, animate, duration);
      }
    }, this.indicator, this.canScroll, this.indicatorOffsets,
                  new Axis({start : "left", end : "right"}, {start : "top", end : "bottom"}),
                  new Axis(this.containerRect.width, this.containerRect.height),
                  new Axis(this.content.clientWidth, this.content.clientHeight),
                  this.position, this.maxPoint);
  }

  Scroll.prototype.touchStart = function(e) {
    //  this.dragging = true;
    this.decelerating = false;
    this.firstScroll = true;
    var rect = this.container.getBoundingClientRect();
    var adjustedDiff;
    var point = Point.fromEvent(e);

    if (this.scrollTransitionActive) {
      this.transitionEnded(e);
      this.toggleIndicators(true);
      this.setPositionAnimated(css.getPointFromTranslate(this.content).inverse());
    }

    this.tracking = [];
    this.startPosition = this.position.copy();
    this.startScroll = point.copy();
    this.trackPosition(point);
    this.containerRect = rect;
    this.maxPoint = Point.applyFn(function(max) {
      return max < 0 ? 0 : max;
    }, new Point(this.content.clientWidth - rect.width,
                 this.content.clientHeight - rect.height));

    if (this.bounces) {
      // If the scroll content was pulled out beyond the edges and was
      // let go of, and then grabbed again before it has returned to the
      // nearest edge, then we need to adjust our startScroll to a
      // position that would have resulted in the current out of bounds
      // position had we never let go.
      adjustedDiff = Point.difference(this.position, this.position.copy()
                                      .adjustIfOutsideRange(this.minPoint, this.maxPoint, Scroll.OUT_OF_BOUNDS_FRICTION))
        .multiply(1 / Scroll.OUT_OF_BOUNDS_FRICTION);
      this.startScroll = Point.add(this.startScroll, adjustedDiff);
    }

    if (this.pagingEnabled) {
      this.pageSize = new Point(rect.width, rect.height).multiply(this.pageSizeFactor);
    }
    this.addEvents(EVENTS.POINTER_MOVE, EVENTS.POINTER_END, EVENTS.POINTER_CANCEL);
  }

  Scroll.prototype.touchMove = function(e) {
    if (this.dragging) {
      e.stopPropagation();
    } else if (!this.firstScroll) {
      return;
    }
    var point = Point.fromEvent(e),
    diff = Point.difference(this.startScroll, point);
    if (this.firstScroll) {
      var abs = diff.copy().abs();
      if ((abs.x > abs.y && this.canScroll.x) ||
          (abs.y > abs.x && this.canScroll.y) || 
          (abs.x == abs.y)) {
        e.stopPropagation();
        this.firstScroll = false;
        this.dragging = true;
        this.toggleIndicators(true);
        window.requestAnimationFrame(this.frameSetTranslate);
      } else {
        this.firstScroll = false;
      }
    }
    this.trackPosition(point);
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
  }

  Scroll.prototype.touchEnd = function(e) {
    e.preventDefault();
    this.removeEvents(EVENTS.POINTER_MOVE, EVENTS.POINTER_END, EVENTS.POINTER_CANCEL);
    this.dragging = false;
    this.startDeceleration();
    // If the deceleration function determined we weren't going to
    // decelerate then decelerating is false and we should snap to
    // the bounds of minPoint and maxPoint
    if (!this.decelerating) {
      this.snapPositionToBounds(true);
    }
  }

  Scroll.prototype.transitionEnded = function(e) {
    if (this.scrollTransitionActive) {
      this.scrollTransitionActive = false;
      this.removeEvents(EVENTS.TRANSITION_END)
      css.setTransition(this.content, 0);
      this.toggleIndicators(false);
      this.callListeners(Scroll.MOVE_TRANSITION_END_EVENT);
    }
  }

  Scroll.prototype.setPositionAnimated = function(point, animate, duration) {
    if (point && !point.equals(this.position)) {
      (this.position = point.copy()).roundToPx();
      if (!this.dragging && !this.decelerating) {
        // If we aren't dragging or decelerating then prevent the
        // view from being scrolled beyond the content edges.
        this.position.clamp(this.minPoint, this.maxPoint);
      }
      
      // Prevent traditional scrolling from happening.
      this.container.scrollTop = this.container.scrollLeft = 0;

      // the real translate values have to be negative, but we treat
      // scroll values as positive (zero being the top of the page,
      // positive n being further down the page).
      if (!this.dragging) {
        css.setTranslate(this.content, -this.position.x,  -this.position.y);
      }
      if (animate) {
        this.scrollTransitionActive = true;
        this.addEvents(EVENTS.TRANSITION_END);
        css.setTransition(this.content, duration || Scroll.PAGE_TRANSITION_DURATION);
        this.positionIndicators(true, duration || Scroll.PAGE_TRANSITION_DURATION);
        // TODO animate scroll indicators getting larger again
        this.callListeners(Scroll.CHANGE_POSITION_EVENT, duration || Scroll.PAGE_TRANSITION_DURATION);
      } else {
        this.callListeners(Scroll.CHANGE_POSITION_EVENT);
        this.positionIndicators();
      }
    }
  }

  Scroll.prototype.snapPositionToBounds = function(animate) {
    var useNewPosition = false;
    var position = this.position.copy();
    if (this.pagingEnabled && animate) {
      // if paging set position to the nearest page from the current position.
      position = Point.applyFn(function(curPos, pageSize) {
        return Math.round(curPos / pageSize) * pageSize;
      }, this.position, this.pageSize);
      useNewPosition = true;
    } else if (this.bounces) {
      position.clamp(this.minPoint, this.maxPoint);
      useNewPosition = !position.equals(this.position);
    }
    if (useNewPosition) {
      this.setPositionAnimated(position, animate);
    } else if (animate) {
      this.toggleIndicators(false);
    }
  }

  Scroll.prototype.startDeceleration = function() {
    var minDecelerationVelocity, velocity;
    if (!this.bounces || this.position.isInsideRange(this.minPoint, this.maxPoint)) {
      velocity = this.trackedPositionsToVelocity()
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
          this.decelerating = true;
          if (this.pagingEnabled) {
            this.nextPagePosition = Point.applyFn(function(decVel, minDecPoint, maxDecPoint) {
              return decVel > 0 ? maxDecPoint : minDecPoint;
            }, this.decelerationVelocity, this.minDecelerationPoint, this.maxDecelerationPoint);
          }
          this.animatedPosition = this.position.copy();
          var self = this;
          this.previousDecelerationFrame = Date.now();
          window.requestAnimationFrame(function() {
            self.stepThroughDeceleration();
          });
        }
      }
    }
  }

  Scroll.prototype.adjustVelocityAndPositionForPagingDuration = function(elapsedTime) {
    for (var frame = 0; frame < elapsedTime; frame++) {
      // For each frame when paging, perform maths to adjust the
      // decelerationVelocity, and then apply the velocity to
      // the animated position.
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
      return Math.exp(Math.log(decFact) * elapsedTime)
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
    if (this.decelerating) {
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
        window.requestAnimationFrame(function() {
          self.stepThroughDeceleration();
        });
      }
    }
  }

  Scroll.prototype.decelerationCompleted = function() {
    if (this.pagingEnabled) {
      this.setPositionAnimated(Point.applyFn(function(curPos, pageSize) {
        return (Math.round(curPos / pageSize) * pageSize);
      }, this.position, this.pageSize));
    }
    this.snapPositionToBounds(false);
    this.toggleIndicators(false);
    this.callListeners(Scroll.END_DECELERATION_EVENT);
  }

  /*
    var parent = document.getElementById("scroll-parent");
    var content = document.getElementById("scroll-content");

    y = new Scroll({container : parent,
    content : content,
    //               canScroll : false,
    //               pagingEnabled : true,
    bounces : false,
    pageSizeFactor : 1});*/

  /*x = new Scroll({container : document.getElementById("master-parent"),
    content : document.getElementById("master-content"),
    canScrollY : false});*/

  return Scroll;

});
