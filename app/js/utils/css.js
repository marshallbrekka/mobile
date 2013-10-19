define([
"./point"
], function(
Point
) {

  function setTranslate(element, x, y, z) {
    element.style.webkitTransform =
      "translate3d(" + (x || 0) + "px," + (y || 0) + "px," + (z || 0) + "px)";
  }

  function setTransitionDuration(element, duration) {
    element.style.webkitTransitionDuration = duration;
  }

  function setTransitionProperties(element, properties) {
    element.style.webkitTransitionProperty = properties.join(", ");
  }

  function setTransition(element, duration) {
    element.style.webkitTransitionDuration = duration + "s";
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

  return {
    setTranslate : setTranslate,
    setTransitionDuration : setTransitionDuration,
    setTransitionProperties : setTransitionProperties,
    setTransition : setTransition,
    getPointFromTranslate : getPointFromTranslate
  };
});
