define(["angular", "underscore"], function(angular, _) {
  function createElement(tag, props) {
    var propString = _.chain(props)
                     .pairs()
                     .reduce(function(str, pair) {
                       return str + " " + pair[0] + "=\"" + pair[1] + "\"";
                     }, "").value();
    return angular.element("<" + tag + propString +"></" + tag + ">")[0];
  }

  function appendChild(element, child) {
    element.appendChild(child);
  }

  function appendChildren(element, children) {
    _.each(children, function(c) {
      appendChild(element, c);
    });
  }

  return {
    createElement : createElement,
    appendChild : appendChild,
    appendChildren : appendChildren
  };
});
