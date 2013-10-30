define([
  "underscore"
], function(
  _
) {
  function toBoolean(v) {
    return v === "true";
  }

  function getAttr(attrs, key, def, typeFn) {
    var value = attrs[key];
    if (_.isUndefined(value) || _.isNull(value)) {
      return def;
    } else {
      if (typeFn) {
        return typeFn(value);
      } else {
        return value;
      }
    }
  }

  return {
    get : getAttr,
    toBoolean : toBoolean
  };
});
