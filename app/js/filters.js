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
