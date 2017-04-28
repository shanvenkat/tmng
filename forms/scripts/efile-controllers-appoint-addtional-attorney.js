'use strict';

/* Controllers */
/* Controllers for Appoint Attorney Single case */

efileControllers.controller('RaaCtrl', ['$scope', '$rootScope', '$route', '$http', '$routeParams', '$location', 'ResourceBundleResource', 'MarkInfo', 'GetSATInStagingResource', 'CMSMarkURLResource', 'CheckCasesAndGetIDsResource',
    function($scope, $rootScope, $route, $http, $routeParams, $location, ResourceBundleResource, MarkInfo, GetSATInStagingResource, CMSMarkURLResource, CheckCasesAndGetIDsResource) {

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        
        // page parameter
        $scope.trademark = {};
        $scope.attorneys = [];
        $scope.attorneyInfoForm = {};
        $scope.secondaryAttorneys = [];
        $scope.trademarkID = '';

        // UI Switch
        $scope.disableContinue = true;
        $scope.myVar = false; //show attorney list
        $scope.editVar = true;
        
        // validation regex
        $scope.zipRegex = /./;
        $scope.phoneRegex = /./;
        $scope.faxRegex = /./;
        $scope.emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        $scope.urlRegex = /^((http(s?))\:\/\/)?(((www\.)?[a-zA-Z0-9\-\.]+((\.([a-zA-Z]+)){1,2}))|((\d{1,3}\.){3}(\d{1,3})))(\:[0-9]{0,5})?(\/($|(.*)))*$/;


        // init page
        // get entire trademark info from TRM
        MarkInfo.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value){
            $scope.trademark = value;
            $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);
        });
        // get existing additional attorney in efile staging
        $scope.secondaryAttorneys = GetSATInStagingResource.query({
            serialNum : $routeParams.serialNumber
        });
        // get url for mark image
        $scope.cmsMarkUrl = CMSMarkURLResource.get();
        // check efile staging and TRM to retreive trademark ID
        CheckCasesAndGetIDsResource.save(
            [$routeParams.serialNumber]
        ).$promise.then(function(value){
            $scope.trademarkID = value[$routeParams.serialNumber];
        });
        

        // attorney CRUD function
        $scope.save = function() {
            $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
            $scope.myVar = true;
            $scope.attorneyInfoForm.markId = $scope.trademarkID;
            $scope.attorneyInfoForm.serialNum = $routeParams.serialNumber;
            
            GetSATInStagingResource.save($scope.attorneyInfoForm).$promise.then(function(value){
                $route.reload();
            });
        };

        $scope.delete = function(secondaryAttorney) {
            var content = $("<p>You are about to delete appointed attorney. Continue?</p>");
            content.popup({title: 'Delete Attorney', onsubmit: function(event, data){
                if (data.ok === "OK") {
                    GetSATInStagingResource.remove({
                        markId : $scope.trademarkID,
                        id: secondaryAttorney.id,
                        attorneyType: secondaryAttorney.roleCd
                    }).$promise.then(function(value){
                        $route.reload();
                    });
                };
            }});
        };

        $scope.edit = function(secondaryAttorney) {
            $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Edit";
            $scope.attorneyInfoForm.id = secondaryAttorney.id; // hidden
            $scope.attorneyInfoForm.firstName = secondaryAttorney.firstName;
            $scope.attorneyInfoForm.middleName = secondaryAttorney.middleName;
            $scope.attorneyInfoForm.lastName = secondaryAttorney.lastName;
            $scope.attorneyInfoForm.suffix = secondaryAttorney.suffix;
            //$scope.attorneyInfoForm.barInfo=
            $scope.attorneyInfoForm.nameLine2Tx = secondaryAttorney.firmName;
            $scope.attorneyInfoForm.address1 = secondaryAttorney.address1;
            $scope.attorneyInfoForm.address2 = secondaryAttorney.address2;
            $scope.attorneyInfoForm.address3 = secondaryAttorney.address3;
            $scope.attorneyInfoForm.city = secondaryAttorney.city;
            $scope.attorneyInfoForm.state = secondaryAttorney.state;
            $scope.attorneyInfoForm.zip = secondaryAttorney.zip;
            $scope.attorneyInfoForm.country = secondaryAttorney.country;
            $scope.attorneyInfoForm.email = secondaryAttorney.email;
            $scope.attorneyInfoForm.website = secondaryAttorney.website;
            $scope.attorneyInfoForm.phone = secondaryAttorney.phone;
            $scope.attorneyInfoForm.fax = secondaryAttorney.fax;
            $scope.attorneyInfoForm.docketNumber = secondaryAttorney.docketNumber;
        };


        // page navigation function
        $scope.continue = function() {
            if ($scope.secondaryAttorneys.length === 0) {
                $scope.disableContinue = true;
            } else {
                $scope.disableContinue = false;
                $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
                $location.path('/reviewAttorney/' + $routeParams.serialNumber);
            };
        };

        $scope.goBack = function() {
            $location.path('/attorney');
        };

        $scope.cancel = function() {
            $route.reload();
        }

        // monitoring parameter change
        $scope.$watch('attorneyInfoForm.country', function() {
            if ($scope.attorneyInfoForm.country === 'US') {
                $scope.zipRegex = /^\d{5}(?:[-\s]\d{4})?$/;
                $scope.phoneRegex = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                $scope.faxRegex = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
            } else {
                $scope.zipRegex = /./;
                $scope.phoneRegex = /./;
                $scope.faxRegex = /./;
            };
        });

        $scope.$watch(function(){
            return $scope.secondaryAttorneys.length;
        }, function(){
            if ($scope.secondaryAttorneys.length === 0) {
                $scope.disableContinue = true;
            } else {
                $scope.disableContinue = false;
            };
        });
    }
]);

