'use strict';
lib.factory("$rfz.util.events", 
            ["$rfz.util.point", "$rfz.util.edges", function(Point, Edges) {
  var supportsTouch = "createTouch" in document;
  var events = {POINTER_START : supportsTouch ? "touchstart" : "mousedown",
                POINTER_MOVE : supportsTouch ? "touchmove" : "mousemove",
                POINTER_END : supportsTouch ? "touchend" : "mouseup",
                POINTER_CANCEL : "touchcancel",
                TRANSITION_END : "webkitTransitionEnd"};
  /*
    Given an element to bind to, an object/fn to listen for the event(s),
    a single event name or an array of event names, and an optional
    boolean indicating if the event should bind to the capture (true)
    or bubbling (false) phase, registers the event listener(s).
  */
  function bind(element, obj, events, capture) {
    capture = capture ? true : false;
    events = Array.isArray(events) ? events : [events];
    _.each(events, function(event) {
      element.addEventListener(event, obj, capture);
    });
  }

  /*
    Just like bind, except removes the event listener(s).
  */
  function unbind(element, obj, events, capture) {
    capture = capture ? true : false;
    events = Array.isArray(events) ? events : [events];
    _.each(events, function(event) {
      element.removeEventListener(event, obj, capture);
    });
  }

  /*
    Given an element, a pointer event, and a distance, returns true
    if the pointer was within <distance> of the elements bounds.
  */
  function inElementRange(element, event, distance) {
    var position = Point.fromEvent(event);
    var elEdges = Edges.fromElement(element);
    distance = distance || 50;
    elEdges = Edges.toAxis(elEdges);
    return Point.applyFn(function(pointer, edge) {
      if (pointer < edge.start) {
        return pointer < edge.start - distance ? 0 : 1;
      } else if (pointer > edge.end) {
        return pointer > edge.end + distance ? 0 : 1;
      }
      return 1;
    }, position, elEdges).test(function(point) {
      return point == 1;
    }, true);
  }

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
    // get the raw dom node reference
    el = el[0];
    this.el = el;
    this.opts = _.defaults(opts, {movePreventDefault : true,
                                  endPreventDefault : true,
                                  startPreventDefault : true});
    bind(el, this, events.POINTER_START);
    bind(el, this, events.POINTER_START, true);
  }

  PointerNested.prototype.log = function(msg) {
    return; // remove to enable verbose logging.
    console.log(this.el.className + " : " + msg);
  }

  /*
    Given an event calls the provided capture or bubbling fn
    depending on what phase the event is in.
  */
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

  /*
    Adds or removes the pointer end event listener.
  */
  PointerNested.prototype.setEndListener = function(shouldBind) {
    this.log("set end listener " + shouldBind);
    var fn = shouldBind ? bind : unbind;
    fn(document, this, events.POINTER_END);
  }

  /*
    Adds or removes the pointer move event listener.
    The first time it is called with a true argument, it binds
    to the element that PointerNested was created with, the 2nd time
    it removes the listener on the supplied element, and binds to the
    document.

    This is done so that we can maintain an execution heirarchy for the
    move events, but also so that when the pointer moves outside the
    bounds of the given element we still recieve the events.
  */
  PointerNested.prototype.setMoveListener = function(shouldBind) {
    this.log("set move listener " + shouldBind);
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

  /*
    Calls the user provided fn (if any) for the given stage (preStart,
    start, etc)
  */
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
      this.log("preStart claimed: our pre start fn returned true");
      e._pointerNested = this;
      this.owns.preStart = true;
    }
  };

  PointerNested.prototype.start = function(e) {
    this.log("start");
    this.firstMove = true;
    if (e._pointerNested) {
      if (e._pointerNested === this) {
        this.log("start owner: the eventOwner is equal to 'this', set the other " +
                 "listeners and call the start stage");
        this.setEndListener(true);
        this.setMoveListener(true);
        this.callStage("start", e);
        if (this.opts.startPreventDefault) {
          e.preventDefault();
        }
      }
    } else {
      this.log("start no owner: no one claimed the start event, so call all of " +
               "the start stages");
      this.setEndListener(true);
      this.setMoveListener(true);
      this.callStage("start", e);
      if (this.opts.startPreventDefault) {
        e.preventDefault();
      }
    }
  };

  PointerNested.prototype.preMove = function(e) {
    this.log("preMove");
    this.calledPreMove = true;
    if (e._pointerNested && e._pointerNested.owns.move) {
      this.log("preMove bail early: the event owner was already set, and the owner " +
               "claimed the event last time, so don't even try to intercept.");
      return;
    } else if (this.callStage("preMove", e)) {
      this.log("preMove claim: our preMove fn returned true, so claim the event.");
      e._pointerNested = this;
      this.owns.preMove = true;
    } else if (this.owns.preMove) {
      this.log("preMove lost: we didn't claim, but we did try and claim last " +
               "time, call our lost fn.");
      this.setEndListener(false);
      this.setMoveListener(false);
      this.callStage("lost");
    }
  };

  PointerNested.prototype.move = function(e) {
    this.log("move step");
    // if we are getting called on document after we
    // unbound from el and bound to document, return
    if (e.moveStage && e.moveStage[this]) {
      this.log("move 2nd call in an event, this means we were unbound from" + 
               " our element and bound to the document. so we exited early");
      return;
    } else if (e._pointerNested) {
      if (e._pointerNested == this) {
        this.log("move own: the owner of the move event is equal to 'this', " +
                 "so we own it, run the 'move' stage");
        this.callStage("move", e);
        if (this.firstMove) {
          this.firstMove = false;
          this.setMoveListener(true);
        }
        e.moveStage = e.moveStage || {};
        e.moveStage[this] = true;
        this.owns.move = true;
        if (this.opts.movePreventDefault) {
          e.preventDefault();
        }
      } 
      // The problem here is for things like an item in a list. If any
      // move action occurs in a direction the scroll view supports,
      // then we should sort of know that the item should get its
      // "lost" method called.
      // One solution could be that if we already owned the event,
      // then we do lose the event for good if we didn't claim the
      // preMove. however, if we never claimed a preMove, the system
      // will call our lost method, but if on another move event
      // the previous move owner loses it, and then we end up claiming
      // it, then we call the start stage again.
      else if (this.owns.preMove) {
        this.log("move lost: we indicated that we owned preMove, but we weren't " +
                 "the indicated owner on the event object. calling the lost stage.");
        this.setEndListener(false);
        this.setMoveListener(false);
        this.callStage("lost");
      } else {
        this.callStage("intercepted");
      }
    } else {
      this.log("move called without any owner, so set ourselves to the " +
               "owner and call move again.");
      e._pointerNested = this;
      this.move(e);
    }
  };

  PointerNested.prototype.end = function(e) {
    this.log("end");
    if (this.calledPreMove && !this.owns.move) {
      this.log("end lost: calledPreMove was ture, and we don't own move, so call lost.");
      this.callStage("lost");
    } else {
      this.log("end called");
      this.callStage("end", e);
      if (this.opts.endPreventDefault) {
        e.preventDefault();
      }
    }
    this.setEndListener(false);
    this.setMoveListener(false);
  };

  PointerNested.prototype.lost = function(e) {
    this.log("lost");
    this.callStage("lost");
    this.setEndListener(false);
    this.setMoveListener(false);
  }

  /*
    PointerAction is a simple wrapper around PointerNested for
    ineractions that only need to know when a "click" has happened on
    the provided element.

    Takes an angular element, a cb to call with the event for the POINTER_END
    event, and a map of options that allow customizing its behavior.

    opts are:
    activeClass  : the class that gets applied after a POINTER_START
    event, defaults to pointer-start.
    claim(X/y)   : if true will claim any POINTER_MOVE events where
    the primary direction of movement is along the (x/y)
    axis. defaults to false.
    delayedClaim : The number of ms to wait before claiming all move
    events. default null.
    elementRange : the distance (in px) from the elements bounds that
    the pointer can be and still register as a hit on
    a POINTER_END event. Default 50.
  */
  function PointerAction(element, cb, opts) {
    this.element = element;
    this.opts = _.defaults(opts || {}, {
      activeClass  : "pointer-start",
      claimX       : false,
      claimY       : false,
      delayedClaim : null,
      elementRange : 50
    });
    this.opts.cb = cb;
    var boundLost = _.bind(this.lost, this);
    var eventHandlers = {
      start : _.bind(this.start, this),
      move  : _.bind(this.move,  this),
      end   : _.bind(this.end, this),
      lost  : boundLost,
      intercepted : boundLost
    };

    if (this.opts.claimX || this.opts.claimY || this.opts.delayedClaim) {
      eventHandlers.preMove = _.bind(this.preMove, this);
    }

    new PointerNested(element, eventHandlers);
  }

  PointerAction.prototype.start = function(e) {
    this.inRange = true;
    this.addClassTimeout = setTimeout(_.bind(function() {
      this.element.addClass(this.opts.activeClass);
    }, this), 100);
    if (this.opts.claimX || this.opts.claimY) {
      this.startPoint = Point.fromEvent(e);
    }
    if (this.opts.delayedClaim !== null) {
      this.claimedAfterDelay = false;
      this.claimTimeout = setTimeout(_.bind(function() {
        this.claimedAfterDelay = true;
      }, this), this.opts.delayedClaim);
    }
  }

  PointerAction.prototype.preMove = function(e) {
    if (this.opts.claimX || this.opts.claimY) {
      var point = Point.fromEvent(e),
      diff = Point.difference(this.startPoint, point),
      abs = diff.copy().abs();
      if (abs.x === abs.y) abs.x += 0.01;
      if ((abs.x > abs.y && this.opts.claimX) ||
          (abs.y > abs.x && this.opts.claimY)) {
        return true;
      }
    }
    if (this.opts.delayedClaim !== null) {
      if (this.claimedAfterDelay) {
        return true;
      } else {
        clearTimeout(this.claimTimeout);
        this.element.removeClass(this.opts.activeClass);
      }
    }
  }

  PointerAction.prototype.move = function(e) {
    var inRange = inElementRange(this.element[0], e);
    var fnName = inRange ? "addClass" : "removeClass";
    // If we are in/(out of) range and weren't in/(out of) range before,
    // then set inRange to our current state, and add/remove the
    // active class
    if (this.inRange !== inRange) {
      this.inRange = inRange;
      this.element[fnName](this.opts.activeClass);
    }
  }

  PointerAction.prototype.end = function(e) {
    clearTimeout(this.addClassTimeout);
    clearTimeout(this.claimTimeout);
    if (this.inRange) {
      // Add the active class before calling the callback
      // so that it at least flashes for a moment.
      this.element.addClass(this.opts.activeClass);
      this.opts.cb.call(null, e);
      this.element.removeClass(this.opts.activeClass);
    }
  }

  PointerAction.prototype.lost = function() {
    clearTimeout(this.addClassTimeout);
    clearTimeout(this.claimTimeout);
    this.element.removeClass(this.opts.activeClass);
  }

  events.PointerAction = PointerAction;
  events.PointerNested = PointerNested;
  events.bind = bind;
  events.unbind = unbind;
  events.inElementRange = inElementRange;
  return events;
}]);
