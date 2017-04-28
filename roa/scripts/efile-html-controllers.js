'use strict';

/* HTML related controllers only */
angular.module('efileControllers').controller('SearchAppHtmlCtrl', ['$scope', '$location',
    function($scope, $location) {

        $scope.message = '';
        $scope.showme = false;
        $scope.applicationNumber = '';

        $scope.go = function() {
            if ($scope.applicationNumber === '123') {
                $location.path('/html/123');
            } else {
                $scope.message = 'Application Not Found!';
                $scope.showme= true;
            }

        };
    }
]);

angular.module('efileControllers').controller('DisplayAppHtmlCtrl', ['$scope', '$routeParams',
    function($scope, $routeParams) {


        $scope.myEditor = "";
        $('.toggle').on('click', function() {
            var elt = $('#editor-example-1');
            if (elt.editor()) {
                elt.editor(false);
            } else {
                elt.editor({
                    height: 150

                });
            }
        })

        ;


        // process the form
        $scope.processForm = function() {




            console.log('editor: ' + $('#editor-example-1').text());


        };

    }
]);
