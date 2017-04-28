'use strict';

/* Controllers */

var efileControllers = angular.module('efileControllers', []);

efileControllers.controller('AppListCtrl', ['$scope', 'Apps',
  function($scope, Apps) {
    $scope.apps = Apps.query();
  }]);
  

efileControllers.controller('AppDetailCtrl', ['$scope', '$routeParams','App',
  function($scope, $routeParams, App) {
   
    $scope.formData = App.get({id:$routeParams.appId});
    $scope.myEditor = "";
    
    
    //console.log('TOGGLE from pneumatic is here');
    $('.toggle').on('click', function(){
        var elt = $('#editor-example-1');
        if( elt.editor() ){
            elt.editor(false);
        } else {
            elt.editor({
                height:150
                /*
                , 
                callback:function(){
                    this.insert($("<p>Added by callback</p>"), {where:"append"});
                }
                */
            });
        }
    })/*.trigger('click')*/;
    //console.log('TOGGLE from pneumatic ends here');
    
          
    // process the form
    $scope.processForm = function() {
    
      // check to make sure the form is completely valid
			/*
			//console.log('isValid:'+isValid);
			if (isValid) {
				alert('our form is amazing');
			}
			*/
			
			$scope.formData.appName=$('#editor-example-1').text();
			
			//console.log('editor: '+$('#editor-example-1').text());
			//console.log('appName: '+$scope.formData.appName);
			
			
			if(pn.utils.isBlank($scope.formData.appName)){
        $scope.errorName = 'App Name is required.';
			}
			
			if(pn.utils.isBlank($scope.formData.createdBy)){
        $scope.errorName = 'Created By is required.';
			}
			/*
			if($scope.formData.appName==''){
        $scope.errorName = 'App Name is required.';
			}*/
			
      /*  
      $scope.errorName = 'App Name is required.';
      $scope.errorSuperhero = 'Created By is required.';
      $scope.message = 'Success!!!';
      $scope.formData = {
        id:  9,
        fkTrademarkId: 10,
        appName:'App Name',
        createdBy:'Created By'
      }
      */
      
    };
    
  }]);