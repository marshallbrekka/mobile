function numberValue(v) {
  return v != null && !isNaN(v) ? v : 0;
}

function roundToPx(val) {
  var pixelRatio = window.devicePixelRatio;
  return (a * pixelRatio | 0) / pixelRatio;
}

function cssTranslate(x, y, z) {
  return "translate3d(" + (x || 0) + "px, " + (y || 0) + "px, " + (z || 0) + "px);";
}

function setTransform(element, value) {
  element.style.webkitTransform = value;
}

function setTransitionDuration(element, duration) {
  element.style.webkitTransitionDuration = duration + "s";
}

function Point(x, y) {
  this.x = numberValue(x);
  this.y = numberValue(y);
}

function Size(width, height) {
  this.width = numberValue(width);
  this.height = numberValue(height);
}

function ScrollView(options) {
  this.layer = options.slider;
  this.hostingLayer = options.container;
  this._contentOffset = new Point();
  this._contentSize = -1;
  this.adjustedContentSize = new Size();
  this.decelerating = false;
  this._dragging = false;
  this._pagingEnabled = false;
  this._pageSize = new Size();
  this._bounces = true;
  this.alwaysBounceVertical = false;
  this.alwaysBounceHorizontal = false;
  this.delegate = null;
  this.canCancelContentTouches = true;
  this.delaysContentTouches = true;
  this._setContentOffsetAnimatedCalledFromSetter = false;
  this.beginTouchesInContentTimer = null;
  this.panGestureRecognizer = new ScrollViewPanGestureRecognizer();
  this.panGestureRecognizer.delegate = this;
  this.userInteractionEnabled = true;
  this.layer.addEventListener("webkitTransitionEnd", this, false);
  this.hostingLayer.addEventListener("webkitTransitionEnd", this, false);
  this.addGestureRecognizer(this.panGestureRecognizer);
  this.layer.addEventListener("focus", this, false);
}

ScrollView.WILL_BEGIN_SCROLLING_ANIMATION = "scrollViewWillBeginScrollingAnimation";

ScrollView.prototype.setAlwaysBounces = function(bounces) {
  if (this._bounces != bounces) {
    this._bounces = bounces;
    this.updateAlwaysBounce();
  }
}

ScrollView.prototype.setAlwaysBounceVertical = function(bounces) {
  if (this._alwaysBounceVertical != bounces) {
    this._alwaysBounceVertical = bounces;
    this.updateAlwaysBounce();
  }
}

ScrollView.prototype.setAlwaysBounceHorizontal = function(bounces) {
  if (this._alwaysBounceHorizontal != bounces) {
    this._alwaysBounceHorizontal = bounces;
    this.updateAlwaysBounce();
  }
}

/*
For some reason when we update bounce in non-native mode
if the hosting layer dimmensions are +1 greater than the _size
dimmensions then we set the hosting layer size to _size.

TODO update why this is once i understand more
*/
ScrollView.prototype.updateAlwaysBounce = function() {
  if (this._hostingLayer.style.width == this._size.width + 1 + "px") {
    this._hostingLayer.style.width = this._size.width + "px";
  }
  if (this._hostingLayer.style.height == this._size.height + 1 + "px") {
    this._hostingLayer.style.height = this._size.height + "px";
  }
}












ScrollView.setContentOffset = function(point) {
  this._setContentOffsetAnimatedCalledFromSetter = true;
  this.setContentOffsetAnimated(point, false);
}

ScrollView.prototype.setContentOffsetAnimated = function(point, animate, duration) {
  if (point && !point.equals(this._contentOffset)) {
    if (animate) {
      this.dispatchNotification(ScrollView.WILL_BEGIN_SCROLLING_ANIMATION, this.delegate);
    }
    this._contentOffset = new Point(roundToPx(point.x), roundToPx(y));
    if (!this.dragging && !this.decelerating) {
      this.adjustContentSize(false);
      this._contentOffset.x = clampValue(this._contentOffset.x, 0, this.maxPoint.x);
      this._contentOffset.y = clampValue(this._contentOffset.y, 0, this.maxPoint.y);
    }
    this.updateScrollPositionWithContentOffset();
    if (animate) {
      this.scrollTransitionsNeedRemoval = true;
      setTransitionDuration(this.hostingLayer, duration || ScollView.PAGING_TRANSITION_DURATION);
    } else {
      this.didScroll(false);
      this.canScrollHorizontally && this.showsHorizonatalScrollIndicator &&
        this.updateHorizontalScrollIndicator();
      this.canScrollHorizontally && this.showsVerticalScrollIndicator &&
        this.updateVerticalScrollIndicator();
    }
    this._setContentOffsetAnimatedCalledFromSetter || this.notifyPropertyChange("contentOffset");
    this._setContentOffsetAnimatedCalledFromSetter = false;
  }
}

