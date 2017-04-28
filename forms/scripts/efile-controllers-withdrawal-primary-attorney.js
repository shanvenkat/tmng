'use strict';

/* Controllers */
/* Controllers for Withdrawal Primary Attorney Single case */

efileControllers.controller('WithdrawAttorneyCtrl', ['$scope', '$rootScope', '$location', '$http', '$routeParams', '$q', 'TrmTrademarkResource', 'CMSMarkURLResource',
    function($scope, $rootScope, $location, $http, $routeParams, $q, TrmTrademarkResource, CMSMarkURLResource) {

        //console.log("Withdraw Attorney");
        //console.log("Serial Number: " + $routeParams.serialNumber);

        //resource bundle
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.withdrawMode = $routeParams.withdrawMode;

        // page info
        $scope.trademark = {};
        $scope.primaryAttorney = {};
        $scope.withdrawReason = "";
        $scope.withdrawCheckList = [];

        $scope.wd = {};
        $scope.wd.radioPowerAttorneyEnded = '';
        $scope.wd.affirmStatementCheckbox = false;
        $scope.woaReasonStmt = {};

        // UI switch
        $scope.disableContinue = true;
        $scope.errMsgWOAStmt = false;
        $scope.errMsgCheckBox = false;


        // get url for mark image
        $scope.cmsMarkUrl = CMSMarkURLResource.get();


        // init page
        $scope.trademark = TrmTrademarkResource.get({
            serialNo: $routeParams.serialNumber
        });


        $scope.trademark.$promise.then(function(result) {
            if (angular.isUndefined($scope.trademark.id)) {
                $location.path('/attorney/error/No case was found');
            }

            $scope.primaryAttorney = $scope.trademark.primaryAttorney;


            if (!$scope.trademark.primaryAttorney || $scope.trademark.primaryAttorney.id === undefined || $scope.trademark.primaryAttorney.id === '') {
                $location.path('/attorney/error/No primary attorney was found');
            };


            $scope.attorneys = result.additionalAttorneys.concat(result.primaryAttorney);


            // init woa reason statment
            var woaResource = $http({
                method: 'GET',
                url: '/efile/rest/woa/woaStatement/' + $scope.trademark.id + '/WR',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function(result) {
                $scope.woaReasonStmt.id = '';
                $scope.woaReasonStmt.trademarkId = $scope.trademark.id;
                $scope.woaReasonStmt.text = '';
                $scope.woaReasonStmt.serialNumTx = $routeParams.serialNumber;

                if (result != null && result != '') {
                    $scope.woaReasonStmt.id = result.id;
                    $scope.woaReasonStmt.text = result.text;
                    $scope.woaReasonStmt.serialNumTx = $routeParams.serialNumber;
                };
            });

            // init radio button
            var readRadioButton = $http({
                method: 'GET',
                url: '/efile/rest/property/woaPropertyByType/' + $scope.withdrawMode + "/" + $scope.trademark.id,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function(result) {
                if ($scope.withdrawMode == 'raa4') {
                    $scope.wd.radioPowerAttorneyEnded = result.propertyValue;

                } else if ($scope.withdrawMode == 'raa3') {

                    $scope.withdrawCheckList[0] = false;
                    $scope.withdrawCheckList[1] = false;
                    $scope.withdrawCheckList[2] = false;
                    $scope.withdrawCheckList[3] = false;
                    $scope.withdrawCheckList[4] = false;
                    $scope.withdrawCheckList[5] = false;

                    if (result != '') {
                        var resultArray = result.propertyValue.split(" ");
                        for (var i = 0; i < resultArray.length; i++) {
                            if (resultArray[i] === 'true') {
                                $scope.withdrawCheckList[i] = true;
                            };
                        }
                    }

                }
            });
        }, function(error) {
            $location.path('/attorney/error/No case was found');
        });

        // page function
        // back to action
        $scope.goBack = function() {
            $location.path('/attorney/');
        }

        // save info
        $scope.save = function() {

            var saveWOAStmt = $http({
                method: 'POST',
                url: '/efile/rest/woa/woaStmt',
                data: $scope.woaReasonStmt
            }).success(function(result) {
                if (result != null && result != '') {
                    $scope.woaReasonStmt.id = result.id;
                    $scope.woaReasonStmt.trademarkId = result.trademarkId;
                    $scope.woaReasonStmt.text = result.text;

                    // for save radio button selection
                    if ($scope.withdrawMode == 'raa4') {
                        var saveRadioButton = $http({
                            method: 'POST',
                            url: '/efile/rest/property/woa',
                            data: {
                                markId: $scope.woaReasonStmt.trademarkId,
                                propertyValue: $scope.wd.radioPowerAttorneyEnded,
                                propertyCd: 'waend'
                            }
                        }).success(function() {
                            //console.log("Success!");
                        });

                    } else if ($scope.withdrawMode == 'raa3') {
                        var withdrawCheckListString = $scope.withdrawCheckList.join(' ');
                        var saveRadioButton = $http({
                            method: 'POST',
                            url: '/efile/rest/property/woa',
                            data: {
                                markId: $scope.woaReasonStmt.trademarkId,
                                propertyValue: withdrawCheckListString,
                                propertyCd: 'woa'
                            }
                        }).success(function() {
                            //console.log("Success!");
                        });
                    }

                };
            });

            $scope.checkBoxErrMsg();
            $scope.checkStmtErrMsg();
        }

        $scope.checkBoxErrMsg = function() {
            if ($scope.withdrawCheckList[0] == true && $scope.withdrawCheckList[1] == true && $scope.withdrawCheckList[2] == true && $scope.withdrawCheckList[3] == true && $scope.withdrawCheckList[4] == true) {
                $scope.errMsgCheckBox = false;
            } else if ($scope.withdrawCheckList[5] == true) {
                $scope.errMsgCheckBox = false;
            } else {
                $scope.errMsgCheckBox = true;
            };
        }

        $scope.checkStmtErrMsg = function() {
            if ($scope.woaReasonStmt.text != null && $scope.woaReasonStmt.text != '' && $scope.woaReasonStmt.text != ' ') {
                $scope.errMsgWOAStmt = false;
            } else {
                $scope.errMsgWOAStmt = true;
            };
        }

        // cancel withdraw action and go main page
        $scope.cancel = function() {
            $location.path('/main');
        }

        $scope.openTsdrWindow = function() {
            $scope.tsdrurl = "http://tsdr.uspto.gov/#caseNumber=" + $routeParams.serialNumber + "&caseType=SERIAL_NO&searchType=statusSearch";
            window.open($scope.tsdrurl, '_blank');
        }

        // continue button for going to second page
        $scope.goToCorrespondence = function() {
            $scope.save();
            $location.path('/attorney/withdraw/' + $scope.withdrawMode + '/correspondence/' + $routeParams.serialNumber);
        }

        // for checkbox business logic
        $scope.checkbox1To5OnClick = function() {
            if ($scope.withdrawCheckList[0] == true || $scope.withdrawCheckList[1] == true || $scope.withdrawCheckList[2] == true || $scope.withdrawCheckList[3] == true || $scope.withdrawCheckList[4] == true) {
                $scope.withdrawCheckList[5] = false;
            };
        }

        $scope.checkbox6OnClick = function() {
            if ($scope.withdrawCheckList[5] == true) {
                $scope.withdrawCheckList[0] = false;
                $scope.withdrawCheckList[1] = false;
                $scope.withdrawCheckList[2] = false;
                $scope.withdrawCheckList[3] = false;
                $scope.withdrawCheckList[4] = false;
            };
        }


        // parameter watchers
        // for continue button
        $scope.$watch('[withdrawCheckList[0], withdrawCheckList[1], withdrawCheckList[2], withdrawCheckList[3], withdrawCheckList[4], withdrawCheckList[5], woaReasonStmt.text]', function() {
            $scope.errMsgWOAStmt = false;
            $scope.errMsgCheckBox = false;
            // for UI continue button
            if ($scope.withdrawMode == 'raa3') {
                if ($scope.woaReasonStmt.text !== null && $scope.woaReasonStmt.text !== undefined && !/^\s*$/.test($scope.woaReasonStmt.text)) {
                    if ($scope.withdrawCheckList[0] === true && $scope.withdrawCheckList[1] === true && $scope.withdrawCheckList[2] === true && $scope.withdrawCheckList[3] === true && $scope.withdrawCheckList[4] === true) {
                        $scope.disableContinue = false;
                    } else if ($scope.withdrawCheckList[5] === true) {
                        $scope.disableContinue = false;
                    } else {
                        $scope.disableContinue = true;
                    };
                } else {
                    $scope.disableContinue = true;
                };
            }
        });

        $scope.$watch('[woaReasonStmt.text, wd.radioPowerAttorneyEnded, wd.affirmStatementCheckbox]', function() {
            if ($scope.withdrawMode == 'raa4') {
                console.log($scope.woaReasonStmt.text);
                console.log($scope.wd.radioPowerAttorneyEnded);
                console.log($scope.wd.affirmStatementCheckbox);
                $scope.errMsgWOAStmt = false;
                $scope.errMsgCheckBox = false;
                // for UI continue button
                if ($scope.wd.radioPowerAttorneyEnded === 'Agreee') {
                    if ($scope.woaReasonStmt.text !== null && $scope.woaReasonStmt.text !== undefined && !/^\s*$/.test($scope.woaReasonStmt.text)) {
                        if ($scope.wd.affirmStatementCheckbox === true) {
                            $scope.disableContinue = false;
                        } else {
                            $scope.disableContinue = true;
                        };
                    } else {
                        $scope.disableContinue = true;
                    };
                } else {
                    $scope.disableContinue = true;
                };
                    
            };
                
        });
    }
]);

efileControllers.controller('correspondenceWithdrawCtrl', ['$scope', '$rootScope', '$route', '$routeParams', '$filter', '$location', '$http', 'TrmTrademarkResource', 'CheckCasesAndGetIDsResource', 'CorrespondenceResource',
    function($scope, $rootScope, $route, $routeParams, $filter, $location, $http, TrmTrademarkResource, CheckCasesAndGetIDsResource, CorrespondenceResource) {
        $scope.ctrlName = 'correspondenceWithdrawCtrl';
        $scope.radio = {};
        $scope.radio.selected = 'current';
        $scope.withdrawMode = $routeParams.withdrawMode;
        $scope.partyForm = {};
        $scope.isAdditionalAttorneysDropped = false;

        TrmTrademarkResource.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value) {
                $scope.trademark = value;
                $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);

                $scope.partyForm.country = $rootScope.rootCountryInfo.filter(function(c) {
                    return c.code == 'US'
                })[0].code;

                CheckCasesAndGetIDsResource.save(
                    [$routeParams.serialNumber]
                ).$promise.then(function(value) {
                        $scope.trademarkId = value[$routeParams.serialNumber];
                        if ($scope.trademarkId <= 0) {
                            $location.path('/attorney/error/No case was found');
                        }
                        if ($scope.withdrawMode === 'raa3') {
                            var readRadioButton = $http({
                                method: 'GET',
                                url: '/efile/rest/property/woaPropertyByType/' + $scope.withdrawMode + "/" + $scope.trademark.id,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).success(function(result) {
                                if (result != '') {
                                    var resultArray = result.propertyValue.split(" ");
                                    if (resultArray.length >= 1) {
                                        var index = resultArray.length - 1;
                                        if (resultArray[index] === 'false') {
                                            $scope.isAdditionalAttorneysDropped = true;
                                        }

                                    }
                                }

                            });
                        }
                    },
                    //error
                    function(error) {
                        //console.log(error);
                    }
                );
            },
            //error
            function(error) {
                //console.log(error);
                $location.path('/attorney/error/No case was found');
            }

        );


        $scope.copy = function(party) {
            //console.log(party);
            $scope.partyForm.correspondenceName = party.partyName;
            $scope.partyForm.nameLine2Tx = party.firmName;
            $scope.partyForm.address1 = party.address1;
            $scope.partyForm.address2 = party.address2;
            $scope.partyForm.address3 = party.address3;
            $scope.partyForm.city = party.city;
            $scope.partyForm.state = party.state;
            $scope.partyForm.country = party.country;
            $scope.partyForm.zip = party.zip;
            $scope.partyForm.phone = party.phone;
            $scope.partyForm.fax = party.fax;
            $scope.partyForm.email = party.email;
            $scope.partyForm.website = party.website;
        }

        $scope.saveCorrespondence = function() {
                $scope.partyForm.markId = $scope.trademarkId;
                if ($scope.radio.selected != 'current' && $scope.radio.selected != 'newCO') {
                    var correspondence = $filter('getById')($scope.trademark.additionalAttorneys, $scope.radio.selected);
                    if (!correspondence) {
                        correspondence = $filter('getById')($scope.trademark.owners, $scope.radio.selected);
                    }
                    $scope.copy(correspondence);
                }

                if ($scope.radio.selected != 'current') {

                    var save = CorrespondenceResource.save($scope.partyForm);
                    save.$promise.then(
                        //success
                        function(value) {
                            $route.reload();
                        },
                        //error
                        function(error) {
                            /*Do something with error*/

                        }
                    )
                }
            }
            // continue button for going to second page
        $scope.goToDomesticRep = function(validation) {
            if(validation) {
                $scope.corrRequired = true;
                return;
            } else {
                $scope.corrRequired = false;
            }
            $scope.saveCorrespondence();
            if ($scope.trademark.domesticRepNeeded) {
                $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/domesticRep/' + $routeParams.serialNumber);
            } else {
                $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/reviewAndSign/' + $routeParams.serialNumber);
            }
        }

        $scope.goBack = function() {

            $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/case/' + $routeParams.serialNumber);

        }

        $scope.cancel = function() {
            $location.path('/main');
        }

        $scope.openTsdrWindow = function() {
            $scope.tsdrurl = "http://tsdr.uspto.gov/#caseNumber=" + $routeParams.serialNumber + "&caseType=SERIAL_NO&searchType=statusSearch";
            window.open($scope.tsdrurl, '_blank');
        }

    }
]);