efileControllers.controller('ReviewAttorneyCtrl', ['$scope', '$rootScope', '$route', '$http', '$routeParams', '$location', 'ResourceBundleResource', 'GlobalResource',
    'RaaResource', 'SignatureResource', 'MiscellaneousResource', 'FileUpload', 'MiscellaneousDocResource', 'RaaMiscellaneousDocResource', 'RaaMiscellaneousResource','AppointedATListForMultiCases', 'SignatureRequestEmailSevice', 'MarkInfo', 'CMSMarkURLResource', 'CheckCasesAndGetIDsResource', 'GetSATInStagingResource', 'SignatureValidationgSevice',
    function($scope, $rootScope, $route, $http, $routeParams, $location, ResourceBundleResource, GlobalResource, RaaResource, SignatureResource, MiscellaneousResource, FileUpload,
        MiscellaneousDocResource, RaaMiscellaneousDocResource, RaaMiscellaneousResource,AppointedATListForMultiCases, SignatureRequestEmailSevice, MarkInfo, CMSMarkURLResource, CheckCasesAndGetIDsResource, GetSATInStagingResource, SignatureValidationgSevice) {

        $scope.ctrlName = 'ReviewAttorneyCtrl';

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        
        $scope.signatureNameRequiredError = false;
        $scope.signatureRequiredError = false;
        $scope.electtonicSignWrongFormate = false;
        $scope.signatures = [];
        
        // page parameter
        $scope.trademark = {};
        $scope.attorneys = [];
        $scope.attorneyInfoForm = {};
        $scope.secondaryAttorneys = [];
        $scope.trademarkID = '';

        // init page
        // get entire trademark info from TRM
        MarkInfo.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value){
            $scope.trademark = value;
            $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);
        });
        // get existing additional attorney in efile staging
        $scope.secondaryAttorneys = GetSATInStagingResource.query({
            serialNum : $routeParams.serialNumber
        });
        // get url for mark image
        $scope.cmsMarkUrl = CMSMarkURLResource.get();
        // check efile staging and TRM to retreive trademark ID
        CheckCasesAndGetIDsResource.save(
            [$routeParams.serialNumber]
        ).$promise.then(function(value){
            $scope.trademarkID = value[$routeParams.serialNumber];
            // Get signatures for this markid.
            $scope.getSignatures();
            $scope.getMiscellaneousStmt();
        });


        $scope.files = [];
        $scope.miscellaneousIn = false;

        $scope.miscellaneousInfoForm = {};
        $scope.miscellaneousInfoForm.text = '';
        $scope.miscellaneousInfoForm.id = -1;

        $scope.signatureInfoForm = {};
        $scope.signatureInfoForm.signingDt = new Date();





        $scope.getSignatures = function() {
            $scope.signatures = [];
            $scope.signatures = SignatureResource.query({
                markId: $scope.trademarkID
            });
        };


        
         
        //replacing createSignature. We now have only one signature.
        $scope.saveOrUpdateSignature = function() {
            if(!SignatureValidationgSevice.valdiateSignature($scope)) {
                console.log("signature fail!");
                return;
            }

            $scope.signatureInfoForm.markId = $scope.trademarkID; 
            $scope.signatureInfoForm.id = $scope.signatures[0].id;
            $scope.signatureInfoForm.signature = $scope.signatures[0].signature; 
            $scope.signatureInfoForm.signatoryName = $scope.signatures[0].signatoryName; 
            $scope.signatureInfoForm.signatoryPosition = $scope.signatures[0].signatoryPosition;
            if (!$scope.signatureInfoForm.signatoryPosition) {
                $scope.signatureInfoForm.signatoryPosition = ' ';
            };
            //$scope.signatureInfoForm.signingDt = $scope.signatures[0].signingDt; 
            $scope.signatureInfoForm.signingDt = new Date();
            $scope.signatureInfoForm.signType = $scope.signatures[0].signType; 
            $scope.signatureInfoForm.signatoryPhoneNumber = $scope.signatures[0].signatoryPhoneNumber; 
                      
            var save = SignatureResource.save($scope.signatureInfoForm);
            save.$promise.then(function(value) {
                $scope.signatures.push(value);
                $scope.signatureInfoForm = {};
                $scope.signatureInfoForm.signingDt = new Date();
            });
        };
        
        /*
        $scope.createSignature = function() {
            $scope.signatureInfoForm.markId = $scope.trademarkID;            
            var save = SignatureResource.save($scope.signatureInfoForm);
            save.$promise.then(function(value) {
                $scope.signatures.push(value);
                $scope.signatureInfoForm = {};
                $scope.signatureInfoForm.signingDt = new Date();
            });
        };
       
        
        $scope.deleteSignature = function(signature) { // Delete a signature
            SignatureResource.delete({}, {
                'id': signature.id
            }).$promise.then(function() {
                $scope.getSignatures();
            });
        };
        */
        
        // click submit
        $scope.submit = function() {           
            if(!SignatureValidationgSevice.valdiateSignature($scope)) {
                console.log("signature fail!");
                return;
            }
            
            //save attachments.
            $scope.saveMiscellaneousStmt();
            
            $scope.attorneyInfoForm = {};
            $scope.interestedPartyIds = [];
            //prepare interestedPartyIds
            angular.forEach($scope.secondaryAttorneys, function(tmInterestedParty){
              $scope.interestedPartyIds.push(tmInterestedParty.id);
            });
            $scope.attorneyInfoForm.interestedPartyIds = $scope.interestedPartyIds; 
            $scope.attorneyInfoForm.serialNum = $routeParams.serialNumber;
            $scope.attorneyInfoForm.markId = $scope.trademarkID;
            
            //create an xml before the cleanup.
            var $promise = $http({
                method: 'POST',
                url: '/efile/rest/raa/submit',
                data: $scope.attorneyInfoForm
            }).success(function(result) {
                //console.log(' Xml generated.');
            });
            
            $scope.tradeMarkIdList = [];
            $scope.tradeMarkIdList.push($scope.trademarkID);
            AppointedATListForMultiCases.setAppointedATListForMultiCases($scope.secondaryAttorneys, $scope.tradeMarkIdList);
            
            $location.path('/completeAttorney/' + $routeParams.serialNumber);
        };

        // go back
        $scope.goBack = function() {
            $location.path('/raa/' + $routeParams.serialNumber);
        };

        $scope.uploadFile = function() {
            if (!$scope.files) {
                $scope.files = [];
            }
            var allowedTypeIn = false;
            var allowedSizeIn = false;
            $scope.fileTypeError = false;
            $scope.fileSizeError = false;
            $scope.fileNameTooLongError = false;

            var file = $scope.fileModel[0];

            // name cannot exceed 50 characters. db limit.
            if (file.name.length > 50) {
                $scope.fileNameTooLongError = true;
            }

            if (file.type.indexOf('JPG') > -1 || file.type.indexOf('PDF') > -1 || file.type.indexOf('JPEG') > -1 || file.type.indexOf('pdf') > -1 || file.type.indexOf('jpg') > -1 || file.type.indexOf('jpeg') > -1) {
                allowedTypeIn = true;
            } else {
                $scope.fileTypeError = true;
            }
            if (file.size < 5242880) {
                allowedSizeIn = true;
            } else {
                $scope.fileSizeError = true;
            }
            if (allowedTypeIn && allowedSizeIn && !($scope.fileNameTooLongError)) {
                $scope.fileTypeError = false;
                $scope.fileSizeError = false;
                $scope.files.push(file);
                $scope.fileModel = null;
            }
        };

        $scope.deleteFile = function(file) {
            $scope.files.splice($scope.files.indexOf(file), 1);
            if (file.id) {
                MiscellaneousDocResource.delete({}, {
                    'id': file.id
                }).$promise.then(function() {

                });
            }
        };

        $scope.checkFile = function() {
            if (!$scope.fileModel) {
                return true;
            } else {
                return false;
            }
        };

        $scope.getMiscellaneousDocs = function() {
            $scope.files = RaaMiscellaneousDocResource.query({
                stmtId: $scope.stmtId,
                markId: $scope.trademarkID
            });
        };

        $scope.getMiscellaneousStmt = function() {
            RaaMiscellaneousResource.get({
                markId: $scope.trademarkID
            }).$promise.then(function(value) {
                if (value.text) {
                    $scope.checked = true;
                    $scope.miscellaneousInfoForm.id = value.id;
                }
                $scope.miscellaneousInfoForm.text = value.text;
                $scope.files = value.supportingDocuments;
            });
        }

        $scope.saveMiscellaneousStmt = function() {

            // save signature Info to tm_signature table           
            //$scope.createSignature();
            
            $scope.saveOrUpdateSignature();

            if (!$scope.checked) {
                if ($scope.miscellaneousInfoForm.id > 0) {
                    var $promise = $http({
                        method: 'DELETE',
                        url: '/efile/rest/additionalstmt/miscellaneous/raa/' + $scope.miscellaneousInfoForm.id
                    }).success(function(result) {
                        $scope.miscellaneousInfoForm.id = -1;
                        $scope.miscellaneousInfoForm.text = null;
                        $scope.files = null;
                    });
                }
            } else {
                if ($scope.miscellaneousInfoForm.id > 0) {
                    if (!$scope.miscellaneousInfoForm.text) {
                        $scope.miscellaneousStmtError = true;
                    } else {
                        $scope.saveMiscStmtToDB();
                    }
                } else {
                    if (!$scope.miscellaneousInfoForm.text) {
                        $scope.miscellaneousStmtError = true;
                    } else {
                        $scope.saveMiscStmtToDB();
                    }
                }
            };
        }

        $scope.saveMiscStmtToDB = function() {
            $scope.miscellaneousStmtError = false;
            $scope.miscellaneousInfoForm.trademarkId = $scope.trademarkID;
            var save = MiscellaneousResource.save($scope.miscellaneousInfoForm);

            //Misc is saved now. Upload the file.
            save.$promise.then(function(value) {
                $scope.stmtId = value.id;
                $scope.miscellaneousInfoForm.id = value.id;

                var uploadUrl = "/efile/rest/raa/upload/stmtId/" + value.id + "/trademarkId/" + $scope.trademarkID + "/serialNum/" + $routeParams.serialNumber;
                if ($scope.files) {
                    for (var i = 0; i < $scope.files.length; i++) {
                        var file = $scope.files[i];
                        if (!file.id) {
                            FileUpload.uploadFileToUrl(file, uploadUrl).then(
                                function(value) {
                                    $scope.getMiscellaneousDocs();
                                },
                                function() {
                                    //console.log("error");
                                });
                        }
                    }
                }
            });//end of upload.
        } // end of saveMiscStmtToDB.

        // finger Sign
        $scope.fingerSignatureForm = {
            jsonData : null,
            imageData : null
        };
        var fingerSignCanvas = null;

        var options = {
            defaultAction : 'drawIt',
            penColour : '#000000',
            lineWidth : 0,
            onDrawEnd : function() {
                $scope.fingerSignatureForm.jsonData = fingerSignCanvas.getSignatureString();
                $scope.fingerSignatureForm.imageData = fingerSignCanvas.getSignatureImage();
            }
        }

        $scope.beginFingerSign = function () {
            fingerSignCanvas = $('.sigPad').signaturePad(options);
        }

        $scope.saveFingerSign = function () {
            // wait for submition model
            //console.log($scope.fingerSignatureForm);
        }

        $scope.clearFingerSign = function () {
            if (fingerSignCanvas != null) {
                fingerSignCanvas.clearCanvas();
                $scope.fingerSignatureForm = {
                    jsonData : null,
                    imageData : null
                };
            };
        }

    }// end of the controller
]);

