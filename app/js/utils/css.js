define([
"./point",
"underscore"
], function(
Point,
_
) {

  function elementToElements(element) {
    if (element instanceof Node) {
      return [element];
    }
    return element;
  }

  function setTransform(element, transform) {
    _.each(elementToElements(element), function(el) {
      el.style.webkitTransform = transform;
    });
  }

  function setTranslate(element, x, y, z) {
    setTransform(element,
                 "translate3d(" + (x || 0) + "px," + 
                 (y || 0) + "px," + (z || 0) + "px)");
  }

  function setTransitionDuration(element, duration) {
    _.each(elementToElements(element), function(el) {
      el.style.webkitTransitionDuration = duration;
    });
  }

  function setTransitionProperties(element, properties) {
    _.each(elementToElements(element), function(el) {
      el.style.webkitTransitionProperty = properties.join(", ");
    });
  }

  function setTransition(element, duration) {
    _.each(elementToElements(element), function(el) {
      el.style.webkitTransitionDuration = duration + "s";
    });
  }

  function getPointFromTranslate(element) {
    var computed = getComputedStyle(element);
    var pieces = computed.webkitTransform.split("(")[1].split(",");

    if (pieces.length < 16) {
      return new Point(parseFloat(pieces[4]), parseFloat(pieces[5]));
    } else {
      return new Point(parseFloat(pieces[12]), parseFloat(pieces[13]));    
    }
  }

  function setTransformOrigin (element, origin) {
    _.each(elementToElements(element), function(el) {
      el.style.webkitTransformOrigin = origin;
    });
  }

  return {
    setTransform : setTransform,
    setTranslate : setTranslate,
    setTransitionDuration : setTransitionDuration,
    setTransitionProperties : setTransitionProperties,
    setTransition : setTransition,
    getPointFromTranslate : getPointFromTranslate,
    setTransformOrigin : setTransformOrigin
  };
});
