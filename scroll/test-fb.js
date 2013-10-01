function errorAlert(e) {
  alert("error");
  alert(e);

}
//window.onerror = errorAlert;


(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


var firstTouch, lastTouch;
var parent = document.getElementById("scroll-parent");
var content = document.getElementById("scroll-content");
var point = {x : 0, y : 0};
var startPoint;

function clampNum(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function setTranslate(element, x, y, z) {
  element.style.webkitTransform =
    "translate3d(" + (x || 0) + "px," + (y || 0) + "px," + (z || 0) + "px)";
}

function getPointFromTranslate(element) {
  var computed = getComputedStyle(element);
  console.log(computed);
  var pieces = computed.webkitTransform.split("(")[1].split(",");
  console.log(pieces);

  if (pieces.length < 16) {
    return new Point(parseFloat(pieces[4]), parseFloat(pieces[5]));
  } else {
    return new Point(parseFloat(pieces[12]), parseFloat(pieces[13]));    
  }
}

function setTransition(element, duration) {
  element.style.webkitTransitionDuration = duration + "s";
}

function Point(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Point.fromEvent = function(e) {
  var touch;
  if (e.touches && e.touches.length > 0) {
    touch = e.touches[0];
  } else {
    touch = e;
  }
  return new Point(touch.pageX, touch.pageY);
}

Point.difference = function(p1, p2) {
  return new Point(p1.x - p2.x, p1.y - p2.y);
}

Point.add = function(p1, p2) {
  return new Point(p1.x + p2.x, p1.y + p2.y);
}

Point.applyFn = function(fn, pts) {
  var point;
  var units = [[], []];
  for (var i = 1; i < arguments.length; i++) {
    point = arguments[i];
    units[0].push(point.x);
    units[1].push(point.y);
  }
  
  return new Point(
    fn.apply(fn, units[0]),
    fn.apply(fn, units[1]));
}

Point.prototype.copy = function() {
  return new Point(this.x, this.y);
}

Point.prototype.toString = function() {
  return "X: " + this.x + ", Y: " + this.y;
}

Point.prototype.isInsideRange = function(min, max) {
  var props = ["x", "y"], k;
  for (var i in props) {
    k = props[i];
    if (this[k] < min[k] || this[k] > max[k]) return false;
  }
  return true;
}

Point.prototype.adjustIfOutsideRange = function(min, max, adjustmentFactor) {
  var k, props = ["x", "y"];
  for (var i in props) {
    var k = props[i];
    if (this[k] < min[k]) {
      this[k] -= (this[k] - min[k]) * adjustmentFactor;
    } else if (this[k] > max[k]) {
      this[k] -= (this[k] - max[k]) * adjustmentFactor;
    }
  }
  return this;
}

Point.prototype.equals = function(p2) {
  return this.x == p2.x && this.y == p2.y;
}

Point.prototype.test = function(testFn, and) {
  var x = testFn(this.x);
  return and ?
    x && testFn(this.y) :
    x || testFn(this.y);
}

Point.prototype.compare = function(compareFn, p2, and) {
  var x = compareFn(this.x, p2.x);
  return and ?
    x && compareFn(this.y, p2.y) :
    x || compareFn(this.y, p2.y);
}

Point.prototype.inverse = function() {
  this.x *= -1;
  this.y *= -1;
  return this;
}

Point.prototype.abs = function() {
  this.x = Math.abs(this.x);
  this.y = Math.abs(this.y);
  return this;
}

Point.prototype.multiply = function(factor, yfactor) {
  this.x *= factor;
  this.y *= (yfactor || factor);
  return this;
}

Point.prototype.divide = function(factor) {
  return this.multiply(1 / factor);
}


Point.prototype.roundToPx = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  return this;
}

Point.prototype.clamp = function(minPoint, maxPoint) {
  this.x = clampNum(this.x, minPoint.x, maxPoint.x);
  this.y = clampNum(this.y, minPoint.y, maxPoint.y);
  return this;
}


function Touch(opts) {
  this.animating = false;
  this.bounces = true;
  this.canScrollVertically = true;
  this.canScrollHorizontally = false;
  this.container = parent;
  this.content = content;
  this.dragging = false;
  this.minPoint = new Point();
  this.maxPoint = null;
  this.pagingEnabled = true;
  this.position = new Point();
  this.scrollTransitionActive = false;
  this.startPosition = null;
  this.startTouch = null
  this.tracking = null;

  this.addEvents(Touch.START_EVENT);
  var self = this;
  this.frameSetTranslate = function() {
    if (self.dragging && !self.deceleration) {
      setTranslate(self.content, -self.position.x, -self.position.y);
      window.requestAnimationFrame(self.frameSetTranslate);
    }
  }

}


Touch.MAX_TRACKING_TIME = 100;
Touch.OUT_OF_BOUNDS_FRICTION = 0.5;
Touch.PAGE_TRANSITION_DURATION = 0.25;
Touch.DELECERATION_FRICTION = 0.998;
Touch.MINIMUM_VELOCITY = 10;
Touch.MIN_VELOCITY_FOR_DECELERATION = 250;
Touch.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING = 300;
Touch.DESIRED_FRAME_RATE = 1 / 60;
Touch.PENETRATION_DECELERATION = 8;
Touch.PENETRATION_ACCELERATION = 5;
Touch.PAGING_ACCELERATION = 3.6E-4;
Touch.PAGING_DECELERATION = 0.9668;

(function() {
  var supportsTouches = "createTouch" in document;
  Touch.START_EVENT = supportsTouches ? "touchstart" : "mousedown";
  Touch.MOVE_EVENT = supportsTouches ? "touchmove" : "mousemove";
  Touch.END_EVENT = supportsTouches ? "touchend" : "mouseup";
  Touch.CANCEL_EVENT = "touchcancel";
  Touch.TRANSITION_END_EVENT = "webkitTransitionEnd";
})();

Touch.prototype.handleEvent = function(e) {
  e.preventDefault();
  switch(e.type) {
  case Touch.START_EVENT:
    this.touchStart(e);
    break;
  case Touch.MOVE_EVENT:
    this.touchMove(e);
    break;
  case Touch.END_EVENT:
   this.touchEnd(e);
   break;
  case Touch.CANCEL_EVENT:
    this.touchCancelled(e);
    break;
  case Touch.TRANSITION_END_EVENT:
    this.transitionEnded(e);
    break;
  }
}

Touch.prototype.addEvents = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.container.addEventListener(arguments[i], this);    
  }
}