efileControllers.controller('domesticRepWithdrawCtrl', ['$route', '$scope', '$rootScope', '$routeParams', '$filter', '$location', '$http', 'TrmTrademarkResource', 'DomesticRepResource', 'CheckCasesAndGetIDsResource',
    function($route, $scope, $rootScope, $routeParams, $filter, $location, $http, TrmTrademarkResource, DomesticRepResource, CheckCasesAndGetIDsResource) {
        $scope.ctrlName = 'domesticRepWithdrawCtrl';
        $scope.radio = {};
        $scope.radio.selected = 'current';
        $scope.withdrawMode = $routeParams.withdrawMode;
        $scope.partyForm = {};
        $scope.partyForm.country = 'US';
        var primaryAttorney;
        $scope.isAdditionalAttorneysDropped = false;

        $scope.openTsdrWindow = function() {
            $scope.tsdrurl = "http://tsdr.uspto.gov/#caseNumber=" + $routeParams.serialNumber + "&caseType=SERIAL_NO&searchType=statusSearch";
            window.open($scope.tsdrurl, '_blank');
        }

        TrmTrademarkResource.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value) {
                $scope.trademark = value;
                $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);
                CheckCasesAndGetIDsResource.save(
                    [$routeParams.serialNumber]
                ).$promise.then(function(value) {
                        $scope.trademarkId = value[$routeParams.serialNumber];
                        if ($scope.trademarkId <= 0) {
                            $location.path('/attorney/error/No case was found');
                        }

                        if ($scope.withdrawMode === 'raa3') {
                            var readRadioButton = $http({
                                method: 'GET',
                                url: '/efile/rest/property/woaPropertyByType/' + $scope.withdrawMode + "/" + $scope.trademark.id,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).success(function(result) {
                                if (result != '') {
                                    var resultArray = result.propertyValue.split(" ");
                                    if (resultArray.length >= 1) {
                                        var index = resultArray.length - 1;
                                        if (resultArray[index] === 'false') {
                                            $scope.isAdditionalAttorneysDropped = true;
                                        }

                                    }
                                }

                            });
                        }



                    },
                    //error
                    function(error) {
                        //console.log(error);
                    }
                );
            },
            //error
            function(error) {
                //console.log(error);
                $location.path('/attorney/error/No case was found');
            }

        );

        $scope.copy = function(party) {
            $scope.partyForm.firstName = party.firstName;
            $scope.partyForm.middleName = party.middleName;
            $scope.partyForm.lastName = party.lastName;
            $scope.partyForm.suffix = party.suffix;
            $scope.partyForm.domesticRepName = party.partyName;
            $scope.partyForm.nameLine2Tx = party.firmName;
            $scope.partyForm.address1 = party.address1;
            $scope.partyForm.address2 = party.address2;
            $scope.partyForm.address3 = party.address3;
            $scope.partyForm.city = party.city;
            $scope.partyForm.state = party.state;
            $scope.partyForm.zip = party.zip;
            $scope.partyForm.phone = party.phone;
            $scope.partyForm.fax = party.fax;
            $scope.partyForm.email = party.email;
            $scope.partyForm.docketNumber = party.docketNumber;
            $scope.partyForm.website = party.website;
        }


        $scope.cancel = function() {
            $location.path('/main');
        }



        $scope.saveDomesticRep = function() {
            $scope.partyForm.markId = $scope.trademark.id;
            $scope.partyForm.serialNum = $scope.trademark.serialNumTx;
            if ($scope.radio.selected !== 'current' && $scope.radio.selected !== 'newDR') {
                var domesticRep = $filter('getById')($scope.trademark.additionalAttorneys, $scope.radio.selected);
                if (!domesticRep) {
                    domesticRep = $filter('getById')($scope.trademark.owners, $scope.radio.selected);
                }

                $scope.copy(domesticRep);
            }
            if ($scope.radio.selected !== 'current') {
                var save = DomesticRepResource.save($scope.partyForm);
                save.$promise.then(
                    //success
                    function(value) {
                        $route.reload();
                    },
                    //error
                    function(error) {

                    }
                )
            }
        }

        $scope.goToReview = function() {
            $scope.saveDomesticRep();
            $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/reviewAndSign/' + $routeParams.serialNumber);
        }

        $scope.goBack = function() {
            $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/correspondence/' + $routeParams.serialNumber);
        }
    }
]);


