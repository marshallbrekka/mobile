function indicatorFactory(css, EVENTS, platform) {

  function legacyTransformX(dom, middleOffset, scale, anchor) {
    if (anchor === Indicator.ANCHOR_END) {
      middleOffset -= (scale - 1);
    }
    css.setTransform(dom, "translate3d(" + middleOffset + "px,0,0)");
    dom.style.width = scale + "px";
  }

  function legacyTransformY(dom, middleOffset, scale, anchor) {
    if (anchor === Indicator.ANCHOR_END) {
      middleOffset -= (scale - 1);
    }
    css.setTransform(dom, "translate3d(0, " + middleOffset + "px,0)");
    dom.style.height = scale + "px";
  }

  function transformX(dom, middleOffset, scale) {
    var transform = "translate3d(" + middleOffset + "px,0,0) scale(" + scale + ",1)";
    css.setTransform(dom, transform);
  }

  function transformY(dom, middleOffset, scale) {
    var transform = "translate3d(0," + middleOffset + "px,0) scale(1," + scale + ")";
    css.setTransform(dom, transform);
  }

  var transformFns = (function() {
    if (platform.os === platform.PLATFORMS.ANDROID &&
       platform.version.major <= 4 && platform.version.minor < 4) {
      return {x : legacyTransformX,
              y : legacyTransformY};
    } else {
      return {x : transformX,
              y : transformY};
    }
  })();

  function Indicator(axis) {
    var parent = angular.element("<div class='rfz-scroll-indicator rfz-scroll-indicator-" +
                                 axis + "'></div>");
    this.axis = axis;
    this.dom = {
      parent : parent[0],
      start : angular.element("<div></div>")[0],
      middle : angular.element("<div class='rfz-scroll-indicator-middle'></div>")[0],
      end : angular.element("<div></div>")[0]
    };
    if (platform.os === platform.PLATFORMS.ANDROID &&
        platform.version.major >= 4 &&
        platform.version.minor >= 4) {
      /* Provide clip to fix a render bug on android >= 4.4.3 */
      this.dom.middle.style.clip = this.axis === "x" ? "rect(0, 1px, 2px, 0)" : "rect(0, 2px, 1px, 0)";
    }
    parent.append(this.dom.start);
    parent.append(this.dom.middle);
    parent.append(this.dom.end);
    this.dom.parent.addEventListener(EVENTS.TRANSITION_END, this);
    this.anchor = Indicator.ANCHOR_START;
    this.element = this.dom.parent;
    this.animation = false;
    this.position = 0;
  }

  // Platform specific constants
  // TODO set platform/version specific values
  Indicator.THICKNESS = 2;
  Indicator.END_SIZE = 1;

  // Generic constants
  Indicator.ANIMATION_DURATION = 0.25;
  Indicator.ANCHOR_START = 0;
  Indicator.ANCHOR_END = 1;

  Indicator.prototype.handleEvent = function(e) {
    if (e.type == EVENTS.TRANSITION_END) {
      if (this.fading) {
        this.fading = false;
      }
    }
  }

  Indicator.prototype.setAnimation = function(on, duration) {
    on = on ? true : false;
    if (this.animation != on) {
      this.animation = on;
      if (on) {
        css.setTransitionProperties([this.dom.start, this.dom.middle, this.dom.end],
                                    ["-webkit-transform"]);
        css.setTransition([this.dom.start, this.dom.middle, this.dom.end],
                          duration || Indicator.ANIMATION_DURATION);
      } else {
        css.setTransitionProperties([this.dom.start, this.dom.middle, this.dom.end], [""]);
        css.setTransitionDuration([this.dom.start, this.dom.middle, this.dom.end], "");
      }
    } 
  }

  Indicator.prototype.show = function() {
    this.setAnimation(false);
    this.fading = false;
    // Set to 0.99 instead of 1 because chrome/android repaints when
    // going from 1 to < 1.
    this.dom.start.style.opacity = "0.99";
    this.dom.middle.style.opacity = "0.99";
    this.dom.end.style.opacity = "0.99";
  }

  Indicator.prototype.hide = function() {
    this.setAnimation(false);
    this.fading = true;
    this.dom.start.style.opacity = "0";
    this.dom.middle.style.opacity = "0";
    this.dom.end.style.opacity = "0";
  }

  Indicator.prototype.setLength = function(length, animate, duration) {
    this.setAnimation(animate, duration);
    var scale = length - (Indicator.END_SIZE * 2);
    var endElement, endPosition, middleOffset;
    
    if (this.anchor == Indicator.ANCHOR_START) {
      endElement = this.dom.end;
      startElement = this.dom.start;
      startPosition = this.position;
      middleOffset = startPosition;
      endPosition = startPosition + scale;

    } else {
      endElement = this.dom.start;
      startElement = this.dom.end;
      startPosition = -this.position - 1;
      middleOffset = startPosition - 1;
      endPosition = startPosition - scale;
    }

    if (this.axis == "x") {
      css.setTranslate(startElement, startPosition);
      transformFns.x(this.dom.middle, middleOffset, scale, this.anchor);
      css.setTranslate(endElement, endPosition);
    } else {
      css.setTranslate(startElement, 0, startPosition);
      transformFns.y(this.dom.middle, middleOffset, scale, this.anchor);
      css.setTranslate(endElement, 0, endPosition);
    }
  }

  Indicator.prototype.setPosition = function(pos, animate, duration) {
    this.position = pos;
    this.setAnimation(animate, duration);
    var styleAttr;
    if (this.anchor == Indicator.ANCHOR_START) {
      styleAttr = this.axis == "x" ? "left" : "top";
    } else {
      styleAttr = this.axis == "x" ? "right" : "bottom";
    }
//    this.element.style[styleAttr] = pos + "px";
  }
              
  /*
  Takes one of the constants ANCHOR_START or ANCHOR_END.
  Sets how the indicator is anchor to the page. If the
  Indicator is for the x axis, then the start anchor is
  "left" and the end anchor is "right".
  */
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
}

lib.factory("$rfz.util.indicator",
            ["$rfz.util.css", "$rfz.util.events", "$rfz.util.platform",
             indicatorFactory]);