efileControllers.controller('CompleteAttorneyCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'RaaResource', '$http','AppointedATListForMultiCases',
    function($scope, $rootScope, $location, $routeParams, RaaResource, $http,AppointedATListForMultiCases) {
        //console.log("1");
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.classInfo = $rootScope.rootClassInfoResource;
        $scope.serialNumber = $routeParams.serialNumber;
        $scope.attorneyCount = 0;
        $scope.serialNumList = [];
        
        $scope.attorneyInfoMultipleCasesForm = {};
        $scope.attorneyInfoMultipleCasesForm.ackEmail = '';
        $scope.serialNumList.push($routeParams.serialNumber);
        
        $scope.ctrlName = 'appointAttorney';
        $scope.secondaryAttorneys = AppointedATListForMultiCases.getAttorneyList();
        $scope.attorneyCount = $scope.secondaryAttorneys.length;
      
        // click done.
        $scope.done = function() {
          
          //send ackemail
          var $promise = $http({
              method: 'POST',
              url: '/efile/rest/raa/complete',
              data: {
                serialNums : $scope.serialNumList,
                ackEmail:$scope.attorneyInfoMultipleCasesForm.ackEmail,
                formType:"RAA"
              }
            }).success(function(result) {
              //console.log('ackEmail saved.');
          });
      
          $location.path('/main');
          AppointedATListForMultiCases.clearAttorneySearchResultList();
        };

    }
]);