efileControllers.controller('WithdrawReviewAndSignCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$http', '$q', 'RaaMarkResource', 'SignatureResource', 'MiscellaneousResource', 'MiscellaneousDocResource', 'RaaMiscellaneousDocResource', 'RaaMiscellaneousResource', 'FileUpload', 'WithdrawCompleteInfo', 'configuration', 'TrmTrademarkResource', 'MiscellaneousResourceStatementDocs', 'SignatureValidationgSevice',
    function($scope, $rootScope, $routeParams, $location, $http, $q, RaaMarkResource, SignatureResource, MiscellaneousResource, MiscellaneousDocResource, RaaMiscellaneousDocResource, RaaMiscellaneousResource, FileUpload, WithdrawCompleteInfo, Configuration, TrmTrademarkResource, MiscellaneousResourceStatementDocs, SignatureValidationgSevice) {

        $scope.ctrlName = "WithdrawReviewAndSignCtrl";
        $scope.withdrawMode = $routeParams.withdrawMode;
        var allowedFileTypes = Configuration.allowedFileTypes.split(',');

        //resource bundle
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;

        $scope.signatureNameRequiredError = false;
        $scope.signatureRequiredError = false;
        $scope.electtonicSignWrongFormate = false;
        $scope.signatures = [];

        $scope.correspondence = {};
        $scope.withdrawReason = "";
        $scope.woaReasonStmt = {};
        $scope.oldCorrespondenceEmail = "";
        // signature
        $scope.signatureInfoForm = {};
        $scope.signatureInfoForm.signingDt = new Date();
        // miscellaneous
        $scope.miscellaneousIn = false;
        $scope.miscellaneousInfoForm = {};
        $scope.miscellaneousInfoForm.text = '';
        $scope.miscellaneousInfoForm.id = -1;


        // UI switch
        $scope.disableContinue = true;
        $scope.lastOptionSelected = false;
        $scope.noSignatures = false;
        $scope.noCheckBoxReason = false;
        $scope.noWOAStatement = false;


        TrmTrademarkResource.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value) {
                $scope.trademark = value;
                $scope.attorneys = value.additionalAttorneys.concat(value.primaryAttorney);
                $scope.primaryAttorney = value.primaryAttorney;

                var woaResource = $http({
                    method: 'GET',
                    url: '/efile/rest/woa/woaStatement/' + $scope.trademark.id + '/WR',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).success(function(result) {
                    $scope.woaReasonStmt.id = '';
                    $scope.woaReasonStmt.trademarkId = $scope.trademark.id;
                    $scope.woaReasonStmt.text = '';

                    if (result != null && result != '') {
                        $scope.woaReasonStmt.id = result.id;
                        $scope.woaReasonStmt.text = "\"" + result.text + "\"";
                    } else {
                        $scope.noWOAStatement = true;
                    };
                });

                if ($scope.withdrawMode == 'raa3') {
                    // init radio button
                    var readRadioButton = $http({
                        method: 'GET',
                        url: '/efile/rest/property/woa/?markId=' + $scope.trademark.id,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function(result) {
                        if (result != '') {
                            var resultArray = result.propertyValue.split(" ");
                            if (resultArray[0] === 'true' && resultArray[1] === 'true' && resultArray[2] === 'true' && resultArray[3] === 'true' && resultArray[4] === 'true') {
                                $scope.lastOptionSelected = false;
                            } else if (resultArray[5] === 'true') {
                                $scope.lastOptionSelected = true;
                            } else {
                                $scope.noCheckBoxReason = true;
                            };
                        } else {
                            $scope.noCheckBoxReason = true;
                        }
                    });
                }

                //load documents
                $scope.getMiscellaneousDocs();
                $scope.getMiscellaneousStmt();

                // for signatures
                $scope.getSignatures();
            },
            //error
            function(error) {
                //console.log(error);
                $location.path('/attorney/error/No case was found');
            }

        );

        /**********************************/


        // miscellanous logic
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

            if ($.inArray(file.type, allowedFileTypes) >= 0) {
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
        //
        $scope.deleteFile = function(file) {
            $scope.files.splice($scope.files.indexOf(file), 1);
            if (file.id) {
                MiscellaneousDocResource.delete({}, {
                    'id': file.id
                }).$promise.then(function() {});
            }
        };
        //
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
                markId: $scope.trademark.id
            });
        };

        $scope.getMiscellaneousStmt = function() {
                RaaMiscellaneousResource.get({
                    markId: $scope.trademark.id
                }).$promise.then(function(value) {
                    if (value.text) {
                        $scope.checked = true;
                        $scope.miscellaneousInfoForm.id = value.id;
                    }
                    $scope.miscellaneousInfoForm.text = value.text;
                    $scope.files = value.supportingDocuments;
                });
            }
            //
        $scope.saveReviewAndSign = function() {
            if (!$scope.miscellaneousInfoForm.text) {
                $scope.miscellaneousStmtError = true;
            } else {
                $scope.saveMiscStmtToDB();
            }
        }

        // signature logic
        $scope.getSignatures = function() {
            $scope.signatures = [];
            $scope.signatures = SignatureResource.query({
                markId: $scope.trademark.id
            });
        };

        //replacing createSignature. We now have only one signature.
        $scope.saveOrUpdateSignature = function() {

            if(!SignatureValidationgSevice.valdiateSignature($scope)) {
                console.log("signature fail!");
                return;
            }

            $scope.signatureInfoForm.markId = $scope.trademark.id;
            $scope.signatureInfoForm.id = $scope.signatures[0].id;
            $scope.signatureInfoForm.signature = $scope.signatures[0].signature;
            $scope.signatureInfoForm.signatoryName = $scope.signatures[0].signatoryName;
            $scope.signatureInfoForm.signatoryPosition = $scope.signatures[0].signatoryPosition;
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

        $scope.saveMiscellaneousStmt = function() {
            // At least one signature is required.
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

        //
        $scope.saveMiscStmtToDB = function() {
                //alert('saveMiscStmtToDB');
                $scope.miscellaneousStmtError = false;
                $scope.miscellaneousInfoForm.trademarkId = $scope.trademark.id;
                var save = MiscellaneousResource.save($scope.miscellaneousInfoForm);

                //Misc is saved now. Upload the file.
                save.$promise.then(function(value) {
                    $scope.stmtId = value.id;
                    $scope.miscellaneousInfoForm.id = value.id;

                    var uploadUrl = "/efile/rest/raa/upload/stmtId/" + value.id + "/trademarkId/" + $scope.trademark.id + "/serialNum/" + $routeParams.serialNumber;
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
                }); //end of upload.
            } // end of saveMiscStmtToDB.
            // for submit button
        $scope.submit = function() {
            if(!SignatureValidationgSevice.valdiateSignature($scope)) {
                console.log("signature fail!");
                return;
            }
                // save attachments.
                $scope.saveMiscellaneousStmt();
                ////console.log($scope.primaryAttorney);

                //generate xml.
                var $promise = $http({
                    method: 'PUT',
                    url: '/efile/rest/woa/xml/' + $routeParams.serialNumber
                }).success(function(result) {

                    //console.log("xml generated successfully.");


                    // clear withdraw reason statment and checkbox
                    var deleteWOACheckBox = $http({
                        method: 'DELETE',
                        url: '/efile/rest/property/woa?markId=' + $scope.trademark.id
                    }).success(function() {
                        //console.log("WOA checkbox delete success!!!");
                    });

                    var deleteWOAStat = $http({
                        method: 'DELETE',
                        url: '/efile/rest/woa/woaStmt',
                        data: {
                            id: $scope.woaReasonStmt.id
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function() {
                        //console.log("WOA statment delete success!!!");
                    });

                });
                // go to complete
                $location.path('/attorney/withdraw/completeWithdraw/' + $routeParams.serialNumber);
            } //submit finish here
            //

        // for go back
        $scope.goBack = function() {
            if ($scope.trademark.domesticRepNeeded) {
                $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/domesticRep/' + $routeParams.serialNumber);
            } else {
                $location.path('/attorney/withdraw/' + $routeParams.withdrawMode + '/correspondence/' + $routeParams.serialNumber);
            }
        }

        // finger Sign
        $scope.fingerSignatureForm = {
            jsonData: null,
            imageData: null
        };
        var fingerSignCanvas = null;

        var options = {
            defaultAction: 'drawIt',
            penColour: '#000000',
            lineWidth: 0,
            onDrawEnd: function() {
                $scope.fingerSignatureForm.jsonData = fingerSignCanvas.getSignatureString();
                $scope.fingerSignatureForm.imageData = fingerSignCanvas.getSignatureImage();
            }
        }

        $scope.beginFingerSign = function() {
            fingerSignCanvas = $('.sigPad').signaturePad(options);
        }

        $scope.saveFingerSign = function() {
            // wait for submition model
            //console.log($scope.fingerSignatureForm);
        }

        $scope.clearFingerSign = function() {
            if (fingerSignCanvas != null) {
                fingerSignCanvas.clearCanvas();
                $scope.fingerSignatureForm = {
                    jsonData: null,
                    imageData: null
                };
            };
        }

    } //function complete
]);


efileControllers.controller('withdrawCompleteCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$http', 'TrmTrademarkResource',
    function($scope, $rootScope, $routeParams, $location, $http, TrmTrademarkResource) {

        console.log("complete withdraw primary attorney");
        $scope.ctrlName = 'withdrawCompleteCtrl';
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;


        TrmTrademarkResource.get({
            serialNo: $routeParams.serialNumber
        }).$promise.then(function(value) {
                $scope.trademark = value;
             /* if ($scope.trademark.correspondenceChanged) {
                    var deleteCorrespondence = $http({
                        method: 'DELETE',
                        url: '/efile/rest/correspondence/' + $scope.trademark.id,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function() {
                        //console.log("Correspondence delete success!!!");
                    });
                }*/
            },

            //error
            function(error) {
                //console.log(error);
                $location.path('/attorney/error/No case was found');
            }

        );

        // click done.
        $scope.done = function() {
            $location.path('/main');
        };

    }
]);