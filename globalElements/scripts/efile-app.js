'use strict';

/* App Module */

var efileApp = angular.module('efileApp', [
  'ngRoute',
  'efileControllers'
]);

efileApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
     
      /* HTMLs */
       when('/html', {
        templateUrl: 'html/main.html'
        
      }).
      when('/html/editor', {
        templateUrl: 'html/editor.html',
        controller: 'SearchAppHtmlCtrl'
      }).
      when('/html/editor2', {
        templateUrl: 'html/editorWithPatternLibrary.html',
        controller: 'SearchAppHtmlCtrl'
      }).
      when('/html/layout', {
        templateUrl: 'html/tmngLayout.html',
        controller: 'DisplayAppHtmlCtrl'
      }).
      when('/html/patternLibrarylayout', {
        templateUrl: 'html/plLayout.html',
        controller: 'DisplayAppHtmlCtrl'
      }).
      when('/html/interactiveMockup', {
        templateUrl: 'html/mockup.html',
        controller: 'DisplayAppHtmlCtrl'
      }).
      when('/html/table', {
        templateUrl: 'html/table.html',
        controller: 'TableHtmlCtrl'
      }).
      otherwise({
        redirectTo: '/html'
      });
  }]);
