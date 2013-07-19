var elements = {player : document.getElementById("video"),
                playerJQ : $("#video"),
                wrapper : $("#video-wrapper"),
                controlls : $("#controlls"),
                gutter : $("#gutter"),
                progress : $("#progress"),
                handle : $("#handle"),
                handleContainer : $("#handle-container"),
                time : $("#time").children().eq(0),
                remaining : $("#remaining").children().eq(0),
                button : $("#button"),
                fullscreen : $("#fullscreen")};

var movieId = window.location.search.substring(1);
var hideTimeout = null;
var hidden = false;
var wasPlaying;

elements.player.src = "/m/theater/" + movieId + ".mp4";

function zeroPad(num) {
  if (num === 0) return "00";
  if (num < 10) return "0" + num;
  return num;
}

function formatTime(time) {
  var seconds = zeroPad(time % 60),
      minutes = Math.floor(time / 60);
  if (minutes > 60) {
    return Math.floor(minutes / 60) + ":" + zeroPad(minutes % 60) + ":" + seconds;
  } else {
    return minutes + ":" + seconds;
  }
}

function moveProgress(percent) {
  elements.handle.css("left", percent + "%");
  elements.progress.css("width", percent + "%");
}

function changeButtonIcon(klass) {
  elements.button.get(0).className = klass;
}

function stopMouseMove (e) {
  e.preventDefault();
  e.stopPropagation();
}

function hidePlayer() {
  $(window).off("mousemove", showPlayer);
  elements.wrapper.addClass("hidden");
  hidden = true;
  hideTimeout = null;
  setTimeout(function() {
    console.log("adding event handler back");
    $(window).on("mousemove", showPlayer)},
             200);
}

function timeoutHidePlayer() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  } 
  if (elements.player.paused) {
    hideTimeout = null;
  } else {
    hideTimeout = setTimeout(hidePlayer, 3000);
  }
}

function showPlayer() {
  elements.wrapper.removeClass("hidden");
  hidden = false;
  timeoutHidePlayer();
}


function play() {
  elements.player.play();
  changeButtonIcon("play");
  timeoutHidePlayer();
}

function pause() {
  elements.player.pause();
  changeButtonIcon("pause");
  showPlayer();
}

function playPause() {
  if (elements.player.paused) {
    play();
  } else {
    pause();
  }
}

function timeData(percent) {
  var usePercent = percent !== null && percent !== undefined;
  var duration = Math.round(elements.player.duration),
      currentTime = Math.round(usePercent ?
                               (duration * percent) : 
                               elements.player.currentTime);
  return {duration : duration,
          currentTime : currentTime,
          percent : 100 * (usePercent ? percent : (currentTime / duration))};
}

function updateProgress(time) {
  time = time || timeData();
  moveProgress(time.percent);
}

function updateTimes(percent) {
  var time = timeData(percent);
  elements.time.text(formatTime(time.currentTime));
  elements.remaining.text(formatTime(time.duration - time.currentTime));
  updateProgress(time);
}

function updateTimesEvent() {
  updateTimes();
}

function bindPlayer(e, f) {
  elements.playerJQ.on(e, f);
}

function unbindPlayer(e, f) {
  elements.playerJQ.off(e, f);
}


var currentTime = null;
function moveByDelta(delta) {
  if (currentTime === null) {
    wasPlaying = !elements.player.paused;
    currentTime = elements.player.currentTime;
    unbindPlayer("timeupdate", updateTimesEvent);
    pause();
  }
  if (delta > 0) {
    changeButtonIcon("forward");
  } else {
    changeButtonIcon("backward");
  }
  var newTime = currentTime + delta;
  var duration = elements.player.duration
  if (newTime < 0) newTime = 0;
  else if (newTime > duration) newTime = duration;
  currentTime = newTime;
  elements.player.currentTime = currentTime;
  updateTimes(newTime / duration);
}

function handleKeyEvents(e) {
  var code = e.keyCode;
  if (code === 13 || code === 32 || code === 179) {
    playPause();
  } else if (code === 37) {
    moveByDelta(-17);
  } else if (code === 39) {
    moveByDelta(17);
  }
}

function keyUp(e) {
  if (e.keyCode === 37 || e.keyCode === 39) {
    currentTime = null;
    bindPlayer("timeupdate", updateTimesEvent);
    if (wasPlaying) {
      play();
    } else {
      pause();
    }
    wasPlaying = null;
  }
}


var gutterRectangle;
var handleRectangle;

/**
  given the xPos of the cursor, returns what percent of the video that
  should be.
*/
function cursorPercent(xPos) {
  xPos = xPos - Math.floor(handleRectangle.width / 2);
  xPos = xPos - gutterRectangle.left;
  if (xPos < 0) {
    xPos = 0;
  } else if (xPos > gutterRectangle.width) {
    xPos = gutterRectangle.width;
  }
  return xPos / gutterRectangle.width;
}

/**
  The event handler that gets called when the mouse moves once it has
  pressed down on the gutter. It updates the UI to the new time and
  sets the video element time.
*/
function gutterMouseMove(e) {
  var percent = cursorPercent(e.clientX);
  var newTime = elements.player.duration * percent;
  elements.player.currentTime = newTime;
  updateTimes(percent);
}

/**
  The event handler that gets called on a mouseup event after a
  mousedown event has occured on the gutter.
*/
function gutterMouseUp(e) {
  $(window).off("mouseup", gutterMouseUp)
           .off("mousemove", gutterMouseMove);
  bindPlayer("timeupdate", updateTimesEvent);
  if(wasPlaying) {
    play();
  }
  wasPlaying = null;
}

/**
   Event handler for the gutter, starts the event handlers for
   mousemove and mouseup. Pauses the video element and records if it
   was playing or paused before the mousedown event so that it can
   play or pause the video once the mouseup event has been trigger.

*/
function gutterMouseDown(e) {
  $(window).on("mouseup", gutterMouseUp)
           .on("mousemove", gutterMouseMove);
  
  unbindPlayer("timeupdate", updateTimesEvent);
  wasPlaying = !elements.player.paused;
  pause();
  gutterRectangle = elements.handleContainer.get(0).getClientRects()[0];
  handleRectangle = elements.handle.get(0).getClientRects()[0];
  gutterMouseMove(e);
}

function toggleFullscreen(e) {
  if (document.webkitFullscreenElement) {
    document.webkitCancelFullScreen();
  } else {
    elements.wrapper.get(0).webkitRequestFullScreen();
  }
}

(function(){
  bindPlayer("timeupdate", updateTimesEvent);
  bindPlayer("canplay", play);
  $(window).on("keydown", handleKeyEvents)
           .on("keyup", keyUp)
           .on("click", showPlayer)
           .on("mousemove", showPlayer);
  elements.button.click(playPause);
  elements.fullscreen.click(toggleFullscreen);
  elements.gutter.on("mousedown", gutterMouseDown);
})();
