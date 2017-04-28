'use strict';

/* Controllers */

var efileControllers = angular.module('efileControllers', []);

efileControllers.controller('RoaSearchCtrl', ['$scope', '$routeParams','$location','ResourceBundleResource',
    function($scope,$routeParams,$location,ResourceBundleResource) {
        
        $scope.resourceBundle = ResourceBundleResource.query();
        $scope.message = '';
        $scope.showme = false;
        $scope.applicationNumber = '';
        $scope.notFound = '';
        
        if($routeParams.notFound){
          $scope.notFound = $routeParams.notFound;
          $scope.showme = true;
        }
         
        $scope.go = function() {
            if(pn.utils.isBlank($scope.applicationNumber)){
                $scope.message = 'Application Not Found!';
                $scope.showme= true;
            }else{
                $location.path('/result/'+$scope.applicationNumber);
            }
        };
        
       
    }
]);

efileControllers.controller('RoaResultCtrl', ['$scope', '$routeParams','RoaResource','$location',
    function($scope,$routeParams,RoaResource,$location) {
      $scope.roaForm = RoaResource.get({serialNo:$routeParams.serialNumber});
      
      //wait for the data to be ready. see $promise below.
      $scope.roaForm.$promise.then(function (value) {
        if(!($scope.roaForm.trademark)){
         $location.path('/search/'+$routeParams.serialNumber);
        }
      });
      
      $scope.toggle = function() {
        var elt = $('#roa-editor');
        if( elt.editor() ){
            elt.editor(false);
        } else {
            elt.editor({
                height:150
            });
        }
        console.log($('#roa-editor').html());
      }; // end of toggle function.
      
    }
]);
