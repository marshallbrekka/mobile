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
    capture = capture ? true : false;
    events = Array.isArray(events) ? events : [events];
    _.each(events, function(event) {
      element.addEventListener(event, obj, capture);
    });
  }

  function unbind(element, obj, events, capture) {
    capture = capture ? true : false;
    events = Array.isArray(events) ? events : [events];
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
    bind(document.body, self, [events.POINTER_MOVE, events.POINTER_END], true);
  }

  function pointerEnd(self) {
    unbind(document.body, self, [events.POINTER_MOVE, events.POINTER_END], true);
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
    e.stopPropagation();
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


  /*
  This should bind the pointerStart and pointerMove events both the
  capture and bubbling phases. 
  Takes the el to bind to, and a map of the fns to call for each
  stage.
  preStart : (optional) takes the event obj as an argument. Should
             return true if event handler should take control of
             the event.
  start    : (optional) takes the event obj as an argument. Is only 
             called if preStart returned true, or if no other
             listeners claimed the event.
  preMove  : (optional) takes the event obj as an argument. Should
             return true if the event handler should take control of
             the event. Will only be called if "start" was called.
  move     : (optional) takes the event obj as an argument. Is only
             called if preMove returned true or if no other
             listeners claimed the event and this was the deepest
             listener. Will only be called if "start" was called.
  end      : Is called with the event obj as an argument. Only called
             if no other listener claimed the entire event lifecycle.
  lost     : (optional) Is called with no arguments, used to cleanup
             after "start" and "move". It is called when another
             listener has claimed the event.
  
  */
  function PointerNested(el, opts) {
    this.el = el;
    this.opts = opts;
    bind(el, this, events.POINTER_START);
    bind(el, this, events.POINTER_START, true);
  }

  PointerNested.prototype.phaseDispatch = function(e, capture, bubble) {
    if (e.eventPhase == 1) {
      capture.call(this, e);
    } else if (e.eventPhase == 2) {
      if (e._preCalled) {
        bubble.call(this, e);
      } else {
        capture.call(this, e);
        e._preCalled = true;
      }
    } else {
      bubble.call(this, e);
    }
  };

  PointerNested.prototype.handleEvent = function(e) {
    switch(e.type) {
      case events.POINTER_START:
        this.phaseDispatch(e, this.preStart, this.start);
        break;
      case events.POINTER_MOVE:
        this.phaseDispatch(e, this.preMove, this.move);
        break;
      case events.POINTER_END:
        this.end(e);
        break;
      case events.POINTER_CANCEL:
        this.lost();
        break;
    }
  };

  PointerNested.prototype.bindEvents = function(bindToDocument) {
    var bindEl = bindToDocument ? document : this.el;
    bind(bindEl, this, [events.POINTER_MOVE, events.POINTER_END]);
    bind(bindEl, this, events.POINTER_MOVE, true);
  };

  PointerNested.prototype.unbindEvents = function(bindToDocument) {
    var bindEl = bindToDocument ? document : this.el;
    unbind(bindEl, this, [events.POINTER_MOVE, events.POINTER_END]);
    unbind(bindEl, this, events.POINTER_MOVE, true);
  };

  PointerNested.prototype.callStage = function(stage, args) {
    if (this.opts[stage]) {
      return this.opts[stage].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  };

  PointerNested.prototype.preStart = function(e) {
    this.owns = {};
    this.fistMove = false;
    if (this.callStage("preStart", e)) {
      e._pointerNested = this;
      this.owns.preStart = true;
    }
  };

  PointerNested.prototype.start = function(e) {
    if (e._pointerNested) {
      if (e._pointerNested === this) {
        this.bindEvents()
        this.callStage("start", e);
      }
    } else {
      this.bindEvents();
      this.callStage("start", e);
    }
  };

  PointerNested.prototype.preMove = function(e) {
    this.calledPreMove = true;
    if (e._pointerNested && e._pointerNested.owns.move) {
      return;
    } else if (this.callStage("preMove", e)) {
      e._pointerNested = this;
      this.owns.preMove = true;
    } else if (this.owns.preMove) {
      this.unbindEvents(true);
      this.callStage("lost");
    }
  };

  PointerNested.prototype.move = function(e) {
    // if we are getting called on document after we
    // unbound from el and bound to document, return  
    if (e.moveStage && e.moveStage[this]) {
      return;
    } else if (e._pointerNested) {
      if (e._pointerNested == this) {
        this.callStage("move", e);
        this.unbindEvents();
        this.bindEvents(true);
        e.moveStage = e.moveStage || {};
        e.moveStage[this] = true;
        this.owns.move = true;
      } else if (this.owns.preMove) {
        this.firstMove ? this.unbindEvents() : this.unbindEvents(true);
        this.callStage("lost");
      }
    } else {
      e._pointerNested = this;
      this.move(e);
    }
  };

  PointerNested.prototype.end = function(e) {
    if (this.calledPreMove && !this.owns.move) {
      this.callStage("lost");
    } else {
      this.callStage("end", e);
    }
    this.firstMove ? this.unbindEvents() : this.unbindEvents(true);
  };


  events.PointerSlide = PointerSlide;
  events.PointerAction = PointerAction;
  events.PointerNested = PointerNested;
  events.bind = bind;
  events.unbind = unbind;
  events.inElementRange = inElementRange;
  window.EVE = events;
  return events;
});
