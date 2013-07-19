function scrollElement(element, topOffset) {
  var parent = element.parentElement,
      scrollPosition = parent.scrollTop,
      parentHeight = parent.clientHeight,
      elementHeight = element.scrollHeight,
      scrollTop = element.offsetTop - relativeToPixel(topOffset || 0),
      minScrollTop = element.offsetTop - (parentHeight - elementHeight);

  if (minScrollTop > scrollPosition) {
    parent.scrollTop = minScrollTop;
  } else if (scrollTop < scrollPosition) {
    parent.scrollTop = scrollTop;
  }
}

App.factory('KeyboardNav', function() {
  var settings = {};
  var dir = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  function swapScope(newScope) {
    if(settings.scope && settings.scope !== newScope) {
      settings.scope.$emit("key-lose-focus");
      settings.scope = newScope;
    }
  }

  if(!isGoogleTvBrowser()) {
    settings.ignore = true;
  }

  function isArrow(keyCode) {
    return keyCode >= 37 && keyCode <= 40 && !settings.ignore;
  }

  angular.element(document).bind("keydown", function(e) {
    if (isArrow(e.keyCode)) {
      if (settings.scope) {
        console.log("SCOPE");
        console.log(settings.scope);
        var actionPair = dir[e.keyCode - 37];
        e.preventDefault();
        e.stopPropagation();
        settings.scope.$emit("key-action",
                             {row : actionPair[0],
                              col : actionPair[1],
                              setScope : swapScope,
                              action : "move"});
      }
    } else if (e.keyCode === 13 && !settings.ignore) {
      e.preventDefault();
      e.stopPropagation();
      settings.scope.$emit("key-action", {action : "enter", setScope: swapScope});
    }
  });

  settings.swapScope = swapScope;
  settings.labelToDir = function(label) {
    var labels = ["left", "up", "right", "down"];
    return dir[labels.indexOf(label)];
  }
  return settings;
});

function passKeyEvent(data, element, attrs) {
  try {
    var parent = attrs.parentId ? $("#" + attrs.parentId) : element.parent();
    while(true) {
      if(parent[0].tagName === "HTML") {
        return;
      }
      if (parent.attr("key-coord-wrapper") === "") {
        parent.scope().$emit("key-action", data);
        return;
      }
      if (parent.attr("key-coord") === "" || parent.attr("key-coord-input") === "") {
        parent.scope().$emit("key-action", data);
        return;
      }
      parent = parent.parent();
    }
  } catch (e) {
    console.error(e);
  }
}

App.directive("keyCoord", function(KeyboardNav) {
  function findElements(root, type, ids) {
    var elements = [];
    var els = [];
    if (ids) {
      ids = ids.split(",");
      for (var i = 0; i < ids.length; i++) {
        els.push(angular.element(document.getElementById(ids[i])));
      }
    } else {
      els = root.children();
    }
    
    if (type === "grid") {
      var lastTop = null;
      var row = [];
      var el;
      for (var i = 0; i < els.length; i++) {
        el = els[i];
        if (lastTop === null) {
          lastTop = el.offsetTop;
          row.push(els[i]);
        } else if (el.offsetTop !== lastTop) {
          elements.push(row);
          row = [els[i]];
          lastTop = el.offsetTop;
        } else {
          row.push(els[i]);
        }
      }
      elements.push(row);
    } else if (type === "y") {
      for (var i = 0; i < els.length; i++) {
        elements[i] = [els[i]];
      }
    } else {
      elements = [els]
    }
    return elements;
  }

  function modCoords(elements, coords, row, col) {
    coords[0] = coords[0] + row;
    coords[1] = coords[1] + col;
    var columnCount = elements[coords[0]].length;
    if (coords[1] >= columnCount) {
      coords[1] = columnCount - 1;
    }
  }

  function currentElement(elements, coords, returnEmpty) {
    console.log(coords);
    console.log(elements);
    if (elements[coords[0]] && elements[coords[0]][coords[1]]) {
      return  angular.element(elements[coords[0]][coords[1]]);
    } else if (returnEmpty) {
      return angular.element(null);
    } 
    return null;
  }

  function selectCurrent(elements, coords, scrollOffset) {
    var c = currentElement(elements, coords, false);
    if (c) {
      scrollElement(c.addClass("selected")[0], scrollOffset);
    }
  }

  function changeElement(elements, coords, row, col, scrollOffset) {
    currentElement(elements, coords, true).removeClass("selected");
    modCoords(elements, coords, row, col);
    selectCurrent(elements, coords, scrollOffset);
  }

  function handleMove(elements, coords, setScope, scope, row, col, keyFocus, scrollOffset) {
    var elArray;
    var dir;
    var existingIndex;
    if (row !== 0) {
      elArray = elements;
      dir = row;
      existingIndex = coords[0];
    } else if (col !== 0) {
      elArray = elements[coords[0]];
      dir = col;
      existingIndex = coords[1];
    } else {
      return;
    }

    if (dir < 0 && existingIndex === 0) return;
    if (dir > 0 && existingIndex === elArray.length -1) return;
    if(keyFocus !== undefined) {
      modCoords(elements, coords, row, col);
      var subScope = currentElement(elements, coords).scope();
      setScope(subScope);
      subScope.$emit("key-gain-focus");
    } else {
      changeElement(elements, coords, row, col, scrollOffset);
      setScope(scope);
    }
    return true;
  }

  return {
    restrict : "A",
    scope : true,
    link : function(scope, element, attr) {
      if (!isGoogleTvBrowser()) return;
      var elements = findElements(element, attr.type, attr.ids),
          coords = [0, 0],
          type,
          scrollOffset = parseInt(attr.scrollOffset || "0");

      if (attr.initialKeyFocus && !KeyboardNav.scope) {
        KeyboardNav.scope = scope;
        selectCurrent(elements, coords, scrollOffset);
      }

      if(attr.keyWatch) {
        scope.$watch(attr.keyWatch, function() {
          elements = findElements(element, attr.type, attr.ids);
          if (KeyboardNav.scope === scope) {
            selectCurrent(elements, coords, scrollOffset);
          }
        });
      }

      function handleAction(data) {
        if (data.action === "move") {
          return handleMove(elements, coords, data.setScope, scope,
                            data.row, data.col, attr.keyFocus, scrollOffset);
        } else if (data.action === "enter") {
          var current = currentElement(elements, coords, true);
          if (attr.clickDepth) {
            var depth = parseInt(attr.clickDepth);
            for (var i = 1; i <= depth; i++) {
              current = current.children().eq(0);
            }
          }
          current.trigger("click");
          if (attr.enterDirection) {
            data.action = "move";
            var direction =  KeyboardNav.labelToDir(attr.enterDirection);
            data.row = direction[0];
            data.col = direction[1];
            return false;
          }
        }
        return true;
      }

      scope.$on("key-lose-focus", function(e) {
        var leaveReset = attr.leaveReset;
        e.stopPropagation();
        e.preventDefault();
        console.log("leave reset: " + leaveReset);
        currentElement(elements, coords, true).removeClass("selected");
        if (leaveReset === undefined || leaveReset === "true") {
          coords = [0, 0];
        }
      });
      scope.$on("key-gain-focus", function(e) {
        console.log("GAINED FOCUS");
        e.stopPropagation();
        if (attr.keyFocus !== undefined) {
          var subScope = currentElement(elements, coords).scope();
          KeyboardNav.swapScope(subScope);
          subScope.$emit("key-gain-focus");
        } else {
          selectCurrent(elements, coords, scrollOffset);
        }
      });

      scope.$watch("onchange", function(o, n) {
        console.log("watch changed");
      });

      scope.$on("key-action", function(e, data) {
        e.stopPropagation();
        if (!handleAction(data)) {
          passKeyEvent(data, element, attr);
        }
      });

      scope.$emit("key-scope-added", scope);
    }
  }
});

