'use strict';

/* Controllers */



/* HTML related controllers only */
angular.module('efileControllers').controller('SearchAppHtmlCtrl', ['$scope', '$rootScope', '$location',
    function($scope, $rootScope, $location) {
        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.go = function() {

            $location.path('/html/searchResults');

        };

        $scope.active = true;

        $scope.taskList = [{
            text: "Appoint additional authorized attorneys of record",
            value: "appoint"
        }, {
            text: "Replace the primary attorney of record with another authorized attorney",
            value: "replace"
        }, {
            text: "Remove other authorized attorneys from the record",
            value: "remove"
        }, {
            text: "Withdrawal as the Primary Attorney of Record",
            value: "withdrawal"
        },{
            text: "Withdrawal as the Primary Attorney due to power of Attorney Ending",
            value: "withdrawalPowerEnding"
        }];

        $scope.data = {
            task: 'appoint'
        };

        $scope.goSomewhere = function() {
            var path;
            switch ($scope.data.task) {
                case 'appoint':
                    path = '/html/appointAttorney';
                    break;
                case 'replace':
                    path = '/html/replaceAttorney';
                    break;
                case 'remove':
                    path = '/html/removeAttorney';
                    break;
                case 'withdrawal':
                    path = '/html/withdrawalAttorney';
                    break;
                case 'withdrawalPowerEnding':
                    path = '/html/withdrawalAttorneyPOA';
                    break;
            }
            $location.path(path);
        };

    }

]);


angular.module('efileControllers')
    .controller('DisplayAppHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.myVar = false;
            $scope.editVar = true;

            $scope.firstName = "John";
            $scope.middleName = "Clinton";
            $scope.lastName = "Applegate";
            $scope.save = function() {

                // if ($scope.attorneyForm.$valid) {
                $scope.myVar = true;


                //}
            };
            $scope.showPopup = function() {
                pn.snip.load("html/confirmAppointAttorneyPopup.html", function(snippet) {
                    snippet.popup({
                        onsubmit: function(e, data) {

                        },
                        title: 'Appoint additional attorney: Continue?'
                    });
                });
            }




        }
    ]);

angular.module('efileControllers')
    .controller('MultiAppHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "appointMultiple";
            $scope.myVar = false;
            $scope.editVar = true;

            $scope.firstName = "John";
            $scope.middleName = "Clinton";
            $scope.lastName = "Applegate";
            $scope.save = function() {

                // if ($scope.attorneyForm.$valid) {
                $scope.myVar = true;


                //}
            };
            $scope.go = function() {

                $location.path('/html/reviewMultiAttorney');

            };
        }
    ]);


angular.module('efileControllers')
    .controller('RemoveAppHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.myVar = false;
            $scope.editable = false;
            $scope.isInput1ReadOnly = true;
            $scope.firstName = "John";
            $scope.middleName = "Clinton";
            $scope.lastName = "Applegate";
            $('.editControls').show();
            $scope.save = function() {

                // if ($scope.attorneyForm.$valid) {
                $scope.myVar = true;


                //}
            };
            $scope.editableActive = function() {
                $scope.editable = true;
                $scope.isInput1ReadOnly = false;
                $('.editBtn').hide();
                $('.editControls').show();
            };
            $scope.editableInactive = function() {
                $scope.editable = false;
                $scope.isInput1ReadOnly = true;
                $('.editBtn').show();
                $('.editControls').hide();
            };
        }

    ]);


angular.module('efileControllers')
    .controller('WithdrawAttorneyHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;

            $scope.goToCorrespondence = function() {

                $location.path('/html/correspondenceInfoSingleCase');

            };

        }

    ]);
angular.module('efileControllers')
    .controller('CorrespondenceHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.ctrlName = "correspondence";
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;

            $scope.goToDomesticRep = function() {

                $location.path('/html/domesticRepSingleCase');

            };

        }

    ]);
angular.module('efileControllers')
    .controller('DomesticRepHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.ctrlName = "domesticRep";
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;

            $scope.goToReview = function() {

                $location.path('/html/reviewWithdrawPOAAttorney');

            };

        }

    ]);
