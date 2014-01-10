'use strict';
lib.factory("$rfz.util.edges", ["$rfz.util.axis", function (Axis) {
  function Edges(o) {
    o = o || {};      
    this.top = o.top || 0;
    this.right = o.right || 0;
    this.bottom = o.bottom || 0;
    this.left = o.left || 0;
  }

  Edges.toAxis = function(e) {
    return new Axis({start : e.left, end : e.right},
                    {start : e.top, end : e.bottom});
  }

  Edges.fromElement = function(el) {
    var rect = el.getBoundingClientRect();
    return new Edges(rect);
  }

  return Edges;
}]);
