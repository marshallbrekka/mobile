App.directive("netripImg", function() {
  var desiredWidth = 150,
      desiredHeight = 222,
      desiredRatio = desiredWidth / desiredHeight;

  function ratioDelta(ratio) {
    return Math.abs(desiredRatio - ratio);
  }
  
  function onLoadHandler(img, attrs) {
    var ratio = img.width / img.height;
    var width, height, left;
    if (ratio <= desiredRatio) {
      width = desiredWidth;
      left = 0;
    } else {
      width = Math.min(Math.ceil(desiredHeight * (ratioDelta(ratio) + desiredRatio)));
      left = (width - desiredWidth) / 2;
    }
    attrs.$set("src", img.src);
    attrs.$set("width", relativeToPixel(width) + "em");
    attrs.$set("height", relativeToPixel(Math.round(width / ratio)) + "em");
    attrs.$set("style", "left:-" + relativeToPixel(left) + "em;");
  }

  return {
    restrict : "A",
    link : function(scope, el, attrs) {
      var img = new Image();
      img.addEventListener("load", function() {
        onLoadHandler(img, attrs);
      });
      attrs.$observe("netripImg", function(value) {
        if (value) {
          img.src = "/m/posters/" + attrs.netripImg + ".jpg";
        }
      });
    }
  }
});
