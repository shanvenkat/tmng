'use strict';

/* App Module */

var efileApp = angular.module('efileApp', [
  'ngRoute',
  'ngSanitize',
  'efileControllers',
  'efileServices',
  'efileFilters'
]);

efileApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/search', {
        templateUrl: 'templates/roa-search.html',
        controller: 'RoaSearchCtrl'
      }).
      when('/search/:notFound', {
        templateUrl: 'templates/roa-search.html',
        controller: 'RoaSearchCtrl'
      }).
      when('/result/:serialNumber', {
        templateUrl: 'templates/roa-result.html',
        controller: 'RoaResultCtrl'
      }).
      /*
      when('/apps', {
        templateUrl: 'templates/poc-list.html',
        controller: 'AppListCtrl'
      }).
      when('/app/:appId', {
        templateUrl: 'templates/poc-detail.html',
        controller: 'AppDetailCtrl'
      }).
      */
      /* HTMLs */
      when('/html', {
        templateUrl: 'html/searchTMapp.html',
        controller: 'SearchAppHtmlCtrl'
      }).
      when('/html/123', {
        templateUrl: 'html/responseToOfficeAction.html',
        controller: 'DisplayAppHtmlCtrl'
      }).
      otherwise({
        redirectTo: '/search'
      });
  }]);
