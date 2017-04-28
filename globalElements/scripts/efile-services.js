'use strict';

/* Services */

var efileServices = angular.module('efileServices', ['ngResource']);

  efileServices.factory('Owner', ['$resource',
  function($resource){
    return $resource('mockdata/:ownerId.json', {}, {
      query: {method:'GET', params:{ownerId:'owners'}, isArray:true}
    });
  }]);
  
  
  efileServices.factory('Test', ['$resource',
  function($resource){
     return $resource("/efile/rest/mark/:markId");
  }]);
  
  efileServices.factory('Apps', ['$resource',
  function($resource){
     return $resource("/efile/rest/test/list/app");
  }]);
  
  efileServices.factory('App', ['$resource',
  function($resource){
     return $resource("/efile/rest/test/id/:id");
  }]);
  
  /*
  module.factory('myService', function($http) {
   return {
        getFoos: function() {
             //return the promise directly.
             return $http.get('/foos')
                       .then(function(result) {
                            //resolve the promise as the data
                            return result.data;
                        });
        }
   }
  });
*/