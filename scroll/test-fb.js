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

Point.prototype.copy = function() {
  return new Point(this.x, this.y);
}

Point.prototype.toString = function() {
  return "X: " + this.x + ", Y: " + this.y;
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

Point.prototype.multiply = function(factor) {
  this.x *= factor;
  this.y *= factor;
  return this;
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

(function() {
  var supportsTouches = "createTouch" in document;
  Touch.START_EVENT = supportsTouches ? "touchstart" : "mousedown";
  Touch.MOVE_EVENT = supportsTouches ? "touchemove" : "mousemove";
  Touch.END_EVENT = supportsTouches ? "touchend" : "mouseup";
  Touch.CANCEL_EVENT = "touchcancel";
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
  var point = Point.fromEvent(e);
  console.log("touch start");
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
  this.startTouch = Point.add(this.startTouch, adjustedDiff);
  this.trackPosition(point);
  this.painting = false;
  this.addEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  this.dragging = true;
  this.decelerating = false;
  console.log("Touch Start: " + this.position.toString());
}

Touch.prototype.touchMove = function(e) {
  var point = Point.fromEvent(e),
      diff;
  diff = Point.difference(this.startTouch, point);
  point = Point.add(this.startPosition, diff);
  point.adjustIfOutsideRange(this.minPoint, this.maxPoint, Touch.OUT_OF_BOUNDS_FRICTION || 0.5);
  this.trackPosition(point);
  this.setPositionAnimated(point, false);
}

Touch.prototype.touchEnd = function(e) {
  this.removeEvents(Touch.MOVE_EVENT, Touch.END_EVENT, Touch.CANCEL_EVENT);
  this.dragging = false;
  var tracked = this.clipTrackedPositions();
  if (tracked.length > 2) {
    console.log("have tracking events");
  } else {
    console.log("dont have enough tracking events");
  }
  console.log("Touch End: " + this.position.toString());
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
  var position = new Point();
  if (this.pagingEnabled && animate) {
    position.x = Math.round(this.position.x / this.pageSize.width) * this.pageSize.width;
    position.y = Math.round(this.position.y / this.pageSize.height) * this.pageSize.height;    
    useNewPosition = true;
  } else if (this.bounces) {
    position.clamp(this.position, new Point(), this.maxPoint);
    useNewPosition = !position.equals(this.position);
  }
  if (useNewPosition) {
    this.setPositionAnimated(position, animate);
  }
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




