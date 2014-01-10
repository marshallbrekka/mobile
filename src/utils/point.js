'use strict';
lib.factory("$rfz.util.point", ["$rfz.util.number" function (numb) {
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
    this.x = numb.roundToPx(this.x);
    this.y = numb.roundToPx(this.y);
    return this;
  }

  Point.prototype.clamp = function(minPoint, maxPoint) {
    this.x = numb.clampNum(this.x, minPoint.x, maxPoint.x);
    this.y = numb.clampNum(this.y, minPoint.y, maxPoint.y);
    return this;
  }

  return Point;
}]);
