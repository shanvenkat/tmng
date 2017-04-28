'use strict';

/* Controllers */

var efileControllers = angular.module('efileControllers', []);

efileControllers.run(function($rootScope, ResourceBundleResource, ClassInfoResource, CountryResource, StateResource) {
    $rootScope.rootResourceBundleResource = ResourceBundleResource.get();
    $rootScope.rootClassInfoResource = ClassInfoResource.get();
    $rootScope.rootCountryInfo=CountryResource.query();
    $rootScope.rootStateInfo=StateResource.query();
});

efileControllers.controller('MainCtrl', ['$scope', '$rootScope',
    function($scope, $rootScope) {
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
    }
]);


efileControllers.controller('AttorneyCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'SolrResource', 'SearchSevice',
    function($scope, $rootScope, $routeParams, $location, SolrResource, SearchSevice) {
        

        $scope.gotoNewPage = function ( ) {             
                $location.path( '/advSearch');
            };

        $scope.goBack = function ( ) {             
            $location.path( '/attorney');
        };
       
        // initalize Error
        if ($routeParams.errMsg) {
            $scope.showErr = true;
            $scope.errMsg = $routeParams.errMsg;
        } else {
            $scope.showErr = false;
        };

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;

        $scope.action = 'raa'; // by default, raa is checked.
        

        $scope.go = function() {            
            if (pn.utils.isBlank($scope.serialNumber)) {           
                $scope.message = 'Serial Number is required!';
                $scope.showme = true;
            } 
            else 
            {
              //RAA             
              var serialNumbers = $scope.serialNumber.replace(/\s/g, '').split(",");
              
                
              if (serialNumbers.length === 1) {
                  //RAA)
                  if ("raa" === $scope.action) {
                      $location.path('/raa/' + $scope.serialNumber);
                  }

                  if ("raa2" === $scope.action) {
                      $location.path('/removeAttorney/' + $scope.serialNumber);
                  }
                  
                  if ("raa3" === $scope.action) {
                      $location.path('/attorney/withdraw/'+$scope.action+'/case/' + $scope.serialNumber);
                  }

                  if ("raa4" === $scope.action) {
                      $location.path('/attorney/withdraw/'+$scope.action+'/case/' + $scope.serialNumber);
                  }

              } 
              else 
              {
                var searchObject = {
                    "serial_num" : serialNumbers
                };
                var searchType = 'SERIAL_NUMBER_SEARCH';
                var actionType = '';
                if ("raa" === $scope.action) {
                    actionType = 'APPOINT';
                }
                if ("raa2" === $scope.action) {
                    actionType = 'REMOVE';
                }
                if ("raa3" === $scope.action) {
                    actionType = 'WITHDRAW';
                }

                SearchSevice.buildAndExecuteSearchQuery(searchObject, searchType, actionType, $scope);
              }
            }
        };

        $scope.noCaseMsg = false;
        $scope.$on('event:on-case-return', function() {
            $scope.noCaseMsg = true;
        });
    }
]);


efileControllers.controller('EmailRequestSignatureCtrl', ['$location', '$scope', '$routeParams', 'SignatureRequestEmailSevice',
    function($location, $scope, $routeParams, SignatureRequestEmailSevice) {
        $scope.signatureEmail = SignatureRequestEmailSevice.getSignatureRequestEmail();

        $scope.sendRequestSignatureEmail = function() {
            SignatureRequestEmailSevice.setSignatureRequestEmail($scope.signatureEmail);
            SignatureRequestEmailSevice.sendRequestSignatureEmail();
        }

        $scope.GoPrint = function() {                       
              $location.path('/print/' + $routeParams.serialNumber);
      }

        }        
     

         
]);


efileControllers.controller('PrintCtrl', ['$scope', '$routeParams',   'RaaResource',
    function($scope, $routeParams, RaaResource) {         

         var ownerArray = [];
         var COArray = [];
         var OwnerAddressLine1='';
        $scope.trademark = RaaResource.get({
              serialNo: $routeParams.serialNumber            
        });

        $scope.trademark.$promise.then(function(value) {

               $scope.SERIAL_NUMBER= $scope.trademark.serialNumTx;
               $scope.MARK_STATEMENT= $scope.trademark.markDescriptionTx;

               angular.forEach($scope.trademark.tmInterestedParties, function(tmInterestedParty, index) {
                //Handle owner
                if (tmInterestedParty.fkTmIntrstdPartyRoleCd === 'OWNER') {
                    if (tmInterestedParty.interestedParty.interestedPartyCt === 'I') {
                        ownerArray.push(tmInterestedParty.interestedParty.individualGivenNm + ' ' + tmInterestedParty.interestedParty.individualFamilyNm);
                    }
                    // if not individual pull the interestedPartyNm
                    if (tmInterestedParty.interestedParty.interestedPartyCt != 'I') {
                        ownerArray.push(tmInterestedParty.interestedParty.interestedPartyNm);                        
                    }
                    $scope.owner = ownerArray.join(', ');                    

                     angular.forEach(tmInterestedParty.interestedParty.ipMailingAddrs, function(OwnerMailingAddress, index){                           
                             $scope.OwnerAddressLine1 = OwnerMailingAddress.mailingAddress.streetLine1Tx;  
                              $scope.cityNm = OwnerMailingAddress.mailingAddress.cityNm;
                              $scope.geographicRegionNm = OwnerMailingAddress.mailingAddress.geographicRegionNm
                              $scope.cfkCountryCd = OwnerMailingAddress.mailingAddress.cfkCountryCd
                              $scope.postalCd = OwnerMailingAddress.mailingAddress.postalCd                          
                     })
                }                 
                  
              });


              angular.forEach($scope.trademark.tmInterestedParties, function(tmInterestedParty, index) {
                //Handle owner
                if (tmInterestedParty.fkTmIntrstdPartyRoleCd === 'CO') {
                    if (tmInterestedParty.interestedParty.interestedPartyCt === 'I') {
                        COArray.push(tmInterestedParty.interestedParty.individualGivenNm + ' ' + tmInterestedParty.interestedParty.individualFamilyNm);

                    }
                    // if not individual pull the interestedPartyNm
                    if (tmInterestedParty.interestedParty.interestedPartyCt != 'I') {
                        COArray.push(tmInterestedParty.interestedParty.interestedPartyNm);                        
                    }
                    $scope.COArray = COArray.join(', ');                  

                     angular.forEach(tmInterestedParty.interestedParty.ipMailingAddrs, function(COMailingAddress, index){                          
                             $scope.COstreetLine1Tx = COMailingAddress.mailingAddress.streetLine1Tx;  
                              $scope.COcityNm = COMailingAddress.mailingAddress.cityNm;
                              $scope.COgeographicRegionNm = COMailingAddress.mailingAddress.geographicRegionNm
                              $scope.COcfkCountryCd = COMailingAddress.mailingAddress.cfkCountryCd
                              $scope.COpostalCd = COMailingAddress.mailingAddress.postalCd

                          
                     })

                }                
                  
              });
               
              
              angular.forEach($scope.trademark.tmSignatures, function(tmSignature, index) {
                    $scope.signatoryName = tmSignature.signatoryName;  
                    $scope.signatoryPosition = tmSignature.signatoryPosition;                 
              });

               
        }, function(error) {
            $location.path('/attorney/error/No case was found');
        }); //

       
        $scope.GoPrintNow = function(divName) { 
              //printing code       
              var printContents = document.getElementById(divName).innerHTML;
              var originalContents = document.body.innerHTML;        
              document.body.innerHTML = printContents;
              window.print();
              document.body.innerHTML = originalContents;
              

      }

        }        
     

         
]);



