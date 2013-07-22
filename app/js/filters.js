'use strict';

/* Filters */

var filters = angular.module('RFZ.filters', [])

filters.filter("ifEqual", function() {
  return function(val1, val2, ifTrue, ifFalse) {
    return val1 === val2 ? ifTrue : ifFalse;
  }
});

filters.filter("capitalize", function(){
  return function(x) {
    return x.substring(0,1).toUpperCase() + x.substring(1);
  }
});

filters.filter("currency", function() {
  return function format(num) {
    var negative = false;
    if (num < 0) {
      negative = true;
      num = num * -1;
    }
    var numStr = num.toFixed(2);
    var finalStr = numStr.substr(-3, 3);
    for (var i = numStr.length - 4, y = 0; i >= 0; i--, y++) {
      if (y !== 0 && y % 3 === 0) {
        finalStr = "," + finalStr;
      }
      finalStr = numStr[i] + finalStr;
    }
    return (negative ? "-$" : "$") + finalStr;
  }
});