ScrollView.prototype.updateScrollPositionWithContentOffset = function() {
  // By setting the scrollTop we prevent normal scrolling from taking
  // place (i think)
  this.layer.scrollTop = this.layer.scrollLeft = 0;
  setTransform(this.hostingLayer, cssTranslate(-this._contentOffset.x, -this._contentOffset.y));
}

ScrollView.prototype.snapContentOffsetToBounds = function(animate) {
  var recurse = false;
  var newPosition = new Point();
  if (this.pagingEnabled && animate) {
    var pageSize = this.pageSize;
    newPosition.x = Math.round(this._contentOffset.x / pageSize.width) * pageSize.width;
    newPosition.y = Math.round(this._contentOffset.y / pageSize.height) * pageSize.height;
    recurse = true;
  } else if (this.bounces) {
    newPoint.x = clampValue(this._contentOffset.x, 0, this.maxPoint.x);
    newPoint.y = clampValue(this._contentOffset.y, 0, this.maxPoint.y);
    recurse = newPoint.x != this._contentOffset.x || newPoint.y != this._contentOffset.y;
  }
  recurse && this.setContentOffsetAnimated(newPoint, animate);
}

/*
I assume this is run after adding content to the view which increases
its dimmensions. Takes a single arg that when set to true will also
adjust the content offset to maintain the current scroll position.
*/
ScrollView.prototype.adjustContentSize = function(adjustScrollPosition) {
  if (adjustScrollPosition) {
    var newPoint = new Point();
    if (this.adjustedContentSize.width != 0) 
      newPoint.x = this._contentOffset.x / this.adjustedContentSize.width;
    if (this.adjustedContentSize.height != 0)
      newPoint.y = this._contentOffset.y / this.adjustedContentSize.height;
  }
  this.adjustedContentSize.width = Math.max(this._size.width, this.contentSize.width);
  this.adjustedContentSize.height = Math.max(this._size.height, this.contentSize.height);
  this.maxPoint = new Point(this.adjustedContentSize.width - this._size.width,
                            this.adjustedContentSize.height - this._size.height);
  if (adjustScrollPosition) {
    this.setContentOffset(new Point(Math.min(newPoint.x * this.adjustedContentSize.width,
                                             this.maxPoint.x),
                                    Math.min(newPoint.y * this.adjustedContentSize.height,
                                             this.maxPoint.y)));
  }
  this.canScrollHorizontally = this._size.width < this.adjustedContentSize.width;
  this.canScrollVertically = this._size.height < this.adjustedContentSize.height;
}


ScrollView.prototype.touchesBeganInCapturePhase = function(e) {
  if (this.scrollEnabled) {
    // skipped code for recognizing sub scroll views and allowing
    // those to recieve the main action.
    e.stopPropagation()
  }
}

ScrollView.prototype.touchesBegan = function(e) {
  if (document.activeElement === e.target) {
    this.interruptTrackingInteration(true);
  } else {
    this.beginTracking(e);
  }
}

ScrollView.prototype.touchesMoved = function(e) {
  var initialPoint = this.getInitialTouch(e);
  if (initialPoint != null) {
    this.lastKnownTouchPosition = Point.fromEvent(e);
  }
  // abbrevieted call to super
  if (!this.contentTouchesCouldNotBeCancelled) {
    this.shouldPreventEventDefault(e) && e.preventDefault();
    this.lastProcessedEvent = e;
  }
}

ScrollView.prototype.shouldPreventEventDefault = function(e) {
  if (e.type == ScrollView.MOVE_EVENT || a.type == ScrollView.EVENT_START) {
    // most of the code here would have dealt with native scroll view
    // or host scroll views.
  }
  return true;
}

ScrollView.prototype.touchesEnded = function(e) {
  if (this.getInitialTouch(e) != null) {
    this.stopTrackingTouches();
    if (this.scrollEnabled) {
      this.originalEndEvent = e;
      if (this.contentTouchesCouldNotBeCancelled) {
        // i don't think this scenario is going to happen
      } else if (this.dragging) {
        e.preventDefault();
        if (this.originalTarget.localName == "select") {
          this.shouldPreventSelectElementFocus = true;
          e.stopPropagation();
        }
      } else {
        this.hideScrollIndicators();
        if (this.isOriginalTargetElementAtPoint(this.lastKnownTouchPosition)) {
          
        }
      }
      
    }
  }
}

