define(["./css", "./dom", "./events"], function(css, dom, EVENTS) {
  function Indicator(axis) {
    this.axis = axis;
    this.dom =
      {parent : dom.createElement("div",
                                  {"class" : "scroll-indicator scroll-indicator-" + axis}),
       start : dom.createElement("div"),
       middle : dom.createElement("div", {"class" : "scroll-indicator-middle"}),
       end : dom.createElement("div")};
    dom.appendChildren(this.dom.parent, [this.dom.start, this.dom.middle, this.dom.end]);
    this.dom.parent.addEventListener(EVENTS.TRANSITION_END, this);
    this.anchor = Indicator.ANCHOR_START;
    this.element = this.dom.parent;
  }

  Indicator.THICKNESS = 5;
  Indicator.END_SIZE = 2;
  Indicator.FADE_DURATION = ".25s";
  Indicator.ANCHOR_START = 0;
  Indicator.ANCHOR_END = 1;

  Indicator.prototype.handleEvent = function(e) {
    if (e.type == EVENTS.TRANSITION_END) {
      if (this.fading) {
        this.element.display = "none";
        this.fading = false;
      }
    }
  }

  Indicator.prototype.setAnimationMode = function(opacity, duration) {
    if (this.opacityMode != opacity) {
      this.opacityMode = opacity;
      if (opacity) {
        css.setTransitionProperties([this.dom.start, this.dom.middle, this.dom.end], [""]);
        css.setTransitionDuration(this.element, duration || Indicator.FADE_DURATION);
        css.setTransitionDuration([this.dom.start, this.dom.middle, this.dom.end], "");
      } else {
        css.setTransitionProperties([this.dom.start, this.dom.middle, this.dom.end],
                                    ["-webkit-transform"]);
        css.setTransitionDuration([this.dom.start, this.dom.middle, this.dom.end],
                                  duration || Indicator.FADE_DURATION);
      }
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
    var scale = length - (Indicator.END_SIZE * 2);
    var endElement, endPosition, middleOffset;
    
    if (this.anchor == Indicator.ANCHOR_START) {
      endElement = this.dom.end;
      endPosition = scale;
      middleOffset = 0;
    } else {
      endElement = this.dom.start;
      endPosition = -scale;
      middleOffset = -1;
    }
    if (this.axis == "x") {
      css.setTransform(this.dom.middle,
                       "translate3d(" + middleOffset + "px,0,0) scale(" + scale + ",1)");
      css.setTranslate(endElement, endPosition);
    } else {
      css.setTransform(this.dom.middle,
                       "translate3d(0," + middleOffset + "px,0) scale(1," + scale + ")");
      css.setTranslate(endElement, 0, endPosition);
    }
  }

  Indicator.prototype.setPosition = function(pos, animate, duration) {
    this.setAnimationMode(!animate);
    var styleAttr;
    if (this.anchor == Indicator.ANCHOR_START) {
      styleAttr = this.axis == "x" ? "left" : "top";
    } else {
      styleAttr = this.axis == "x" ? "right" : "bottom";
    }
    this.element.style[styleAttr] = pos + "px";
  }

  Indicator.prototype.setAnchor = function(anchor) {
    if (anchor != this.anchor) {
      this.anchor = anchor;
      var start = this.axis === "x" ? "left" : "top";
      var end = this.axis === "x" ? "right" : "bottom";
      this.element.style[start] = anchor == Indicator.ANCHOR_START ? "0" : "auto";
      this.element.style[end] = anchor == Indicator.ANCHOR_END ? "0" : "auto";
      var origin = anchor == Indicator.ANCHOR_START ? "left top" : "right bottom";
      css.setTransformOrigin([this.dom.start, this.dom.middle, this.dom.end], origin);
      css.setTransform([this.dom.start, this.dom.end], "");
    }
  }

  return Indicator;
});
