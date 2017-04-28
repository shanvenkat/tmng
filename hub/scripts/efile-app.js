'use strict';

/* App Module */

var efileApp = angular.module('efileApp', [
    'ngRoute',
    'ngTouch',
    'ngAnimate',
    'ngSanitize',
    'efileControllers',
    'efileServices',
    'efileFilters',
    'ui.bootstrap',
    'efileConfig'
]);



efileApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/home', {
            templateUrl: 'index.html',
            controller: 'MainCtrl'
        }).
        when('/main', {
            templateUrl: 'html/main.html'            
        }).
        when('/hub', {
            templateUrl: 'html/hub.html',
            controller: 'SearchHtmlCtrl'
        }).
        when('/changeLog', {
            templateUrl: 'html/changeLog.html'            
        }).
        when('/attorneyTask', {
            templateUrl: 'html/attorneyTask.html',
            controller: 'SearchAppHtmlCtrl'
        }).
        when('/appointAttorney', {
            templateUrl: 'html/appointAttorney.html',
            controller: 'DisplayAppHtmlCtrl'
        }).
        when('/appointAttorneyMulti', {
            templateUrl: 'html/appointAttorney.html',
            controller: 'MultiAppHtmlCtrl'
        }).
        when('/removeAttorney', {
            templateUrl: 'html/removeAttorney.html',
            controller: 'RemoveAppHtmlCtrl'
        }).
        when('/withdrawalAttorney', {
            templateUrl: 'html/withdrawalAttorney.html',
            controller: 'WithdrawAttorneyHtmlCtrl'
        }).
        when('/withdrawalAttorneyPOA', {
            templateUrl: 'html/withdrawalPowerOfAttorney.html',
            controller: 'WithdrawAttorneyHtmlCtrl'
        }).
        when('/correspondenceInfoSingleCase', {
            templateUrl: 'html/correspondenceInfo.html',
            controller: 'CorrespondenceHtmlCtrl'
        }). 
        when('/domesticRepSingleCase', {
            templateUrl: 'html/correspondenceInfo.html',
            controller: 'DomesticRepHtmlCtrl'
        }). 
        when('/advancedSearch', {
            templateUrl: 'html/advancedSearch.html',
            controller: 'AdvSearchHtmlCtrl'
        }).
        when('/searchResultsByMark', {
            templateUrl: 'html/searchResultsByMark.html',
            controller: 'SearchResultsByMarkHtmlCtrl'
        }).
        when('/searchResultsByOwner', {
            templateUrl: 'html/searchResultsByOwner.html',
            controller: 'SearchResultsByOwnerHtmlCtrl'
        }).
        when('/searchResultsByAttorney', {
            templateUrl: 'html/searchResultsByAttorney.html',
            controller: 'SearchResultsByAttorneyHtmlCtrl'
        }).
        when('/searchResults', {
            templateUrl: 'html/searchResults.html',
            controller: 'TableAppHtmlCtrl'
        }).
        when('/reviewAppointAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewAppHtmlCtrl'
        }).
        when('/reviewMultiAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewMultiAppHtmlCtrl'
        }).
        when('/reviewRemoveAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewRemoveHtmlCtrl'
        }).
        when('/reviewWithdrawAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewWithdrawHtmlCtrl'
        }).
        when('/reviewWithdrawPOAAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewWithdrawPOAHtmlCtrl'
        }).
        when('/completeAttorney', {
            templateUrl: 'html/completeAppointAttorney.html',
            controller: 'ReviewAppHtmlCtrl'
        }).
        otherwise({
            redirectTo: '/main'
        });
    }
]);