App.directive("keyCoordWrapper", function(KeyboardNav) {
  function swapScope(scope) {
    KeyboardNav.swapScope(scope);
    scope.$emit("key-gain-focus");
  }

  return {
    restrict : "A",
    scope : true,
    link : {pre : function(scope, element, attr) {
      if(!isGoogleTvBrowser()) return;
      var active = false; /* is active when it (or a sub scope), has focus */
      var activeScope; /* can be either this scope or a sub scope */
      scope.$on("key-scope-added", function(e, data) {
        e.stopPropagation();
        activeScope = data;
        if(active) swapScope(activeScope);
      });

      scope.$on("key-scope-removed", function(e, data) {
        e.stopPropagation();
        activeScope = null;
        KeyboardNav.swapScope(scope);
      });
      
      // When a sub scope loses focus from a key action, and it
      // reaches the wrapper, we set active to false;
      scope.$on("key-action", function(e, data) {
        if(data.action === "move") {
          active = false;
        }
      });

      scope.$on("key-gain-focus", function(e) {
        e.stopPropagation();
        active = true;
        if (activeScope) swapScope(activeScope);
      });
    }}
  }
});

App.directive("keyCoordInput", function(KeyboardNav, $parse) {
  function swapScope(scope) {
    KeyboardNav.swapScope(scope);
  }

  function moveCursor(element, unit) {
    var length = element.value.length,
        currentPos = element.selectionStart,
        newPos = currentPos + unit;
    console.log("NEW POS" + newPos);
    console.log("LENGTH " + length);
    if (newPos > length || newPos < 0) return false;
    element.selectionStart = newPos;
    element.selectionEnd = newPos;
    return true;
  }

  return {
    restrict : "A",
    scope : true,
    link : function(scope, element, attr) {
      if(!isGoogleTvBrowser()) return;
      var onEnterFn = $parse(attr["keyOnEnter"]);
      scope.$on("key-action", function(e, data) {
        if(data.action === "move") {
          if (data.row !== 0 || !moveCursor(element[0], data.col)) {
            passKeyEvent(data, element, attr);
          }
        } else if (data.action === "enter") {
          scope.$apply(function() {
            onEnterFn(scope);
          });
        }
        e.stopPropagation();
        e.preventDefault();
      });

      scope.$on("key-lose-focus", function(e) {
        element.blur();
      });

      scope.$on("key-gain-focus", function(e) {
        e.stopPropagation();
        swapScope(scope);
        element[0].focus();
        moveCursor(element[0], 0);
      });
    }
  }
});
