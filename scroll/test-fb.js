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

    if (!window.requestAnimationFrame | true)
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


function Touch() {
  this.content = content;
  this.container = parent;
  this.addEvents(Touch.START_EVENT);
  var self = this;
  this.position = new Point();
  this.animating = false;
  this.bounces = true;
  this.canScrollVertically = true;
  this.canScrollHorizontally = false;
  this.pagingEnabled = true;
  this.animator = function(time) {
//   console.log("animating");
   if (!self.animating) return;
//   console.log("animating");
   self.position(time);
   window.requestAnimationFrame(self.animator);
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
  console.log(e.type);
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
  this.tracked = [];
  return filtered;
}

Touch.prototype.touchStart = function(e) {
  this.dragging = true;
  var point = Point.fromEvent(e);
  console.log("touch start");
  if (this.scrollTransitionActive) {
    this.transitionEnded(e);
    this.setPositionAnimated(getPointFromTranslate(this.content).inverse());
    console.log("stopped transition");
    
  }
  this.tracking = [];
  this.startPosition = this.position.copy();
  this.startTouch = point.copy();
  this.minPoint = new Point();
  var rect = this.container.getBoundingClientRect();
  this.maxPoint = new Point(this.content.scrollWidth - rect.width,
                            this.content.scrollHeight - rect.height);
  var adjustedDiff = Point.difference(
    this.position,
    this.position.copy().adjustIfOutsideRange(this.minPoint,
                                              this.maxPoint,
                                              Touch.OUT_OF_BOUNDS_FRICTION))
    .multiply(1 / Touch.OUT_OF_BOUNDS_FRICTION);
  if (this.pagingEnabled) {
    this.pageSize = new Point(rect.width, rect.height);
  }
  this.startTouch = Point.add(this.startTouch, adjustedDiff);
  this.trackPosition(point);
  this.painting = false;
  this.addEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  this.decelerating = false;
  console.log("Touch Start: " + this.position.toString());
}

Touch.prototype.touchMove = function(e) {
  var point = Point.fromEvent(e),
      diff;
  this.trackPosition(point);
  diff = Point.difference(this.startTouch, point);
  point = Point.add(this.startPosition, diff);
  if (!this.canScrollVertically) point.y = 0;
  if (!this.canScrollHorizontally) point.x = 0;
  point.adjustIfOutsideRange(this.minPoint, this.maxPoint, Touch.OUT_OF_BOUNDS_FRICTION || 0.5);
  this.setPositionAnimated(point, false);
}

Touch.prototype.touchEnd = function(e) {
  this.removeEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  this.dragging = false;
  this.startDeceleration()
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
      this.position.clamp(new Point(), this.maxPoint);
    }
    this.container.scrollTop = this.container.scrollLeft = 0;
    setTranslate(this.content, -this.position.x,  -this.position.y);
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
//  this.decelerating = true;
  if (!this.bounces || this.position.isInsideRange(this.minPoint, this.maxPoint)) {
    var trackedTouches = this.clipTrackedPositions(), firstTouch, lastTouch;
    if (trackedTouches.length > 2) {
      firstTouch = trackedTouches[trackedTouches.length - 1];
      lastTouch = trackedTouches[0];
      var distance = Point.difference(lastTouch.point, firstTouch.point).inverse();
      var acceleration = (lastTouch.time - firstTouch.time) / 1E3;
      this.decelerationVelocity = distance.divide(acceleration);
      this.adjustedDecelerationFactor = new Point(Touch.DELECERATION_FRICTION,
                                                 Touch.DELECERATION_FRICTION);
      if (!this.canScrollVertically) this.decelerationVelocity.y = 0;
      if (!this.canScrollHorizontally) this.decelerationVelocity.x = 0;
      this.minDecelerationPoint = new Point();
      this.maxDecelerationPoint = this.maxPoint.copy();
      
      var minDecelerationVelocity;
      
      if (this.pagingEnabled) {
        var pageSize = this.pageSize;
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
      if (absVelocity.test(function(v) {return v > minDecelerationVelocity;})) {
        this.decelerating = true;
        if (this.pagingEnabled) {
          this.nextPagePosition = new Point(this.decelerationVelocity.x > 0 ?
                                              this.maxDecelerationPoint.x : 
                                              this.minDecelerationPoint.x,
                                            this.decelerationVelocity.y > 0 ?
                                              this.maxDecelerationPoint.y :
                                              this.minDecelerationPoint.y);
        }
        this.animatedPosition = this.position.copy();
        var self = this;
        setTimeout(function() {
          self.stepThroughDeceleration()
        }, Touch.DESIRED_FRAME_RATE);
        this.previousDecelerationFrame = Date.now();
      }
    }
  }
}

Touch.prototype.stepThroughDeceleration = function() {
  if (this.decelerating) {
    var frameTime = Date.now();
    var elapsedTime = frameTime - this.previousDecelerationFrame;
    var animatedPosition = this.animatedPosition.copy();
    if (this.pagingEnabled) {
      for (var frame = 0; frame < elapsedTime; frame++) {
        this.decelerationVelocity = Point.applyFn(function(decVelocity, position, nextPagePosition) {
          var velocity = decVelocity + 1E3 * Touch.PAGING_ACCELERATION *
            (nextPagePosition - position);
          return velocity * Touch.PAGING_DECELERATION;
        }, this.decelerationVelocity, animatedPosition, this.nextPagePosition);
        
       animatedPosition = Point.applyFn(function(curPos, velocity) {
         return curPos + velocity / 1E3;
       }, animatedPosition, this.decelerationVelocity);
      }
    } else {
      var decelerationFactor = this.adjustedDecelerationFactor;
      var adjustedDecelerationFactorByTime = Point.applyFn(function(decFact) {
        return Math.exp(Math.log(decFact) * elapsedTime)
      }, decelerationFactor);

      decelerationFactor = Point.applyFn(function(decFactByTime, decFact) {
        return decFact * ((1 - decFactByTime) / (1 - decFact));
      }, adjustedDecelerationFactorByTime, decelerationFactor);

      animatedPosition = Point.applyFn(function(pos, velocity, decFact) {
        return pos + velocity / 1E3 * decFact;
      }, animatedPosition, this.decelerationVelocity, decelerationFactor);
      this.decelerationVelocity = Point.applyFn(function(velocity, decFactByTime) {
        return velocity * decFactByTime;
      }, this.decelerationVelocity, adjustedDecelerationFactorByTime);
    }
    if (!this.bounces) {
      // TODO some stuff for not bouncing scenario
    }
    
    this.animatedPosition = animatedPosition;
    this.setPositionAnimated(animatedPosition.copy());
    var belowMinVelocity = this.decelerationVelocity.copy().abs().test(function(v) {
      return v <= Touch.MINIMUM_VELOCITY;
    }, true);
    var donePaging = this.pagingEnabled && belowMinVelocity &&
      Point.difference(this.nextPagePosition, animatedPosition).test(function(v) {return v <= 1;});
    
    if (!this.pagingEnabled && belowMinVelocity || donePaging) {
      this.decelerationCompleted();
    } else {
      if (!this.pagingEnabled && this.bounces) {
        var overflow = Point.applyFn(function(animated, min, max) {
          if (animated < min) return min - animated;
          else if (animated > max) return max - animated;
          return 0;
        }, animatedPosition, this.minPoint, this.maxPoint);
        
        var overflowDecelerationVelocity = Point.applyFn(function(overflow, decelerationVelocity) {
          if (overflow != 0) {
            if (overflow * decelerationVelocity <= 0) {
              return decelerationVelocity + overflow * Touch.PENETRATION_DECELERATION;
            } else {
              return overflow * Touch.PENETRATION_ACCELERATION;
            }
          }
          return decelerationVelocity;
        }, overflow, this.decelerationVelocity);
        this.decelerationVelocity = overflowDecelerationVelocity;
      }

      var self = this;
      this.previousDecelerationFrame = frameTime;
      setTimeout(function() {
        self.stepThroughDeceleration();
      }, Touch.DESIRED_FRAME_RATE);
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

/*Touch.prototype.touchStart = function(e) {
  this.animating = true;
  
  parent.addEventListener("touchmove", this);
  parent.addEventListener("touchend", this);
  window.requestAnimationFrame(this.animator);
}


Touch.prototype.touchMove = function(e) {
//  console.log("move");
  lastTouch = e;
  var distance = (e.touches[0].pageY - firstTouch.pageY);
  point.y = startPoint.y + distance;
//  this.position();
}

Touch.prototype.touchEnd = function(e) {
  this.animating = false;
  parent.removeEventListener("touchmove", this);
  parent.removeEventListener("touchend", this);
}

Touch.prototype.position = function() {
//  console.log("positioning");
  content.style.webkitTransform = "translate3d(0px, " + point.y + "px, 0)";
}
*/
x = new Touch();