/* Multiple Attorney Controllers */
angular.module('efileControllers').controller('AttorneysAddCtrl', ['$scope','$rootScope', '$http', '$route', '$location','attorneySearchResultList', 'AppointedATListForMultiCases',
  function($scope, $rootScope, $http, $route, $location,attorneySearchResultList, AppointedATListForMultiCases) {
    
    $scope.ctrlName ='AttorneysAddCtrl';
    $scope.resourceBundle = $rootScope.rootResourceBundleResource;
    $scope.btnClearForm = "Clear Form";

    $scope.tradeMarkIdList = [];
    $scope.serialNumList = [];
    $scope.markIdSerialNumMap = {};
    $scope.interestedPartyIds = [];
    $scope.attorneyInfoForm = {};
    $scope.secondaryAttorneys = AppointedATListForMultiCases.getAttorneyList();
    $scope.sameWithPrimary = false;
    $scope.addCourtesyEmail = false;

    $scope.isEdit = false;
    $scope.editVar = true;
    $scope.myVar = true;

    $scope.cmsMarkUrl = "";
    $http.get("/efile/rest/cms/mark/url")
      .success(function (url) {     
           //console.log('url: '+url);                             
           $scope.cmsMarkUrl = url;  
      }) 
      .error(function (error) { 
          //console.log('Error: ' + error);
      });

    // UI switch
    $scope.attorneyResultSwitch = false;
    $scope.attorneyFormSwitch = true;
    $scope.addMoreButtonSwitch = false;
    $scope.disableContinue = true;

    // init view switch
    if ($scope.secondaryAttorneys.length === 0) {
      $scope.attorneyResultSwitch = false;
      $scope.attorneyFormSwitch = true;
      $scope.addMoreButtonSwitch = false;
      $scope.disableContinue = true;
    } else {
      $scope.attorneyResultSwitch = true;
      $scope.attorneyFormSwitch = false;
      $scope.addMoreButtonSwitch = true;
      $scope.disableContinue = false;
    };

    // pattern
    $scope.emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    //init trake mark id list
    angular.forEach(attorneySearchResultList.getAttorneySearchResultList(), function(tmCase){
      $scope.tradeMarkIdList.push(tmCase.id);
      $scope.serialNumList.push(tmCase.serialNumTx);
    });

    //no case situation
    if ($scope.tradeMarkIdList.length === 0) {
      $location.path('/attorney/no_case');
    }

    //Add Attorney clicked.
    $scope.save = function() {
      var $promise = $http({
        method: 'POST',
        url: '/efile/rest/raa/attorneys',
        data: {
          caseIds : $scope.tradeMarkIdList,
          attorneyInfoForm : $scope.attorneyInfoForm,
          serialNums : $scope.serialNumList
        }
      }).success(function(interestedParty) {
        //console.log('save success!!!');

        // courtesy email
        if ($scope.addCourtesyEmail == true) {
          var isNew = true;
          var interestedPartyId = interestedParty.id;
          var updatedEmail;
          
          angular.forEach($scope.courtesyEmailList, function(email){
            if (email.interestedParyId === interestedPartyId) {
              isNew = false;
              updatedEmail = email;
            };
          });

          if (isNew === true) {
            $scope.saveCourtesyEmail(interestedPartyId);
          };

          if (isNew === false && updatedEmail !== undefined) {
            $scope.changeCourtesyEmail(updatedEmail);
          };
        } else {
          var toDelete = false;
          var interestedPartyId = interestedParty.id;
          var deleteEmail;

          angular.forEach($scope.courtesyEmailList, function(email){
            if (email.interestedParyId === interestedPartyId) {
              toDelete = true;
              deleteEmail = email;
            };
          });

          if (toDelete == true && deleteEmail !== undefined) {
            $scope.deleteCourtesyEmail(deleteEmail);
          };
        };
        
        // push added attorney into
        var secondaryAttorney = {};
        secondaryAttorney.interestedParty = interestedParty;
        if ($scope.isEdit) {
          var interestedPartyId = interestedParty.id;
          angular.forEach($scope.secondaryAttorneys, function(attorney, i){
            if (attorney.interestedParty.id === interestedParty.id) {
              $scope.secondaryAttorneys.splice(i, 1, secondaryAttorney);
            };
          });
        } else {
          $scope.secondaryAttorneys.push(secondaryAttorney);
        }
        $scope.isEdit = false;

        // reset form
        $scope.attorneyInfoForm = {};
        $scope.addCourtesyEmail = false;

        // set UI
        $scope.attorneyResultSwitch = true;
        $scope.attorneyFormSwitch = false;
        $scope.addMoreButtonSwitch = true;

        // TODO replace when we found table column for bar information
        $('form[name="attorneyForm"]').find("#nameLine1Tx").val("");
      });

      $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
      $scope.btnClearForm = "Clear Form";
    }; //end of save


       // Lechen
    { 
      $scope.caseList = attorneySearchResultList.getAttorneySearchResultList();
      $scope.pageSize = 10;
      $scope.itemPerPages = [1, 2, 3, 10, 25, 50, 100];
      $scope.dict = {
      'currentPage': 1
      };

      $scope.$watch('dict.currentPage + pageSize', function() {
        var begin = ($scope.dict.currentPage - 1) * $scope.pageSize;
        var end = begin + $scope.pageSize;
        $scope.pagedItems = $scope.caseList.slice(begin, end);
      });

      $scope.changePageSize = function(itemPerPage) {
        $scope.pageSize = itemPerPage;
      }

      $scope.goToPage = function() {
        var pageToDisplay = Math.ceil(this.itemToDisplay / $scope.pageSize);
        $scope.dict.currentPage = pageToDisplay;
      }


      $scope.toggleClass = function($index) {
        $scope.activePosition = $scope.activePosition == $index ? -1 : $index;
      };
    }

    // James
    {

      $scope.clearForm = function() {

        if ($scope.secondaryAttorneys.length !== 0) {
            $scope.attorneyResultSwitch = true;
            $scope.attorneyFormSwitch = false;
            $scope.addMoreButtonSwitch = true;
          };

        $scope.isEdit = false;
        $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
        $scope.btnClearForm = "Clear Form";

        //set ui
        $scope.attorneyFormSwitch = true;
        $scope.addMoreButtonSwitch = false;

        $scope.attorneyInfoForm.id = ""; // hidden
        $scope.attorneyInfoForm.firstName = "";
        $scope.attorneyInfoForm.middleName = "";
        $scope.attorneyInfoForm.lastName = "";
        $scope.attorneyInfoForm.suffix = "";

        $scope.attorneyInfoForm.nameLine2Tx = "";
        $scope.attorneyInfoForm.address1 = "";
        $scope.attorneyInfoForm.address2 = "";
        $scope.attorneyInfoForm.address3 = "";
        $scope.attorneyInfoForm.city = "";
        $scope.attorneyInfoForm.state = "";
        $scope.attorneyInfoForm.zip = "";
        $scope.attorneyInfoForm.country = "";

        $scope.attorneyInfoForm.email = "";
        $scope.attorneyInfoForm.website = "";
        $scope.attorneyInfoForm.phone = "";
        $scope.attorneyInfoForm.fax = "";
        $scope.attorneyInfoForm.docketNumber = "";
        $scope.addCourtesyEmail = false;

        // TODO replace when we found table column for bar information
        $('form[name="attorneyForm"]').find("#nameLine1Tx").val("");
      }

      $scope.addMore = function() {
        $scope.attorneyFormSwitch = true;
        $scope.addMoreButtonSwitch = false;
      }

      $scope.toggleCopyEmail = function() {
        if ($scope.addCourtesyEmail === true) { 
          $scope.addCourtesyEmail = false;
        } else{
          $scope.addCourtesyEmail = true;
        };
      }

      $scope.delete = function(secondaryAttorney) {
        //console.log("1");
        var content = $("<p>You are about to delete appointed attorney. Continue?</p>");
        content.popup({title: 'Delete Attorney', onsubmit: function(event, data){
          if (data.ok === "OK") {
            var $promise = $http({
              method: 'DELETE',
              url: '/efile/rest/raa/attorneys',
              data: {
                caseIds : $scope.tradeMarkIdList,
                attorneyInfoForm : {
                  id: secondaryAttorney.interestedParty.id
                }
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }).success(function(result) {
              var idx = $scope.secondaryAttorneys.indexOf(secondaryAttorney);
              $scope.secondaryAttorneys.splice(idx, 1);
              //console.log("delete success!!!");

              // clear form
              if (secondaryAttorney.interestedParty.id === $scope.attorneyInfoForm.id) {
                $scope.clearForm();
              };

              // clean Courtesy
              var toDelete = false;
              var interestedPartyId = secondaryAttorney.interestedParty.id;
              var deleteEmail;

              angular.forEach($scope.courtesyEmailList, function(email){
                if (email.interestedParyId === interestedPartyId) {
                  toDelete = true;
                  deleteEmail = email;
                };
              });

              if (toDelete == true && deleteEmail !== undefined) {
                $scope.deleteCourtesyEmail(deleteEmail);
              };

              //set UI
              if ($scope.secondaryAttorneys.length === 0) {
                $scope.attorneyResultSwitch = false;
                $scope.attorneyFormSwitch = true;
                $scope.addMoreButtonSwitch = false;
              };
            });
          };
        }});
      }; //end of delete

      $scope.edit = function(secondaryAttorney) {
        $scope.isEdit = true;
        $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Edit";
        $scope.btnClearForm = "Cancel Edit";

        //set ui
        $scope.attorneyFormSwitch = true;
        $scope.addMoreButtonSwitch = false;

        $scope.attorneyInfoForm.id = secondaryAttorney.interestedParty.id; // hidden
        $scope.attorneyInfoForm.firstName = secondaryAttorney.interestedParty.individualGivenNm;
        $scope.attorneyInfoForm.middleName = secondaryAttorney.interestedParty.individualMiddleNm;
        $scope.attorneyInfoForm.lastName = secondaryAttorney.interestedParty.individualFamilyNm;
        $scope.attorneyInfoForm.suffix = secondaryAttorney.interestedParty.individualSuffixNm;

        $scope.attorneyInfoForm.nameLine2Tx = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.nameLine2Tx;
        $scope.attorneyInfoForm.address1 = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.streetLine1Tx;
        $scope.attorneyInfoForm.address2 = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.streetLine2Tx;
        $scope.attorneyInfoForm.address3 = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.streetLine3Tx;
        $scope.attorneyInfoForm.city = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.cityNm;
        $scope.attorneyInfoForm.state = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.geographicRegionCd;
        $scope.attorneyInfoForm.zip = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.postalCd;
        $scope.attorneyInfoForm.country = secondaryAttorney.interestedParty.ipMailingAddrs[0].mailingAddress.cfkCountryCd;

        angular.forEach(secondaryAttorney.interestedParty.ipElectronicAddrs, function(ipElectronicAddr, index) {
            //email
            if (ipElectronicAddr.electronicAddress.electronicType === 'EMAIL') {
                $scope.attorneyInfoForm.email = ipElectronicAddr.electronicAddress.text;
            }
            //url
            if (ipElectronicAddr.electronicAddress.electronicType === 'URL') {
                $scope.attorneyInfoForm.website = ipElectronicAddr.electronicAddress.text;
            }
        }); // end of forEach.

        angular.forEach(secondaryAttorney.interestedParty.ipTelecomAddrs, function(ipTelecomAddr, index) {
            //phone
            if (ipTelecomAddr.telecomAddress.fkTelecomTypeCd === 'OFC') {
                $scope.attorneyInfoForm.phone = ipTelecomAddr.telecomAddress.telecomNo;
            }
            //fax
            if (ipTelecomAddr.telecomAddress.fkTelecomTypeCd === 'FAX') {
                $scope.attorneyInfoForm.fax = ipTelecomAddr.telecomAddress.telecomNo;
            }
        }); // end of forEach.

        $scope.attorneyInfoForm.docketNumber = secondaryAttorney.referenceNo;

        // Courtesy Email
        angular.forEach($scope.courtesyEmailList, function(email){
          if (email.interestedParyId === secondaryAttorney.interestedParty.id) {
            $scope.addCourtesyEmail = true;
          };
        });
      }; //end of edit

      $scope.continue = function() {
        if ($scope.secondaryAttorneys.length === 0) {
          $scope.disableContinue = true;
        } else {
          $scope.disableContinue = false;
          $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
          $scope.btnClearForm = "Clear Form";
          AppointedATListForMultiCases.setAppointedATListForMultiCases($scope.secondaryAttorneys, $scope.tradeMarkIdList);
          //pass case list to review page.
          attorneySearchResultList.setAttorneySearchResultList($scope.caseList);
          $location.path('/attorneys/review');
        };
      };

      // click go back
      $scope.goBack = function() {
        window.history.back();
      };

      $scope.cancel = function() {
        $scope.isEdit = false;
        $rootScope.rootResourceBundleResource['ui.appointAttorney.btnAddAttorney'] = "Add Attorney";
        $scope.btnClearForm = "Clear Form";
        $scope.attorneyInfoForm = {};
      }
    }

    // temp solution for courtesy email
    {
      $scope.courtesyEmailList = [];

      $scope.saveCourtesyEmail = function(interestedParyId) {
        if ($scope.attorneyInfoForm.email !== undefined && $scope.tradeMarkIdList.length !== 0) {
          var $promise = $http({
              method: 'POST',
              url: '/efile/rest/correspondence/multiCase/secondaryEmails?email=' + $scope.attorneyInfoForm.email,
              data: $scope.tradeMarkIdList
          }).success(function(result) {
            //console.log("Save Courtesy Email");
            result.interestedParyId = interestedParyId;
            $scope.courtesyEmailList.push(result);
            //console.log($scope.courtesyEmailList);
          });
        };
      }

      $scope.deleteCourtesyEmail = function(courtesyEmail) {
        if (courtesyEmail !== undefined && $scope.tradeMarkIdList.length !== 0) {
          var $promise = $http({
              method: 'DELETE',
              url: '/efile/rest/correspondence/multiCase/secondaryEmails',
              data: courtesyEmail,
              headers: {
                'Content-Type': 'application/json'
              }
          }).success(function(result) {
            //console.log("Delete Courtesy Email");
            var idx = $scope.courtesyEmailList.indexOf(courtesyEmail);
            $scope.courtesyEmailList.splice(idx, 1);
          });
        };
      }

      $scope.changeCourtesyEmail = function(courtesyEmail) {
        if (courtesyEmail !== undefined && $scope.tradeMarkIdList.length !== 0) {
          var $promise = $http({
              method: 'PUT',
              url: '/efile/rest/correspondence/multiCase/secondaryEmails',
              data: courtesyEmail,
              headers: {
                'Content-Type': 'application/json'
              }
          }).success(function(result) {
            //console.log("Change Courtesy Email");
            var idx = -1;
            angular.forEach($scope.courtesyEmailList, function(email, i){
              if (email.interestedParyId === courtesyEmail.interestedParyId) {
                idx = i;
              };
            });
            if (idx !== -1) {
              $scope.courtesyEmailList.splice(idx, 1, courtesyEmail);
            };
            
          });
        };
      }
    }

    $scope.$watch(function(){
      return $scope.secondaryAttorneys.length;
    }, function(){
      if ($scope.secondaryAttorneys.length === 0) {
        $scope.disableContinue = true;
      } else {
        $scope.disableContinue = false;
      };
    });
  }
]);

angular.module('efileControllers').controller('AttorneysReviewCtrl', ['$scope','$rootScope','$http','$route','$location','SearchResource','attorneySearchResultList','AppointedATListForMultiCases','SignatureResource','MiscellaneousDocResource','RaaMiscellaneousDocResource','RaaMiscellaneousResource','SignatureMultipleResource','MiscellaneousMultipleResource','AttorneysReviewResource', 'SignatureValidationgSevice',
  function($scope, $rootScope,$http, $route, $location,SearchResource,attorneySearchResultList,AppointedATListForMultiCases,SignatureResource,MiscellaneousDocResource,RaaMiscellaneousDocResource,RaaMiscellaneousResource,SignatureMultipleResource,MiscellaneousMultipleResource,AttorneysReviewResource, SignatureValidationgSevice) {
    $scope.ctrlName ='AttorneysReviewCtrl';
    $scope.resourceBundle = $rootScope.rootResourceBundleResource;

    $scope.signatureNameRequiredError = false;
    $scope.signatureRequiredError = false;
    $scope.electtonicSignWrongFormate = false;
    $scope.signatures = [];

    $scope.signatureNameRequiredError = false;
    $scope.signatureRequiredError = false;
    $scope.electtonicSignWrongFormate = false;

    //additional statement and signature form
    $scope.files = [];
    $scope.miscellaneousInfoForm = {};
    $scope.miscellaneousInfoForm.text = '';
    $scope.miscellaneousInfoForm.id = -1;
    $scope.signatureInfoForm = {};
    $scope.signatureInfoForm.signingDt = new Date();
    $scope.noSignatures = false;
    $scope.signatures = [];
    
    //pagination
    { 
      $scope.caseList = attorneySearchResultList.getAttorneySearchResultList();
      $scope.pageSize = 10;
      $scope.itemPerPages = [1, 2, 3, 10, 25, 50, 100];
      $scope.dict = {
        'currentPage': 1
      };

      $scope.$watch('dict.currentPage + pageSize', function() {
        var begin = ($scope.dict.currentPage - 1) * $scope.pageSize;
        var end = begin + $scope.pageSize;
        $scope.pagedItems = $scope.caseList.slice(begin, end);
      });

      $scope.changePageSize = function(itemPerPage) {
        $scope.pageSize = itemPerPage;
      }

      $scope.goToPage = function() {
        var pageToDisplay = Math.ceil(this.itemToDisplay / $scope.pageSize);
        $scope.dict.currentPage = pageToDisplay;
      }

      $scope.toggleClass = function($index) {
          $scope.activePosition = $scope.activePosition == $index ? -1 : $index;
      };
    }//pagination ends.
    
    $scope.secondaryAttorneys =  AppointedATListForMultiCases.getAttorneyList();
    
    $scope.createSignature = function() {
        // Push it to signatures.
        $scope.signatures.push($scope.signatureInfoForm);
        $scope.signatureInfoForm = {};
        $scope.signatureInfoForm.signingDt = new Date();
        $scope.noSignatures = false;
    };

    $scope.deleteSignature = function(signature) { // Delete a signature
        $scope.signatures.splice(signature,1);
    };
    
    // go back
    $scope.goBack = function() {
        window.history.back();
    };
    
    $scope.uploadFile = function() {
        if (!$scope.files) {
            $scope.files = [];
        }
        var allowedTypeIn = false;
        var allowedSizeIn = false;
        $scope.fileTypeError = false;
        $scope.fileSizeError = false;
        $scope.fileNameTooLongError = false;

        var file = $scope.fileModel[0];

        // name cannot exceed 50 characters. db limit.
        if (file.name.length > 50) {
            $scope.fileNameTooLongError = true;
        }

        if (file.type.indexOf('JPG') > -1 || file.type.indexOf('PDF') > -1 || file.type.indexOf('JPEG') > -1 || file.type.indexOf('pdf') > -1 || file.type.indexOf('jpg') > -1 || file.type.indexOf('jpeg') > -1) {
            allowedTypeIn = true;
        } else {
            $scope.fileTypeError = true;
        }
        if (file.size < 5242880) {
            allowedSizeIn = true;
        } else {
            $scope.fileSizeError = true;
        }
        if (allowedTypeIn && allowedSizeIn && !($scope.fileNameTooLongError)) {
            $scope.fileTypeError = false;
            $scope.fileSizeError = false;
            $scope.files.push(file);
            $scope.fileModel = null;
        }
    };

    $scope.deleteFile = function(file) {
        $scope.files.splice($scope.files.indexOf(file), 1);
    };

    $scope.checkFile = function() {
        if (!$scope.fileModel) {
            return true;
        } else {
            return false;
        }
    };

    //click submit.
    $scope.submit = function() {
        if(!SignatureValidationgSevice.valdiateSignature($scope)) {
            console.log("signature fail!");
            return;
        }        
        if(!SignatureValidationgSevice.valdiateSignature($scope)) {
            console.log("signature fail!");
            return;
        }
        var errorsFound = [];
        // handle additional statements.
        if ($scope.checked) {
          if (!$scope.miscellaneousInfoForm.text) {
              $scope.miscellaneousStmtError = true;
              errorsFound.push("miscellaneousStmtError");
          }else{
            $scope.miscellaneousStmtError = false;
          } 
        }  
        
          $scope.saveAttorneysReview();
          $location.path('/attorneys/complete');
       
    }// end submit.
    

    $scope.saveMiscellaneousStmt = function() {   
        

        var errorsFound = [];
        // handle additional statements.
        if ($scope.checked) {
          if (!$scope.miscellaneousInfoForm.text) {
              $scope.miscellaneousStmtError = true;
              errorsFound.push("miscellaneousStmtError");
          }else{
            $scope.miscellaneousStmtError = false;
          } 
        }        
        $scope.saveAttorneysReview();        
        
    }// end submit.


    //save both additional statements and signatures.
    $scope.saveAttorneysReview = function() {
        if(!SignatureValidationgSevice.valdiateSignature($scope)) {
            console.log("signature fail!");
            return;
        }
        // save esign info
        $scope.createSignature();

        //validate signature.
            if (!$scope.signatures[0]) {
                $scope.signatureNameRequiredError = true;
                $scope.signatureRequiredError = true;
                return;
            }
                
            var signature = $scope.signatures[0].signature;
            var signatureName = $scope.signatures[0].signatoryName;
            
            if(!signature){
                $scope.signatureRequiredError = true;
            }else{
                $scope.signatureRequiredError = false;
                if (/^\/.+\/$/.test(signature)) {
                    $scope.electtonicSignWrongFormate = false;
                } else {
                    $scope.electtonicSignWrongFormate = true;
                };
            }
            
            if(!signatureName){
                $scope.signatureNameRequiredError = true;
            }else{
                $scope.signatureNameRequiredError = false;
            }
            
            if($scope.signatureNameRequiredError || $scope.signatureRequiredError){
                //console.log('found error');
                return;
            }

        var markIds = AppointedATListForMultiCases.getTmCasesIdList();
        $scope.miscellaneousStmtError = false;
        
        //prepare markIdSerialNumMap
        $scope.markIdSerialNumMap = {};
        angular.forEach(attorneySearchResultList.getAttorneySearchResultList(), function(tmCase){
          $scope.markIdSerialNumMap[tmCase.id]=tmCase.serialNumTx;
        });
        
        //prepare interestedPartyIds
        $scope.interestedPartyIds = [];
        angular.forEach(AppointedATListForMultiCases.getAttorneyList(), function(tmInterestedParty){
          $scope.interestedPartyIds.push(tmInterestedParty.interestedParty.id);
        });
        
        var attorneysReviewForm = {};
        attorneysReviewForm.markIds = AppointedATListForMultiCases.getTmCasesIdList();
        attorneysReviewForm.addStmtMiscellaneous = $scope.miscellaneousInfoForm;
        attorneysReviewForm.signatures = $scope.signatures;
        attorneysReviewForm.markIdSerialNumMapJson = JSON.stringify($scope.markIdSerialNumMap);
        attorneysReviewForm.interestedPartyIds = $scope.interestedPartyIds;
        
        var uploadUrl = "/efile/rest/raa/upload/multiple";
        if ($scope.files) {
          AttorneysReviewResource.saveAttorneysReview($scope.files, attorneysReviewForm, uploadUrl).then(
            function(value) {
                //console.log('success');
            },
            function(error) {
                //console.log("error");
                //console.log(error);
            });
        }
    };//end saveAttorneysReview
    
    // finger Sign
        $scope.fingerSignatureForm = {
            jsonData : null,
            imageData : null
        };
        var fingerSignCanvas = null;

        var options = {
            defaultAction : 'drawIt',
            penColour : '#000000',
            lineWidth : 0,
            onDrawEnd : function() {
                $scope.fingerSignatureForm.jsonData = fingerSignCanvas.getSignatureString();
                $scope.fingerSignatureForm.imageData = fingerSignCanvas.getSignatureImage();
            }
        }

        $scope.beginFingerSign = function () {
            fingerSignCanvas = $('.sigPad').signaturePad(options);
        }

        $scope.saveFingerSign = function () {
            // wait for submition model
            //console.log($scope.fingerSignatureForm);
        }

        $scope.clearFingerSign = function () {
            if (fingerSignCanvas != null) {
                fingerSignCanvas.clearCanvas();
                $scope.fingerSignatureForm = {
                    jsonData : null,
                    imageData : null
                };
            };
        }
    
  }
]);

angular.module('efileControllers').controller('AttorneysCompleteCtrl', ['$scope', '$rootScope', '$location', 'AppointedATListForMultiCases', 'attorneySearchResultList','$http',
    function($scope, $rootScope, $location, AppointedATListForMultiCases, AttorneySearchResultList,$http) {
        
        $scope.attorneyInfoMultipleCasesForm = {};
        $scope.attorneyInfoMultipleCasesForm.ackEmail = '';
        
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.ctrlName = 'attorneysCompleteCtrl';
        $scope.secondaryAttorneys = AppointedATListForMultiCases.getAttorneyList();
        $scope.serialNumber = "";
        $scope.attorneys = "";
        $scope.caseList = AttorneySearchResultList.getAttorneySearchResultList();
        $scope.attorneysIn=false;
        var serialNumberArray = [];
        var secondaryAttorneyArray = [];
        $scope.serialNumList = [];
        
        angular.forEach($scope.caseList, function(aCase, index) {
            serialNumberArray.push(aCase.serialNumTx);
        });
        if (serialNumberArray.length > 0) {
            $scope.serialNumbers = serialNumberArray.join(', ');
        }

        angular.forEach($scope.secondaryAttorneys, function(attorney, index) {
            secondaryAttorneyArray.push(attorney.interestedParty.interestedPartyNm);
        });

        if (secondaryAttorneyArray.length > 0) {
            $scope.attorneysIn=true;
            $scope.attorneys = secondaryAttorneyArray.join(', ');
        }

        //$scope.caseList
        angular.forEach(AttorneySearchResultList.getAttorneySearchResultList(), function(tmCase){
          $scope.serialNumList.push(tmCase.serialNumTx);
        });
        
        // click done.
        $scope.done = function() {
            
            //send ackemail
          var $promise = $http({
              method: 'POST',
              url: '/efile/rest/raa/complete',
              data: {
                serialNums : $scope.serialNumList,
                ackEmail:$scope.attorneyInfoMultipleCasesForm.ackEmail,
                formType:"RAA"
              }
            }).success(function(result) {
              //console.log('ackEmail saved.');
          });
            
            $location.path('/main');
            AppointedATListForMultiCases.clearAttorneySearchResultList();
        };
    }
]);

