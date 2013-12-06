define([
  "utils/events"
], function(
  events
) {
  function triggerEvent(eventType, element) {
    var e = new Event(eventType);
    e.initEvent(eventType, true, true);
    element.dispatchEvent(e);
  }

  function makeCalls() {
    var calls = {};
    calls.preStart = calls.start = calls.preMove = calls.move = calls.end = calls.lost = 0;
    return calls;
  }

  function makeListeners(element, calls, delegates) {
    function makeListener(listener) {
      return function(e) {
        calls[listener]++;
        if (delegates && delegates[listener]) {
          return delegates[listener](e);
        }
      };
    }
    var eventListeners = {};
    for (var i in calls) {
      if (calls.hasOwnProperty(i)) {
        eventListeners[i] = makeListener(i);
      }
    }
    return eventListeners;
  }

  function expectCounts(calls, expected) {
    expected = expected || {};
    for (var i in calls) {
      if (calls.hasOwnProperty(i)) {
        var count = (expected[i] || expected[i] === 0) ? expected[i] : 1;
//        console.log("expect " + i + " to be " + count + " and it was " + calls[i]);
        expect(calls[i]).toBe(count);
      }
    }
  }

  describe("The nestedEvents", function() {
    it("A single listener that never claims should still receive all 5 events.", function() {
      var calls = makeCalls();
      var element = document.createElement("div");
      document.body.appendChild(element);
      new events.PointerNested(element, makeListeners(element, calls));
      triggerEvent(events.POINTER_START, element);
      triggerEvent(events.POINTER_MOVE, element);
      triggerEvent(events.POINTER_END, element);
      expectCounts(calls, {lost : 0});
      document.body.removeChild(element);
    });

    it("2 Nested Elements, expect the outer one to claim the move event", function() {
      var outerCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var innerElement = document.createElement("div");
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {preMove : function() {return true}}));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls));
      outerElement.appendChild(innerElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {lost : 0});
      expectCounts(innerCalls, {move : 0, lost : 1, end : 0});
      document.body.removeChild(outerElement);
    });

    it ("2 nested elements, where the inner claims the move, but then loses it", function() {
      var outerCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var innerElement = document.createElement("div");
      var moveCallCount = 0;
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {
          preMove : function() {return moveCallCount++ >= 2;}
        }));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls, {
          preMove : function() {return moveCallCount++ < 2;}
        }));
      outerElement.appendChild(innerElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {lost : 0, preMove : 2});
      expectCounts(innerCalls, {lost : 1, preMove : 2, end : 0});
      document.body.removeChild(outerElement);      
    });

    it ("Inner claims, but then loses it after 2 moves", function() {
      var outerCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var innerElement = document.createElement("div");
      var moveCallCount = 0;
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {
          preMove : function() {return moveCallCount++ >= 3;}
        }));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls, {
          preMove : function() {return moveCallCount++ < 3;}
        }));
      outerElement.appendChild(innerElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {lost : 0, preMove : 2});
      expectCounts(innerCalls, {lost : 1, preMove : 3, end : 0, move : 2});
      document.body.removeChild(outerElement);
    });

    it ("3 nested, middle claims, then loses to outer", function() {
      var outerCalls = makeCalls();
      var middleCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var middleElement = document.createElement("div");
      var innerElement = document.createElement("div");
      var moveCallCount = 0;
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {
          preMove : function() {return moveCallCount++ >= 3;}
        }));
      new events.PointerNested(
        middleElement, 
        makeListeners(middleElement, middleCalls, {
          preMove : function() {return moveCallCount++ < 3;}
        }));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls));
      middleElement.appendChild(innerElement);
      outerElement.appendChild(middleElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {lost : 0, preMove : 2});
      expectCounts(middleCalls, {preMove : 3, end : 0, move : 2});
      expectCounts(innerCalls, {end : 0, move : 0, preMove : 2});
      document.body.removeChild(outerElement);
    });

    it ("2 outer claims start", function() {
      var outerCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var innerElement = document.createElement("div");
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {
          preStart : function() {return true}
        }));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls));
      outerElement.appendChild(innerElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {lost : 0});
      expectCounts(innerCalls, {end : 0, move : 0, preMove : 0, 
                                start : 0, lost : 0});
      document.body.removeChild(outerElement);
    });

    it ("2 outer claims start, but so does inner", function() {
      var outerCalls = makeCalls();
      var innerCalls = makeCalls();
      var outerElement = document.createElement("div");
      var innerElement = document.createElement("div");
      new events.PointerNested(
        outerElement, 
        makeListeners(outerElement, outerCalls, {
          preStart : function() {return true}
        }));
      new events.PointerNested(
        innerElement,
        makeListeners(innerElement, innerCalls, {
          preStart : function() {
            return true;
          }
        }));
      outerElement.appendChild(innerElement);
      document.body.appendChild(outerElement);
      triggerEvent(events.POINTER_START, innerElement);
      triggerEvent(events.POINTER_MOVE, innerElement);
      triggerEvent(events.POINTER_END, innerElement);
      expectCounts(outerCalls, {end : 0, move : 0, preMove : 0, 
                                start : 0, lost : 0});
      expectCounts(innerCalls, {lost : 0});
      document.body.removeChild(outerElement);
    });
  });
});
