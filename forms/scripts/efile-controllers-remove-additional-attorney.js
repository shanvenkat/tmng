'use strict';

/* Controllers */
/* Controllers for Appoint Attorney Single case */

efileControllers.controller('RemoveAttorneyCtrl', ['$scope', '$rootScope', '$route', '$http', '$routeParams', '$location', '$q', 'ResourceBundleResource', 'GlobalResource',
    'RaaResource', 'removedAttorneyList', 'MarkInfo', 'GetSATInStagingResource', 'CMSMarkURLResource', 'CheckCasesAndGetIDsResource',
    function($scope, $rootScope, $route, $http, $routeParams, $location, $q, ResourceBundleResource, GlobalResource, RaaResource, removedAttorneyList, MarkInfo, GetSATInStagingResource, CMSMarkURLResource, CheckCasesAndGetIDsResource) {

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;

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
        });


        // $scope.trademark = RaaResource.get({
        //     serialNo: $routeParams.serialNumber
        // });

        $scope.emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;


        $scope.removedAttorneys = removedAttorneyList.getAttorneyList();

        //courtesy copy emails
        $scope.editable = false;
        $scope.courtesyCopyEmails = [];
        $scope.newCopyEmails = [];
        $scope.deletedEmails = [];
        $scope.changedEmailIDs = [];
        $scope.showErrTooMuchEmail = false;

        //UI Switch
        $scope.disableContinue = true;



        //add/remove attorney that will be deleted
        $scope.toggleSelection = function (attorney) {
            var idx = -1;

            angular.forEach($scope.removedAttorneys, function(removedAttorney, index){
                if (attorney.id === removedAttorney.id) {
                    idx = index;
                };
            });

            if (idx > -1) {
                //delete already existing attorney
                $scope.removedAttorneys.splice(idx, 1);
            } else {
                //add attorney to be deleted
                $scope.removedAttorneys.push(attorney);
            };
        }


        $scope.editableActive = function() {
            $scope.editable = true;
        }

        $scope.editableCancel = function() {
            $scope.showErrTooMuchEmail = false;

            if ($scope.changedEmailIDs.length !== 0 ||
                $scope.deletedEmails.length !== 0 ||
                $scope.newCopyEmails.length !== 0) {

                var $promise = $http({
                    method: 'GET',
                    url: '/efile/rest/correspondence/secondaryEmails/?markId=' + $scope.trademarkID,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).success(function(result) {
                    $scope.changedEmailIDs = [];
                    $scope.deletedEmails = [];
                    $scope.newCopyEmails = [];
                    $scope.courtesyCopyEmails = result;
                });

            };

            $scope.editable = false;
        }

        $scope.editableDone = function() {
            $scope.showErrTooMuchEmail = false;
            var saveEmailRequest;
            var deleteEmailRequest;
            var changeEmailRequest;

            //remove empty emails
            angular.forEach($scope.newCopyEmails, function(newEmail) {
                if (newEmail == "" || newEmail === undefined) {
                    var idx = $scope.newCopyEmails.indexOf(newEmail);
                    $scope.newCopyEmails.splice(idx, 1);
                };
            });

            //save new secondary email
            if (!($scope.newCopyEmails.length == 0)) {
                var saveEmailRequest = $http({
                    method: 'POST',
                    url: '/efile/rest/correspondence/secondaryEmails/?markId=' + $scope.trademarkID,
                    data: $scope.newCopyEmails
                }).success(function(result) {
                    $scope.courtesyCopyEmails = [];
                    angular.forEach(result, function(result) {
                        if (result.electronicAddress.electronicType == "EMAIL" &&
                            result.primaryIn != true) {
                            $scope.courtesyCopyEmails.push(result);
                        };
                    });
                    $scope.newCopyEmails = [];
                });
            }

            //delete secondary email
            if (!($scope.deletedEmails.length == 0)) {
                var deleteEmailRequest = $http({
                    method: 'DELETE',
                    url: '/efile/rest/correspondence/secondaryEmails/?markId=' + $scope.trademarkID,
                    data: $scope.deletedEmails,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).success(function(result) {
                });
            }

            //change secondary email
            if (!($scope.changedEmailIDs.length == 0)) {
                var changedEmails = [];

                angular.forEach($scope.courtesyCopyEmails, function(email) {
                    if ($scope.changedEmailIDs.indexOf($scope.changedEmailIDs.indexOf(email.fkElectronicAddrId) !== -1)) {
                        changedEmails.push(email);
                    };
                });

                var changeEmailRequest = $http({
                    method: 'PUT',
                    url: '/efile/rest/correspondence/secondaryEmails/?markId=' + $scope.trademarkID,
                    data: changedEmails,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).success(function(result) {
                });
            }

            $q.all([saveEmailRequest, deleteEmailRequest, changeEmailRequest]).then(function(){
                //retrieve secondary email
                var $promise = $http({
                    method: 'GET',
                    url: '/efile/rest/correspondence/secondaryEmails/?markId=' + $scope.trademarkID,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).success(function(result) {
                    $scope.changedEmailIDs = [];
                    $scope.deletedEmails = [];
                    $scope.newCopyEmails = [];
                    $scope.courtesyCopyEmails = result;
                });
            });
                
            $scope.editable = false;
        }

        $scope.addNewEmail = function() {
            $scope.showErrTooMuchEmail = false;
            var totalEmails = $scope.newCopyEmails.length + $scope.courtesyCopyEmails.length;
            if (totalEmails < 10) {
                angular.forEach($scope.newCopyEmails, function(newEmail) {
                    if (newEmail == "" || newEmail === undefined) {
                        var idx = $scope.newCopyEmails.indexOf(newEmail);
                        $scope.newCopyEmails.splice(idx, 1);
                    };
                });

                $scope.newCopyEmails.push("");
            } else {
                $scope.showErrTooMuchEmail = true;
            };
        }

        $scope.deleteCourtesyCopyEmail = function(email) {
            $scope.showErrTooMuchEmail = false;

            var content = $("<p>You are about to delete courtesy copy email address. Continue?</p>");
            content.popup({title: 'Delete Attorney', onsubmit: function(event, data){
                if (data.ok === "OK") {
                    //console.log("OK");
                    var idx = $scope.courtesyCopyEmails.indexOf(email);
                    $scope.deletedEmails.push(email.electronicAddress.id);
                    $scope.courtesyCopyEmails.splice(idx, 1);
                    $scope.$apply();
                };
            }});
        }

        $scope.changeCourtesyCopyEmail = function(email) {
            $scope.showErrTooMuchEmail = false;

            if ($scope.changedEmailIDs.indexOf(email.fkElectronicAddrId) === -1) {
                $scope.changedEmailIDs.push(email.fkElectronicAddrId);
            };
        }

        $scope.deleteNewCopyEmail = function(i) {
            if ($scope.newCopyEmails.length > i) {
                $scope.newCopyEmails.splice(i, 1);
            };
        }

        $scope.continue = function() {
            if ($scope.removedAttorneys.length == 0) {
                $scope.disableContinue = true;
            } else {
                $scope.disableContinue = false;
                removedAttorneyList.setAttorneyList($scope.removedAttorneys);
                $location.path('/reviewRemovedAttorney/' + $routeParams.serialNumber);
            };
        };

        $scope.cancelRemove = function() {
            $location.path('/attorney');
        }

        $scope.findObjectInArray = function(attorney) {
            var idx = -1;
            for (var i = 0; i < $scope.removedAttorneys.length; i++) {
                if ($scope.removedAttorneys[i].id == attorney.id) {
                    idx = i;
                };
            };
            return idx;
        }

        $scope.$watch(function(){
            return $scope.removedAttorneys.length;
        }, function(){
            if ($scope.removedAttorneys.length == 0) {
                $scope.disableContinue = true;
            } else {
                $scope.disableContinue = false;
            };
        });        

    }
]);

efileControllers.controller('ReviewRemovedAttorneyCtrl', ['$scope', '$rootScope', '$route', '$http', '$routeParams', '$location', 'ResourceBundleResource', 'GlobalResource',
    'RaaResource', 'SignatureResource', 'MiscellaneousResource', 'FileUpload', 'MiscellaneousDocResource', 'RaaMiscellaneousDocResource', 'RaaMiscellaneousResource', 'removedAttorneyList', 'MarkInfo', 'GetSATInStagingResource', 'CMSMarkURLResource', 'CheckCasesAndGetIDsResource', 'SignatureValidationgSevice',
    function($scope, $rootScope, $route, $http, $routeParams, $location, ResourceBundleResource, GlobalResource, RaaResource, SignatureResource, MiscellaneousResource, FileUpload,
        MiscellaneousDocResource, RaaMiscellaneousDocResource, RaaMiscellaneousResource, removedAttorneyList, MarkInfo, GetSATInStagingResource, CMSMarkURLResource, CheckCasesAndGetIDsResource, SignatureValidationgSevice) {

        $scope.ctrlName = 'ReviewRemovedAttorneyCtrl';

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;


        // page parameter
        $scope.trademark = {};
        $scope.attorneys = [];
        $scope.attorneyInfoForm = {};
        $scope.secondaryAttorneys = removedAttorneyList.getAttorneyList();
        $scope.trademarkID = '';

        // init page
        // get entire trademark info from TRM
        MarkInfo.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value){
            $scope.trademark = value;
            $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);
        });
        // get url for mark image
        $scope.cmsMarkUrl = CMSMarkURLResource.get();
        // check efile staging and TRM to retreive trademark ID
        CheckCasesAndGetIDsResource.save(
            [$routeParams.serialNumber]
        ).$promise.then(function(value){
            $scope.trademarkID = value[$routeParams.serialNumber];
            $scope.getSignatures();
            $scope.getMiscellaneousStmt();
        });






        $scope.signatureNameRequiredError = false;
        $scope.signatureRequiredError = false;
        $scope.electtonicSignWrongFormate = false;


        $scope.files = [];
        $scope.miscellaneousIn = false;

        $scope.miscellaneousInfoForm = {};
        $scope.miscellaneousInfoForm.text = '';
        $scope.miscellaneousInfoForm.id = -1;



        $scope.signatureInfoForm = {};
        $scope.signatureInfoForm.signingDt = new Date();
        $scope.noSignatures = false;

         


        

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
                $scope.noSignatures = false;
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

        function saveSignatureInfo() {
            $scope.signatureInfoForm.markId = $scope.trademarkID;
            var save = SignatureResource.save($scope.signatureInfoForm);
            save.$promise.then(function(value) {
                $scope.signatures.push(value);
                $scope.signatureInfoForm = {};
                $scope.signatureInfoForm.signingDt = new Date();

            });
        };

        // click submit
        $scope.submit = function() {
            if(!SignatureValidationgSevice.valdiateSignature($scope)) {
                console.log("signature fail!");
                return;
            }

            $scope.saveOrUpdateSignature();
            $scope.saveMiscellaneousStmt();
            $scope.delete();
            $location.path('/completeRemovedAttorney/' + $routeParams.serialNumber);
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

            // insert it to efile signature table
             //saveSignatureInfo();
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

        $scope.delete = function() {
            if (!($scope.secondaryAttorneys.length == 0)) {
                angular.forEach($scope.secondaryAttorneys, function(attorney) {
                    var $promise = $http({
                        method: 'DELETE',
                        url: '/efile/rest/raa',
                        data: {
                            markId: $scope.trademarkID,
                            id: attorney.id,
                            attorneyType: attorney.roleCd
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function(result) {
                        removedAttorneyList.clearAttorneyList();
                    });
                });
            }
        }; //end of delete

        $scope.saveMiscStmtToDB = function() {
            $scope.miscellaneousStmtError = false;
            $scope.miscellaneousInfoForm.trademarkId = $scope.trademarkID;
            var save = MiscellaneousResource.save($scope.miscellaneousInfoForm);

            //Misc is saved now. Upload the file.
            save.$promise.then(function(value) {
                $scope.stmtId = value.id;
                $scope.miscellaneousInfoForm.id = value.id;

                var uploadUrl = "/efile/rest/raa/upload/stmtId/" + value.id + "/trademarkId/" + $scope.markId + "/serialNum/" + $routeParams.serialNumber;
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
            });
        }

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

efileControllers.controller('CompleteRemovedAttorneyCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'RaaResource', '$http', 'removedAttorneyList',
    function($scope, $rootScope, $location, $routeParams, RaaResource, $http, removedAttorneyList) {

        $scope.ctrlName = 'removedAttorney';

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.serialNumber = $routeParams.serialNumber;

        $scope.removedAttorneys = removedAttorneyList.getAttorneyList();
        $scope.removedAttorneyMSG = '';
        var removedAttorneysNum = $scope.removedAttorneys.length;

        if (removedAttorneysNum === 0) {
            $scope.removedAttorneyMSG = "You have no request to remove additional authorized attorney";
        } else if (removedAttorneysNum === 1) {
            var name = $scope.removedAttorneys[0].firstName + " " + $scope.removedAttorneys[0].lastName;
            $scope.removedAttorneyMSG = "You have requested to remove " + name + " as an additional authorized attorney";
        } else {
            var nameList = "";
            for (var i = 0; i < removedAttorneysNum; i++) {
                var attorneyName = $scope.removedAttorneys[i].firstName + " " + $scope.removedAttorneys[i].lastName;
                if (i == 0) {
                    nameList += " " + attorneyName;
                } else if (i == removedAttorneysNum - 1) {
                    nameList += " and " + attorneyName;
                } else {
                    nameList += ", " + attorneyName;
                };
            }

            $scope.removedAttorneyMSG = "You have requested to remove" + nameList + " as additional authorized attorneys";
        }
        
        /*
        $scope.attorneyInfoForm = {};
        $scope.attorneyInfoForm.ackEmail = '';
        */
        // click done.
        $scope.done = function() {
            $location.path('/main');
        };

    }
]);