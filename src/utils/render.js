lib.factory("$rfz.util.render", function() {
  var renderQueue = {};
  var scheduled = false;
  var rendering = false;

  function renderLoop() {
    scheduled = false;
    rendering = true;
    var queue = renderQueue;
    renderQueue = {};
    _.each(queue, function(fn) {
      fn();
    });
    rendering = false;
  }
      
  function render(id, fn, renderOnNextFrame) {
    if (rendering) {
      if (renderOnNextFrame) {
        renderQueue[id] = fn;
      } else {
        fn();
      }
    } else {
      renderQueue[id] = fn;
    }
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(renderLoop);
    }
  }

  var id = 0;
  function getId() {
    return id++;
  }

  return {
    render : render,
    getId  : getId
  };
});
