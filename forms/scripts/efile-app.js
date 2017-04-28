'use strict';

/* App Module */

var efileApp = angular.module('efileApp', [
    'ngRoute',
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
            templateUrl: 'templates/main.html',
            controller: 'MainCtrl'
        }).
        when('/advSearch', {
            templateUrl: 'templates/advancedSearch.html',
            controller: 'AttorneyCtrl'
        }).
        when('/attorney', {
            templateUrl: 'templates/attorneyTask.html',
            controller: 'AttorneyCtrl'
        }).
        when('/attorney/error/:errMsg', {
            templateUrl: 'templates/attorneyTask.html',
            controller: 'AttorneyCtrl'
        }).
        when('/raa/:serialNumber', {
            templateUrl: 'templates/appointAttorney.html',
            controller: 'RaaCtrl'
        }).
        when('/reviewAttorney/:serialNumber', {
            templateUrl: 'templates/reviewAttorney.html',
            controller: 'ReviewAttorneyCtrl'
        }).
        when('/completeAttorney/:serialNumber', {
            templateUrl: 'templates/completeAppointAttorney.html',
            controller: 'CompleteAttorneyCtrl'
        }).
        when('/search/searchResults', {
            templateUrl: 'templates/searchResults.html',
            controller: 'SearchResultsCtrl'
        }).
        when('/removeAttorney/:serialNumber', {
            templateUrl: 'templates/removeAttorney.html',
            controller: 'RemoveAttorneyCtrl'
        }).
        when('/reviewRemovedAttorney/:serialNumber', {
            templateUrl: 'templates/reviewAttorney.html',
            controller: 'ReviewRemovedAttorneyCtrl'
        }).
        when('/completeRemovedAttorney/:serialNumber', {
                templateUrl: 'templates/completeAppointAttorney.html',
                controller: 'CompleteRemovedAttorneyCtrl'
            }).
            /* new URLs for multiple attorney add */
        when('/attorneys/add', {
            templateUrl: 'templates/multiCaseAppointAttorney.html',
            controller: 'AttorneysAddCtrl'
        }).
        when('/attorneys/review', {
            templateUrl: 'templates/reviewAttorney.html',
            controller: 'AttorneysReviewCtrl'
        }).
        when('/attorneys/complete', {
                templateUrl: 'templates/completeAppointAttorney.html',
                controller: 'AttorneysCompleteCtrl'
        }).

        /* url for withdraw attorney */
        when('/attorney/withdraw/:withdrawMode/case/:serialNumber', {
                templateUrl: 'templates/withdrawalAttorney.html',
                controller: 'WithdrawAttorneyCtrl'
        }).
        when('/attorney/withdraw/:withdrawMode/correspondence/:serialNumber', {
            templateUrl: 'templates/withdrawalPOACoAndDR.html',
            controller: 'correspondenceWithdrawCtrl'
        }).
        when('/attorney/withdraw/:withdrawMode/domesticRep/:serialNumber', {
            templateUrl: 'templates/withdrawalPOACoAndDR.html',
            controller: 'domesticRepWithdrawCtrl'
        }).

        when('/attorney/withdraw/:withdrawMode/reviewAndSign/:serialNumber', {
            templateUrl: 'templates/reviewAttorneyPowEnding.html',
            controller: 'WithdrawReviewAndSignCtrl'
        }).
        when('/attorney/withdraw/completeWithdraw/:serialNumber', {
            templateUrl: 'templates/completeAppointAttorney.html',
            controller: 'withdrawCompleteCtrl'
        }).
        when('/print/:serialNumber', {
            templateUrl: 'templates/printSection.html',
            controller: 'PrintCtrl'
        }).

        /* HTMLs */
        when('/html', {
            templateUrl: 'html/main.html'
        }).
        when('/html/changeLog', {
            templateUrl: 'html/changeLog.html'
        }).
        when('/html/attorneyTask', {
            templateUrl: 'html/attorneyTask.html',
            controller: 'SearchAppHtmlCtrl'
        }).
        when('/html/appointAttorney', {
            templateUrl: 'html/appointAttorney.html',
            controller: 'DisplayAppHtmlCtrl'
        }).
        when('/html/appointAttorneyMulti', {
            templateUrl: 'html/appointAttorney.html',
            controller: 'MultiAppHtmlCtrl'
        }).
        when('/html/removeAttorney', {
            templateUrl: 'html/removeAttorney.html',
            controller: 'RemoveAppHtmlCtrl'
        }).
        when('/html/withdrawalAttorney', {
            templateUrl: 'html/withdrawalAttorney.html',
            controller: 'WithdrawAttorneyHtmlCtrl'
        }).
        when('/html/withdrawalAttorneyPOA', {
            templateUrl: 'html/withdrawalPowerOfAttorney.html',
            controller: 'WithdrawAttorneyHtmlCtrl'
        }).
        when('/html/correspondenceInfoSingleCase', {
            templateUrl: 'html/correspondenceInfo.html',
            controller: 'CorrespondenceHtmlCtrl'
        }).
        when('/html/domesticRepSingleCase', {
            templateUrl: 'html/correspondenceInfo.html',
            controller: 'DomesticRepHtmlCtrl'
        }).
        when('/html/advancedSearch', {
            templateUrl: 'html/advancedSearch.html',
            controller: 'AdvSearchHtmlCtrl'
        }).
        when('/html/searchResultsByMark', {
            templateUrl: 'html/searchResultsByMark.html',
            controller: 'SearchResultsByMarkHtmlCtrl'
        }).
        when('/html/searchResultsByOwner', {
            templateUrl: 'html/searchResultsByOwner.html',
            controller: 'SearchResultsByOwnerHtmlCtrl'
        }).
        when('/html/searchResultsByAttorney', {
            templateUrl: 'html/searchResultsByAttorney.html',
            controller: 'SearchResultsByAttorneyHtmlCtrl'
        }).
        when('/html/searchResults', {
            templateUrl: 'html/searchResults.html',
            controller: 'TableAppHtmlCtrl'
        }).
        when('/html/reviewAppointAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewAppHtmlCtrl'
        }).
        when('/html/reviewMultiAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewMultiAppHtmlCtrl'
        }).
        when('/html/reviewRemoveAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewRemoveHtmlCtrl'
        }).
        when('/html/reviewWithdrawAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewWithdrawHtmlCtrl'
        }).
        when('/html/reviewWithdrawPOAAttorney', {
            templateUrl: 'html/reviewAttorney.html',
            controller: 'ReviewWithdrawPOAHtmlCtrl'
        }).
        when('/html/completeAttorney', {
            templateUrl: 'html/completeAppointAttorney.html',
            controller: 'ReviewAppHtmlCtrl'
        }).
        otherwise({
            redirectTo: '/main'
        });
    }
]);