ScrollView.prototype.touchesCancelled = function() {
  this.stopTrackingTouches();
  this.hideScrollIndicators();
}

ScrollView.panningGestureDidStart = function() {
  if (!this.contentTouchesCouldNotBeCancelled) {
    if (this.canCancelContentTouches)
  }
}




ScrollView.prototype.beginTracking = function(e) {
  if (!this._tracking) {
    this.stopDecelerationAnimation();
    this.snapContentOffsetToBounds(false);
    this.lastKnownTouchPosition = Point.fromEvent(e);
    var touches = e.targetTouches[0];
    this.initialTouchIdentifier = touches.identifier;
    touches = touches.target;
    this.originalTarget = touches.nodeType === ScrollView.ELEMENT_NODE ? touches : touches.parentElement;
    this.originalStartEvent = e;
    if (this.originalTarget.localName != "select" && this.shouldPreventEventDefault(e)) {
      e.preventDefault();
    }
    this.adjustContentSize(false);
    this.setTracking(true);
    this.beginTouchesInContentTimer = null;
    this.contentTouchesCouldNotBeCanceled = false;
    this.shouldPreventSelectElementFocus = false;
    this.touchesInContentBegan = false;
    if (this.delaysContentTouches) {
      this.beginTouchesInContentTimer = this.callAfterDelay(
        this.beginTouchesInContentIfPermitted, 
        ScrollView.CONTENT_TOUCHES_DELAY);
    } else {
      this.beginTouchesInContentIfPermitted();
    }
    document.addEventListener(ScrollView.MOVE_EVENT, this, true);
    document.addEventListener(ScrollView.END_EVENT, this, true);
    document.addEventListener(ScrollView.CANCEL_EVENT, this, true);    
  }
}


ScrollViewPanGestureRecognizer.prototype.velocityInView = function () {
    this.purgeTrackingDataPointsWithTime((new Date).getTime());
    // if less than 2 tracking points return velocity of 0.
    if (this.trackingDataPoints.length < 2) return new iAd.Point(0, 0);
    // otherwise velocity is (last point - first point) / 
    // ((last point.time - first point.time) * 1E3)
    var a = this.trackingDataPoints[0],
        b = this.trackingDataPoints[this.trackingDataPoints.length - 1],
        c = (b.time - a.time) / 1E3;
    return new iAd.Point((b.point.x - a.point.x) / c, (b.point.y - a.point.y) / c)
};



