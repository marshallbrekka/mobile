define([], function() {

  function clampNum(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function roundToPx(val) {
    var ratio = window.devicePixelRatio;
    return Math.round(val * ratio) / ratio;
  }
  
  return {
    roundToPx : roundToPx,
    clampNum : clampNum
  };
});
