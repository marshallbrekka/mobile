define(["./css"], function(css) {
  function Indicator(axis) {
    this.axis = axis;
    this.element = document.createElement("div");
    this.element.className = "scroll-indicator scroll-indicator-" + axis;
    this.element.style.zIndex = "100";
    this.anchor = Indicator.ANCHOR_START;
  }

  Indicator.THICKNESS = 6;
  Indicator.END_SIZE = 3;
  Indicator.FADE_DURATION = ".25s";
  Indicator.ANCHOR_START = 0;
  Indicator.ANCHOR_END = 1;

  Indicator.prototype.handleEvent = function(e) {
    if (e.type == "webkitTransitionEnd") {
      if (this.fading) {
        this.element.display = "none";
        this.fading = false;
      }
    }
  }

  Indicator.prototype.setAnimationMode = function(opacity, duration) {
    if (this.opacityMode != opacity) {
      this.opacityMode = opacity;
      css.setTransitionProperties(this.element, opacity ? ["opacity"] :
                              ["width", "height", "-webkit-transform"]);
      css.setTransitionDuration(this.element, duration || Indicator.FADE_DURATION);
    }
  }

  Indicator.prototype.show = function() {
    this.setAnimationMode(true);
    this.fading = false;
    this.element.style.display = "block";
    this.element.style.opacity = "1";
  }

  Indicator.prototype.hide = function() {
    this.setAnimationMode(true)
    this.fading = true;
    this.element.style.opacity = "0";
  }

  Indicator.prototype.setLength = function(length, animate, duration) {
    this.setAnimationMode(!animate);
    var unit = this.axis == "x" ? "width" : "height";
    length = Math.max(Indicator.END_SIZE * 2, length);
    this.element.style[unit] = length + "px";
  }

  Indicator.prototype.setPosition = function(pos, animate, duration) {
    this.setAnimationMode(!animate);
    var x = this.axis == "x" ? pos : 0;
    var y = this.axis == "y" ? pos : 0;
    css.setTranslate(this.element, x, y);
  }

  Indicator.prototype.setAnchor = function(anchor) {
    if (anchor != this.anchor) {
      this.anchor = anchor;
      var start = this.axis === "x" ? "left" : "top";
      var end = this.axis === "x" ? "right" : "bottom";
      this.element.style[start] = anchor == Indicator.ANCHOR_START ? "0" : "auto";
      this.element.style[end] = anchor == Indicator.ANCHOR_END ? "0" : "auto";
      console.log("dope");
    }
  }

  return Indicator;
});