Touch.prototype.removeEvents = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.container.removeEventListener(arguments[i], this);
  }
}

Touch.prototype.trackPosition = function(point) {
  this.tracking.push({time : Date.now(), point : point});
}

Touch.prototype.clipTrackedPositions = function() {
  var now = Date.now();
  var tracked = this.tracking;
  var filtered = [];
  for (var i = tracked.length - 1; i >= 0; i--) {
    if (now - tracked[i].time <= Touch.MAX_TRACKING_TIME) {
      filtered.push(tracked[i]);
    }
    else break;
  }
  this.tracked = null;
  return filtered;
}

Touch.prototype.trackedPositionsToVelocity = function() {
  var trackedTouches = this.clipTrackedPositions(),
      firstTouch,lastTouch, distance, acceleration;
  if (trackedTouches.length > 2) {
    firstTouch = trackedTouches[trackedTouches.length - 1];
    lastTouch = trackedTouches[0];
    var distance = Point.difference(lastTouch.point, firstTouch.point).inverse();
    var acceleration = (lastTouch.time - firstTouch.time) / 1E3;
    return distance.divide(acceleration);
  } 
}

Touch.prototype.touchStart = function(e) {
  this.dragging = true;
  this.decelerating = false;
  var rect = this.container.getBoundingClientRect();
  var adjustedDiff;
  var point = Point.fromEvent(e);

  if (this.scrollTransitionActive) {
    this.transitionEnded(e);
    this.setPositionAnimated(getPointFromTranslate(this.content).inverse());
  }

  this.tracking = [];
  this.startPosition = this.position.copy();
  this.startTouch = point.copy();
  this.trackPosition(point);
  this.maxPoint = new Point(this.content.scrollWidth - rect.width,
                            this.content.scrollHeight - rect.height);

  if (this.bounces) {
    // If the scroll content was pulled out beyond the edges and was
    // let go of, and then grabbed again before it has returned to the
    // nearest edge, then we need to adjust our startTouch to a
    // position that would have resulted in the current out of bounds
    // position had we never let go.
    adjustedDiff = Point.difference(this.position, this.position.copy()
        .adjustIfOutsideRange(this.minPoint, this.maxPoint, Touch.OUT_OF_BOUNDS_FRICTION))
    .multiply(1 / Touch.OUT_OF_BOUNDS_FRICTION);
    this.startTouch = Point.add(this.startTouch, adjustedDiff);
  }

  if (this.pagingEnabled) {
    this.pageSize = new Point(rect.width, rect.height);
  }
  this.addEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  window.requestAnimationFrame(this.frameSetTranslate);
}