ScrollView.prototype.startDecelerationAnimation = function () {
    // If bounces is false -> animate
    // if bounces is true
    // and contentOffset <= maxPoint or contentOffset > 0
    // (meaning we are scrolling inside content bounds) -> animate
    if (!(this.bounces && 
         (this._contentOffset.x > this.maxPoint.x || this._contentOffset.x < 0) && 
         (this._contentOffset.y > this.maxPoint.y || this._contentOffset.y < 0))) {

        // Get decleration from pan gesture recognizer and negate them
        // (because all setting of css position properties is inverse of
        // the directions we think in
        this.decelerationVelocity = this.panGestureRecognizer.velocityInView();
        this.decelerationVelocity.x = -this.decelerationVelocity.x;
        this.decelerationVelocity.y = -this.decelerationVelocity.y;

        // Instead of accessing the friction factor const directly we
        // assign its value to a property so that we can adjust it
        // later when performing the deceleration animation
        this.adjustedDecelerationFactor = new iAd.Size(iAd.ScrollView.DECELERATION_FRICTION_FACTOR, iAd.ScrollView.DECELERATION_FRICTION_FACTOR);

        // If we cant scroll in a direction set the velocity for that axis to 0
        if (!this.canScrollVertically) this.decelerationVelocity.y = 0;
        if (!this.canScrollHorizontally) this.decelerationVelocity.x = 0;

        // Set out deceleration bounds
        this.minDecelerationPoint = new iAd.Point(0, 0);
        this.maxDecelerationPoint = this.maxPoint.copy();
        var minDecelerationVelocity;
        if (this.pagingEnabled) {
            var a = this.pageSize;
            
            // min deceleration point for paging is either zero (first
            // page) or the nearest left/top edge from the current position
            this.minDecelerationPoint.x = Math.max(0, Math.floor(this._contentOffset.x / a.width) * a.width);
            this.minDecelerationPoint.y = Math.max(0, Math.floor(this._contentOffset.y / a.height) * a.height);

            // max deceleration point for paging is either the
            // maxPoint or the nearest right/bottom edge from the
            // current position
            this.maxDecelerationPoint.x = Math.min(this.maxPoint.x, Math.ceil(this._contentOffset.x /
                a.width) * a.width);
            this.maxDecelerationPoint.y = Math.min(this.maxPoint.y, Math.ceil(this._contentOffset.y / a.height) * a.height)
        }
        minDecelerationVelocity = this.pagingEnabled ? iAd.ScrollView.MIN_VELOCITY_FOR_DECELERATION_WITH_PAGING : iAd.ScrollView.MIN_VELOCITY_FOR_DECELERATION;
        
        // if the current decelerationVelocity is is greater than the
        // min deceleration velocity
        if (Math.abs(this.decelerationVelocity.x) > minDecelerationVelocity || Math.abs(this.decelerationVelocity.y) > minDecelerationVelocity) {
            this.decelerating = true;
            if (this.pagingEnabled) {
              // We set the contentOffset point for the next page
              // based on our velocity direction. If our velocity is >
              // 0 the next page is the right/bottom one, otherwise
              // the left/top page.
              this.nextPageContentOffset = new iAd.Point(this.decelerationVelocity.x > 0 ? this.maxDecelerationPoint.x : this.minDecelerationPoint.x,
                                                         this.decelerationVelocity.y > 0 ? this.maxDecelerationPoint.y : this.minDecelerationPoint.y);
            } else if (iAd.Utils.objectHasMethod(this.delegate, iAd.ScrollView.WILL_END_DRAGGING)) {
               // TODO? why would we adjust deceleration params if we
              // have a delegate WILL_END_DRAGGING?
               this.adjustedDecelerationParameters();
            }

            this.animatedContentOffset = this._contentOffset.copy();
            // Start the decelerating animation after a single frame
            // of our desired frame rate, set the previous deceleration
            // frame time, and send a declerating notification.
            this.decelerationTimer = this.callMethodNameAfterDelay("stepThroughDecelerationAnimation", iAd.ScrollView.DESIRED_ANIMATION_FRAME_RATE);
            this.previousDecelerationFrame = new Date;
            this.dispatchNotification(iAd.ScrollView.WILL_BEGIN_DECELERATING, this.delegate)
        }
    }
};


