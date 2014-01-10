'use strict';

lib.factory("$rfz.util.axis", function() {
  function Axis(x, y) {
    this.x = x;
    this.y = y;
  }

  Axis.prototype.swap = function() {
    var y = this.y;
    this.y = this.x;
    this.x = y;
    return this;
  }

  Axis.prototype.copy = function() {
    return new Axis(this.x, this.y);
  }

  return Axis;
});
