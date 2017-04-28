'use strict';

/* Controllers */

var efileControllers = angular.module('efileControllers', []);

/* HTML related controllers only */
angular.module('efileControllers').controller('SearchAppHtmlCtrl', ['$scope', '$location',
    function($scope, $location) {

        $scope.myEditor = "";
        $('.toggle').on('click', function() {
            var elt = $('#editor-example-1');
            if (elt.editor()) {
                elt.editor(false);
            } else {
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
        });

    }
]);

angular.module('efileControllers').controller('DisplayAppHtmlCtrl', ['$scope', '$routeParams',
    function($scope, $routeParams) {
        

      
        var elt = $('.user-menu');
        pn.menu(elt);

        $scope.showPopup = function(){
             pn.snip.load("html/font-size-popup.html", function (snippet) {
                            snippet.popup({
                                onsubmit: function (e, data) {
                                }
                            });
                        });
        }

        $scope.class = "open";

        $scope.changeClass = function() {
            if ($scope.class === "open")
                $scope.class = "close";
            else
                $scope.class = "open";
        };

    }
]);

angular.module('efileControllers').controller('TableHtmlCtrl', ['$scope', '$routeParams',
    function($scope, $routeParams) {
        
    
    
       
     var table = $('#table1'); 
    $scope.class = "defaultClass";
    
    $scope.toggleClass = function(){
        if ($scope.class === "defaultClass")
            $scope.class = "pn-inactive";
        else
            $scope.class = "defaultClass";
    };
    
    

    $('.default').on('click', function () {
        pn.table.sort(table, {
            targetSelector: table.find('th').first() })
        
    })
    
    $('.custom').on('click', function () {
        pn.table.sort(table, {
            targetSelector: table.find('th')[1],
            comparator: function (a, b) {
                return a.text().length - b.text().length }})
    })
    
    
    $('.number').on('click', function () {
        pn.table.sort(table, {
            targetSelector: table.find('th')[3] })
    })

    var table = $('#table2');

    pn.toggle('.st').on('change', function () {
         //console.log('i am here : '+$('.st :selected').text());
          $('<p></p>').text($('.st').val()).appendTo('#div1');
           //console.log('i am at next here : '+$('.st option:selected').text());
           $scope.newVar = "group";
        var toggle = pn.table['group']
        toggle('table', {
           targetSelector: ('th').first()
             });

        pn.table.group( table, {
            targetSelector: 'th:first-child'
        })
        pn.toggle(snip.find('select.group')).on('change', function () {
            var toggle = pn.table[$(this).val().toLowerCase()]
            toggle(snip.find('.hider table'), {
                targetSelector: 'th:first-child'
            })
        })
    })
      
    }
]);