angular.module('efileControllers')
    .controller('TableAppHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.goToAppoint = function() {

                $location.path('/html/appointAttorneyMulti');

            };


            var table = $('#table1');


            $scope.class = "defaultClass";

            $scope.toggleClass = function() {
                if ($scope.class === "defaultClass")
                    $scope.class = "pn-inactive";
                else
                    $scope.class = "defaultClass";
            };

            $('.default').on('click', function() {
                pn.table.sort(table, {
                    targetSelector: table.find('tr').first()
                })

            })

            $('.custom').on('click', function() {
                pn.table.sort(table, {
                    targetSelector: table.find('th')[1],
                    comparator: function(a, b) {
                        return a.text().length - b.text().length
                    }
                })
            })
        }

    ]);




angular.module('efileControllers')
    .controller('AdvSearchHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;

            $scope.goToSearchResultByMark = function() {

                $location.path('/html/searchResultsByMark');

            };
            $scope.goToSearchResultByOwner = function() {

                $location.path('/html/searchResultsByOwner');

            };
            $scope.goToSearchResultByAttorney = function() {

                $location.path('/html/searchResultsByAttorney');

            };

        }

    ]);

angular.module('efileControllers')
    .controller('SearchResultsByMarkHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;


            var table = $('#table1');



        }

    ]);

angular.module('efileControllers')
    .controller('SearchResultsByOwnerHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;


            var table = $('#table1');



        }

    ]);

angular.module('efileControllers')
    .controller('SearchResultsByAttorneyHtmlCtrl', ['$scope', '$rootScope', '$location',
        function($scope, $rootScope, $location) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;


            var table = $('#table1');



        }

    ]);
angular.module('efileControllers')
    .controller('ReviewAppHtmlCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "reviewAppoint";
            $scope.myVar = true;
            $scope.editVar = false;
            $scope.firstName = "John";
            $scope.middleName = "Clinton";
            $scope.lastName = "Applegate";
            $scope.signTemplate = 'electronic';

            $scope.activeBtnClass = "btn-primary";

            $scope.printDiv = function(divName) {
                window.print();
                
            }
            $scope.showMiscStatement = function() {

            };
            $scope.myEditor = "";

            var elt = $('#editor-example-1');

            elt.editor({

                controls: [
                    "styles",
                    "cut",
                    "copy",
                    "paste",
                    "separator",
                    "undo",
                    "redo",
                    "separator",
                    "bold",
                    "italic",
                    "hilite",
                    "separator",
                    "bulletList",
                    "orderedList",
                    "indent",
                    "outdent",
                    "superscript",
                    "subscript"
                ],
                height: 150,
                width: 900




                // height: 150

            });


        }






    ]);


angular.module('efileControllers')
    .controller('ReviewMultiAppHtmlCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "reviewAppointMultiple";
            $scope.myVar = true;
            $scope.editVar = false;
            $scope.firstName = "John";
            $scope.middleName = "Clinton";
            $scope.lastName = "Applegate";


          $scope.printDiv = function(divName) {
                window.print();
                
            }
            $scope.showMiscStatement = function() {

            };
            $scope.myEditor = "";

            var elt = $('#editor-example-1');

            elt.editor({

                controls: [
                    "styles",
                    "cut",
                    "copy",
                    "paste",
                    "separator",
                    "undo",
                    "redo",
                    "separator",
                    "bold",
                    "italic",
                    "hilite",
                    "separator",
                    "bulletList",
                    "orderedList",
                    "indent",
                    "outdent",
                    "superscript",
                    "subscript"
                ],
                height: 150,
                width: 900




                // height: 150

            });


        }






    ]);



angular.module('efileControllers')
    .controller('ReviewRemoveHtmlCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "reviewRemove";
        }
    ]);

angular.module('efileControllers')
    .controller('ReviewWithdrawHtmlCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "reviewWithdraw";
            $scope.printDiv = function(divName) {
                window.print();
                
            }
        }
    ]);
angular.module('efileControllers')
    .controller('ReviewWithdrawPOAHtmlCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            $scope.resourceBundle = $rootScope.rootResourceBundleResource;
            $scope.ctrlName = "reviewWithdrawPOA";
            $scope.printDiv = function(divName) {
                window.print();
                
            }
        }
    ]);
