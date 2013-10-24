define([
"underscore",
"./dom",
"./point",
"./edges"
], function(
_,
dom,
Point,
Edges
){
  var supportsTouch = "createTouch" in document;

  

  var events = {POINTER_START : supportsTouch ? "touchstart" : "mousedown",
                POINTER_MOVE : supportsTouch ? "touchmove" : "mousemove",
                POINTER_END : supportsTouch ? "touchend" : "mouseup",
                POINTER_CANCEL : "touchcancel",
                TRANSITION_END : "webkitTransitionEnd"};

  function bind(element, obj, events, capture) {
    capture = capture ? false : capture;
    _.each(events, function(event) {
      element.addEventListener(event, obj, capture);
    });
  }

  function unbind(element, obj, events, capture) {
    capture = capture ? false : capture;
    _.each(events, function(event) {
      element.removeEventListener(event, obj, capture);
    });
  }

  function handleEvent(e) {
    e.preventDefault();
    switch(e.type) {
    case events.POINTER_START:
      this.pointerStart(e);
      break;
    case events.POINTER_MOVE:
      this.pointerMove(e);
      break;
    case events.POINTER_END:
      this.pointerEnd(e);
      break;
    case events.POINTER_CANCEL:
      this.pointerCancel(e);
      break;
    }
  }

  function pointerStart(self) {
    bind(window, self, [events.POINTER_MOVE, events.POINTER_END]);
  }

  function pointerEnd(self) {
    unbind(window, self, [events.POINTER_MOVE, events.POINTER_END]);
  }

  function inElementRange(element, event) {
    var position = Point.fromEvent(event);
    var elEdges = Edges.fromElement(element);
    elEdges = Edges.toAxis(elEdges);
    return Point.applyFn(function(pointer, edge) {
      if (pointer < edge.start) {
        return pointer < edge.start - 50 ? 0 : 1;
      } else if (pointer > edge.end) {
        return pointer > edge.end + 50 ? 0 : 1;
      }
      return 1;
    }, position, elEdges).test(function(point) {
      return point == 1;
    }, true);
  }
  
  function PointerAction(element, fn, moveCancels) {
    this.element = element;
    this.fn = fn;
    this.moveCancels = moveCancels;
    this.cancelled = false;
    this.inRange = true;
    bind(element, this, [events.POINTER_START]);
  }

  PointerAction.prototype.handleEvent = handleEvent;
  
  PointerAction.prototype.pointerStart = function(e) {
    pointerStart(this);
    this.cancelled = false;
    this.inRange = true;
    if (!this.moveCancels) {
      dom.addClass(this.element, "pointer-start");
    } else {
      var self = this;
      setTimeout(function() {
        if (!self.cancelled) {
          this.moveCancels = false;
          dom.addClass(self.element, "pointer-start");
        }
      }, 100);
    }
  }

  PointerAction.prototype.pointerMove = function(e) {
    if (this.moveCancels) {
      this.cancelled = true;
      pointerEnd(this);
      dom.removeClass(this.element, "pointer-start");
    } else {
      if (inElementRange(this.element, e)) {
        if (!this.inRange) {
          this.inRange = true;
          dom.addClass(this.element, "pointer-start");
        }
      } else {
        if (this.inRange) {
          this.inRange = false;
          dom.removeClass(this.element, "pointer-start");
        }
      }
    }
  }

  PointerAction.prototype.pointerEnd = function(e) {
    pointerEnd(this);
    if (this.inRange) {
      dom.removeClass(this.element, "pointer-start");
      this.fn(e);
    }
  }

  PointerAction.prototype.pointerCancel = function() {
    pointerEnd();
    dom.removeClass(this.element, "pointer-start");
  }

  function PointerSlide(element, fnStart, fnMove, fnEnd) {
    this.element = element;
    this.fnStart = fnStart;
    this.fnMove = fnMove;
    this.fnEnd = fnEnd;
    bind(element, this, [events.POINTER_START]);
  }

  PointerSlide.prototype.handleEvent = handleEvent;

  PointerSlide.prototype.pointerStart = function(e) {
    pointerStart(this);
    dom.addClass(this.element, "pointer-start");
    this.fnStart(e);
  }

  PointerSlide.prototype.pointerMove = function(e) {
    e.stopPropagation();
    this.fnMove(e);
  }

  PointerSlide.prototype.pointerEnd = function(e) {
    pointerEnd(this);
    dom.removeClass(this.element, "pointer-start");
    this.fnEnd(e);
  }

  PointerSlide.prototype.pointerCancel = PointerSlide.prototype.pointerEnd;

  events.PointerSlide = PointerSlide;
  events.PointerAction = PointerAction;
  events.bind = bind;
  events.unbind = unbind;
  events.inElementRange = inElementRange;
  window.EVE = events;
  return events;
});
