'use strict';
lib.factory("$rfz.util.css", ["$rfz.util.point", function (Point) {
  var transformProperty, transitionProperty;

  function findSupportedProperty(prop) {
    var element = document.createElement("div");
    if (element.style[prop] !== undefined) {
      return prop;
    } else {
      var capitalized = prop.charAt(0).toUpperCase() + prop.substring(1);
      var prefixes = ["Moz", "webkit", "o"],
      prefix = _.chain(prefixes)
        .filter(function(prefix) {
          return element.style[prefix + capitalized] !== undefined;
        }).first().value();
      if (prefix) {
        return prefix + capitalized;
      }
    }
  }

  transformProperty = findSupportedProperty("transform");
  transitionProperty = findSupportedProperty("transition");

  function elementToElements(element) {
    if (element instanceof Node) {
      return [element];
    }
    return element;
  }

  function setTransform(element, transform) {
    if (element instanceof Node) {
      element.style[transformProperty] = transform;
    } else {
      for (var i = 0, length = element.length; i < length; i++) {
        element[i].style[transformProperty] = transform;
      }
    }
  }

  function setTranslate(element, x, y, z) {
    setTransform(element, 
                 "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, "
                 + (x || 0) + ", " + (y || 0) + "," + (z || 0) + " , 1)");
  }

  function setTransitionDuration(element, duration) {
    _.each(elementToElements(element), function(el) {
      el.style[transitionProperty + "Duration"] = duration;
    });
  }

  function setTransitionProperties(element, properties) {
    _.each(elementToElements(element), function(el) {
      el.style[transitionProperty + "Property"] = properties.join(", ");
    });
  }

  function setTransition(element, duration) {
    _.each(elementToElements(element), function(el) {
      el.style[transitionProperty + "Duration"] = duration + "s";
    });
  }

  function getPointFromTranslate(element) {
    var computed = getComputedStyle(element);
    var pieces = computed[transformProperty].split("(")[1].split(",");

    if (pieces.length < 16) {
      return new Point(parseFloat(pieces[4]), parseFloat(pieces[5]));
    } else {
      return new Point(parseFloat(pieces[12]), parseFloat(pieces[13]));    
    }
  }

  function setTransformOrigin (element, origin) {
    _.each(elementToElements(element), function(el) {
      el.style[transformProperty + "Origin"] = origin;
    });
  }

  function textRect(element) {
    var range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  }

  return {
    setTransform : setTransform,
    setTranslate : setTranslate,
    setTransitionDuration : setTransitionDuration,
    setTransitionProperties : setTransitionProperties,
    setTransition : setTransition,
    getPointFromTranslate : getPointFromTranslate,
    setTransformOrigin : setTransformOrigin,
    textRect           : textRect
  };
}]);