ScrollView.prototype.stepThroughDecelerationAnimation = function () {
    if (this.decelerating) {
        // b is the time between this deceleration frame and the last one
        var a = new Date,
            b = a - this.previousDecelerationFrame,
            c = this.animatedContentOffset.copy();
       
        // perform a series of adjustments to the deceleration
        // velocity for each frame between previousDecelerationFrame and now.
        if (this.pagingEnabled)
            for (var d = 0; d < b; d++) {
                
                // first multiply the distance remaining to the next
                // page from the animatedContentOffset by
                // PAGING_ACCELERATION and 1E3 and add that to the
                // deceleration velocity
                this.decelerationVelocity.x += 1E3 * iAd.ScrollView.PAGING_ACCELERATION * (this.nextPageContentOffset.x - c.x);
                // Then multiply the deceleration velocity by PAGING_DECELERATION
                this.decelerationVelocity.x *= iAd.ScrollView.PAGING_DECELERATION;
                // And increase the animatedContentOffset by
                // the result of dividing the decelerationVelocity by 1E3
                c.x += this.decelerationVelocity.x / 1E3;
                this.decelerationVelocity.y += 1E3 * iAd.ScrollView.PAGING_ACCELERATION * (this.nextPageContentOffset.y -
                    c.y);
                this.decelerationVelocity.y *= iAd.ScrollView.PAGING_DECELERATION;
                c.y += this.decelerationVelocity.y / 1E3
            }
        else {
            // keep a local copy of the adjustedDecelerationFactor
            d = this.adjustedDecelerationFactor;

            // Create what i assume is a decelerationFactor based on
            // the amount of time between now and
            // previousDecelerationFrame so that we don't have to
            // perform a strategy similar to the loop in the
            // pagingEnabled block above
            b = new iAd.Size(Math.exp(Math.log(d.width) * b), Math.exp(Math.log(d.height) * b));

            // Creates a divisor for the deceleration velocity.
            // uses the adjustedDecelerationFactor * (1 - b
            // deceleration factor) / (1 - adjustedDecelerationFactor)
            d = new iAd.Size(d.width * ((1 - b.width) / (1 - d.width)), d.height * ((1 - b.height) / (1 - d.height)));
            
            // adjust the animated content offset by the stored
            // deceleration velocity and the adjusted for time passed
            // deceleration factor
            c.x += this.decelerationVelocity.x / 1E3 * d.width;
            c.y += this.decelerationVelocity.y / 1E3 * d.height;

            // alter the decelerationVelocity by the adjusted deceleration factor
            this.decelerationVelocity.x *= b.width;
            this.decelerationVelocity.y *= b.height
        } if (!this.bounces) {
            // if we arent bouncing check if the animatedContentOffset
            // is outside the range 0..maxPoint, and if so set
            // the animatedContentOffset to the closet point to the bounds
            // of the range and set the deceleration velocity to 0
            b = iAd.Number.clampValue(c.x,
                0, this.maxPoint.x);
            if (b != c.x) {
                c.x = b;
                this.decelerationVelocity.x = 0
            }
            b = iAd.Number.clampValue(c.y, 0, this.maxPoint.y);
            if (b != c.y) {
                c.y = b;
                this.decelerationVelocity.y = 0
            }
        }
      
        // set animatedContentOffset to our local copy of the variable.
        this.animatedContentOffset = c;

        // If either of the dimmensions of _contentOffset are != to
        // the rounded to pixel value of our animatedContentOffset
        // call setContentOffset with animatedContentOffset
        if (this._contentOffset.x != iAd.CSS.roundedPxValue(c.x) || 
            this._contentOffset.y != iAd.CSS.roundedPxValue(c.y)) 
          this.contentOffset = c;


        // set the final result of B to true if both of the x/y
        // deceleration velocities are <= MINIMUM_VELOCITY
        b = Math.abs(this.decelerationVelocity.y);
        b = Math.abs(this.decelerationVelocity.x) <= iAd.ScrollView.MINIMUM_VELOCITY && b <= iAd.ScrollView.MINIMUM_VELOCITY;

        // Set D to true if paging is enabled, B is true (deleceration
        // velocity is below the minimum), and the dinstance from
        // current contentOffset to nextPageContentOffset is <= 1
        d = this.pagingEnabled && b && Math.abs(this.nextPageContentOffset.x -
            c.x) <= 1 && Math.abs(this.nextPageContentOffset.y - c.y) <= 1;
      
        // If paging is not enabled and b = true (meaning deceleration
        // velocities are less than the min) or paging is enabled and
        // d is true then call decelerationAnimationCompleted
        if (!this.pagingEnabled && b || d) this.decelerationAnimationCompleted();
        //otherwise the deceleration animation is NOT done
        else {
            if (!this.pagingEnabled && this.bounces) {
                // Because we don't do this when paging is enabled i
                // assume the paging "bounce" happens in some other way.
                b = new iAd.Point(0, 0);
                
                // if the current position is less than the min
                // deceleration point set B to the
                // minDecelerationPoint - the current position.
                if (c.x < this.minDecelerationPoint.x) b.x = this.minDecelerationPoint.x - c.x;
                // Otherwise if current position is greater than the
                // maxDecelerationPoint set b to maxDecelerationPoint
                // - current position
                else if (c.x > this.maxDecelerationPoint.x) b.x = this.maxDecelerationPoint.x - c.x;
                if (c.y < this.minDecelerationPoint.y) b.y = this.minDecelerationPoint.y - c.y;
                else if (c.y > this.maxDecelerationPoint.y) b.y = this.maxDecelerationPoint.y - c.y;

                if (b.x != 0)
                    // If b * decelerationVelocity is <= 0 then add
                    // b * PENETRATION_DECELERATION to
                    // decelerationVelocity, otherwise add b *
                    // PENETRATION_ACCELERATION to decelerationVelocity
                    if (b.x * this.decelerationVelocity.x <=
                        0) this.decelerationVelocity.x += b.x * iAd.ScrollView.PENETRATION_DECELERATION;
                    else this.decelerationVelocity.x = b.x * iAd.ScrollView.PENETRATION_ACCELERATION;
                if (b.y != 0)
                    if (b.y * this.decelerationVelocity.y <= 0) this.decelerationVelocity.y += b.y * iAd.ScrollView.PENETRATION_DECELERATION;
                    else this.decelerationVelocity.y = b.y * iAd.ScrollView.PENETRATION_ACCELERATION
            }
            // Now call oursevles after the desired framerate delay.
            // Can most likeley be done by using requestAnimationFrame
            // with a polyfill for older browsers
            this.decelerationTimer = this.callMethodNameAfterDelay("stepThroughDecelerationAnimation", iAd.ScrollView.DESIRED_ANIMATION_FRAME_RATE);
            this.previousDecelerationFrame = a
        }
    }
};