Touch.prototype.touchMove = function(e) {
  e.preventDefault();
  var point = Point.fromEvent(e),
      diff = Point.difference(this.startTouch, point);
  this.trackPosition(point);
  point = Point.add(this.startPosition, diff);
  if (!this.canScrollVertically) point.y = 0;
  if (!this.canScrollHorizontally) point.x = 0;

  // If bounces is enabled, adjust the point if it is outside the min
  // or max, otherwise clamp the point.
  if (this.bounces) {
    point.adjustIfOutsideRange(this.minPoint, this.maxPoint, Touch.OUT_OF_BOUNDS_FRICTION);
  } else {
    point.clamp(this.minPoint, this.maxPoint);
  }
  this.setPositionAnimated(point);
}

Touch.prototype.touchEnd = function(e) {
  e.preventDefault();
  this.removeEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  this.dragging = false;
  this.startDeceleration();
  // If the deceleration function determined we weren't going to
  // decelerate then decelerating is false and we should snap to
  // the bounds of minPoint and maxPoint
  if (!this.decelerating) {
    this.snapPositionToBounds(true);
  }
}

Touch.prototype.transitionEnded = function(e) {
  if (this.scrollTransitionActive) {
    this.scrollTransitionActive = false;
    this.removeEvents(Touch.TRANSITION_END_EVENT)
    setTransition(this.content, 0);
  }
}

Touch.prototype.setPositionAnimated = function(point, animate, duration) {
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
      setTranslate(this.content, -this.position.x,  -this.position.y);
    }
    if (animate) {
      this.scrollTransitionActive = true;
      this.addEvents(Touch.TRANSITION_END_EVENT);
      setTransition(this.content, duration || Touch.PAGE_TRANSITION_DURATION);
      // TODO animate scroll indicators getting larger again
    } else {
      // send notification to listeners
      // do things with scroll indicators
    }
  }
}

Touch.prototype.snapPositionToBounds = function(animate) {
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
  }
}

Touch.prototype.startDeceleration = function() {
  var minDecelerationVelocity, velocity;
  if (!this.bounces || this.position.isInsideRange(this.minPoint, this.maxPoint)) {
    velocity = this.trackedPositionsToVelocity()
    if (velocity) {
      this.decelerationVelocity = velocity;
      if (!this.canScrollVertically) velocity.y = 0;
      if (!this.canScrollHorizontally) velocity.x = 0;
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

        minDecelerationVelocity = Touch.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING;
      } else {
        minDecelerationVelocity = Touch.MIN_VELOCITY_FOR_DECELERATION;
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

Touch.prototype.adjustVelocityAndPositionForPagingDuration = function(elapsedTime) {
  for (var frame = 0; frame < elapsedTime; frame++) {
    // For each frame when paging, perform maths to adjust the
    // decelerationVelocity, and then apply the velocity to
    // the animated position.
    this.decelerationVelocity
      = Point.applyFn(function(decVelocity, position, nextPagePosition) {
        var velocity = decVelocity + 1E3
          * Touch.PAGING_ACCELERATION
          * (nextPagePosition - position);
        return velocity * Touch.PAGING_DECELERATION;
      }, this.decelerationVelocity, this.animatedPosition, this.nextPagePosition);
    
    this.animatedPosition = Point.applyFn(function(curPos, velocity) {
      return curPos + velocity / 1E3;
    }, this.animatedPosition, this.decelerationVelocity);
  }
}

Touch.prototype.adjustVelocityAndPositionForDuration = function(elapsedTime) {
  var decelerationFactor = new Point(Touch.DELECERATION_FRICTION,
                                     Touch.DELECERATION_FRICTION)
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

Touch.prototype.stepThroughDeceleration = function() {
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
    var belowMinVelocity = this.decelerationVelocity.copy().abs().test(function(v) {
      return v <= Touch.MINIMUM_VELOCITY;
    }, true);
    var donePaging = this.pagingEnabled && belowMinVelocity &&
      Point.difference(this.nextPagePosition, this.animatedPosition)
      .test(function(v) {return v <= 1;});
    
    if (!this.pagingEnabled && belowMinVelocity || donePaging) {
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
            return decelerationVelocity + overflow * Touch.PENETRATION_DECELERATION;
          } else {
            return overflow * Touch.PENETRATION_ACCELERATION;
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

Touch.prototype.decelerationCompleted = function() {
  if (this.pagingEnabled) {
    this.setPositionAnimated(Point.applyFn(function(curPos, pageSize) {
      return (Math.round(curPos / pageSize) * pageSize);
    }, this.position, this.pageSize));
  }
  this.snapPositionToBounds(false);
}

x = new Touch();
x.pagingEnabled = false;
