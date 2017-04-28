'use strict';

/* Filters */

angular.module('efileFilters', []).filter('split', function() {
  return function(input, position) {
    var split= input.split('|');
    if(position==1) return split[1];// return the literal
    if(position==2) return split[0];// return the meaning.
    return input;
  };
});
