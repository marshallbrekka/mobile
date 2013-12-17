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
) {
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
  PointerNested is used to allow an element to claim the
  start-move-end event cycle at either the start or move
  events, without the need for it to communicate directly
  with any other listeners either on the target element,
  or on any of its parent elements.

  The entire possible event cycle is as follows
  preStart - called once
  start    - called once
  preMove  - called zero or more times
  move     - called zero or more times
  end      - called zero or one times
  lost     - called the opposite of end. If end was called lost is
             not, and viceversa.

  Each listener can register a preStart and preMove fn,
  which will be called with the event object.
  If the pre* fn returns true, then it has "claimed" the
  event. If it returns false, its corresponding non-pre
  handler will only be called if no other listener claimed
  the event. In the case of preMove, its move listener
  will only be called if no handlers claimed the event and
  it was the deepest listener in the dom heiarchy.

  Its worth noting that even if a pre* fn claims the event,
  it does not guarantee that the event has been claimed.
  The pre* fns are called from the most outer dom node to
  the deepest, so any pre* fn that is deeper than the one
  before it can claim an already claimed event.

  preStart:
  In most cases the preStart handler is not needed. If a
  listener claims the event at preStart, none of the other
  start event listeners will be called, and none of them will
  have any further stage called. In most cases you want all
  of the event handlers to recieve the start event,
  and then perform the claiming in the "move" stage.

  A good example of using preStart is for a scroll view. If
  the scroll view was already in motion, it should not be
  possible to accidently interact with any controls while
  continually touching and moving to scroll. In that case when
  the scroll views preStart handler is called, it would check if
  the view is moving, and then return true to claim the entire
  event cycle.

  preMove:
  Unlike preStart, if no listeners claim the event from preMove,
  then the deepest listener auto claims it.
  If preMove does claim the event, then a few things happen.
  The move listener is called, then it stops listening for move events
  on the original element, and rebinds the listener to the document.
  This is done so that we still recieve move events when the pointer
  is outside the bounds of the target element.

  If preStart returns false on any subsequent call after it has
  returned true, then its event listeners will be removed and the
  "lost" stage will be called. At this point any remaning listeners
  will be called and a new listener can claim the event.


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

  PointerNested.prototype.log = function(msg) {
    console.log(this.el.className + " : " + msg);
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

  PointerNested.prototype.setEndListener = function(shouldBind) {
    var fn = shouldBind ? bind : unbind;
    fn(document, this, events.POINTER_END);
  }

  PointerNested.prototype.setMoveListener = function(shouldBind, toDocument) {
    if (shouldBind) {
      if (this._boundElement) {
        if (this._boundElement !== document) {
          unbind(this._boundElement, this, events.POINTER_MOVE);
          unbind(this._boundElement, this, events.POINTER_MOVE, true);
          bind(document, this, events.POINTER_MOVE);
          bind(document, this, events.POINTER_MOVE, true);
          this._boundElement = document;
        }
      } else {
        bind(this.el, this, events.POINTER_MOVE);
        bind(this.el, this, events.POINTER_MOVE, true);
        this._boundElement = this.el;
      }
    } else {
      unbind(this._boundElement, this, events.POINTER_MOVE);
      unbind(this._boundElement, this, events.POINTER_MOVE, true);
      this._boundElement = null;
    }
  }


  PointerNested.prototype.callStage = function(stage, args) {
    if (this.opts[stage]) {
      return this.opts[stage].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  };

  PointerNested.prototype.preStart = function(e) {
    this.log("preStart");
    this.owns = {};
    this.calledPreMove = false;
    this.firstMove = false;
    if (this.callStage("preStart", e)) {
      this.log("preStart claimed");
      e._pointerNested = this;
      this.owns.preStart = true;
    }
  };

  PointerNested.prototype.start = function(e) {
    this.log("start");
    this.firstMove = true;
    if (e._pointerNested) {
      if (e._pointerNested === this) {
        this.log("start owner");
        this.setEndListener(true);
        this.setMoveListener(true);
        this.callStage("start", e);
      }
    } else {
      this.log("start no owner");
      this.setEndListener(true);
      this.setMoveListener(true);
      this.callStage("start", e);
    }
  };

  PointerNested.prototype.preMove = function(e) {
    this.log("preMove");
    this.calledPreMove = true;
    if (e._pointerNested && e._pointerNested.owns.move) {
      this.log("preMove bail early");
      return;
    } else if (this.callStage("preMove", e)) {
      this.log("preMove claim");
      e._pointerNested = this;
      this.owns.preMove = true;
    } else if (this.owns.preMove) {
      this.log("preMove lost");
      this.setEndListener(false);
      this.setMoveListener(false);
      this.callStage("lost");
    }
  };

  PointerNested.prototype.move = function(e) {
      this.log("move");
    // if we are getting called on document after we
    // unbound from el and bound to document, return
    if (e.moveStage && e.moveStage[this]) {
      this.log("move 2nd call in an event");
      return;
    } else if (e._pointerNested) {
      if (e._pointerNested == this) {
        this.log("move own");
        this.callStage("move", e);
        if (this.firstMove) {
          this.firstMove = false;
          this.setMoveListener(true);
        }
        e.moveStage = e.moveStage || {};
        e.moveStage[this] = true;
        this.owns.move = true;
      } else if (this.owns.preMove) {
        this.log("move lost");
        this.setEndListener(false);
        this.setMoveListener(false);
        this.callStage("lost");
      }
    } else {
      this.log("move called without any owner");
      e._pointerNested = this;
      this.move(e);
    }
  };

  PointerNested.prototype.end = function(e) {
    this.log("end");
    if (this.calledPreMove && !this.owns.move) {
      this.log("end lost");
      this.callStage("lost");
    } else {
      this.log("end called");
      this.callStage("end", e);
    }
    this.setEndListener(false);
    this.setMoveListener(false);
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
