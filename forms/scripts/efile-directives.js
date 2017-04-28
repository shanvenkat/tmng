efileApp.directive('today', function() {
    return {
        // restrict to an attribute type.
        restrict: 'A',
        // element must have ng-model attribute.
        require: 'ngModel',
        // scope = the parent scope
        // elem = the element the directive is on
        // attr = a dictionary of attributes on the element
        // ctrl = the controller for ngModel.
        link: function(scope, elem, attr, ctrl) {
            // add a parser that will process each time the value is 
            // parsed into the model when the user updates it.
            ctrl.$parsers.unshift(function(value) {
                // test and set the validity after update.
                var valid = moment.utc().isSame(moment.utc(value), 'day');
                ctrl.$setValidity('today', valid);
                // if it's valid, return the value to the model, 
                // otherwise return undefined.
                return valid ? moment.utc(value).format("YYYY-MM-DD") : undefined;
            });
            // add a formatter that will process each time the value 
            // is updated on the DOM element.
            ctrl.$formatters.unshift(function(value) {
                // validate.
                // return the value or nothing will be written to the DOM.
                return moment.utc(value).format("YYYY-MM-DD");
            });
        }
    };
});


efileApp.directive("ngFilesModel", ["$parse", function($parse) {
    return {
        restrict: "A",
        link: function(scope, elem, attr) {
            elem.bind("change", function(evt) {
                scope.$apply(function() {
                    scope.fileTypeError = false;
                    scope.fileSizeError = false;
                    scope.fileNameTooLongError = false;
                    var ngModelGet = $parse(attr["ngFilesModel"]);
                    var ngModelSet = ngModelGet.assign;
                    ngModelSet(scope, evt.target.files);
                });
            });
            scope.$watch(attr["ngFilesModel"], function(file) {
                  // File input element accepts a filename, which may only be programatically set to the empty string.
                  if (!file) {
                      elem.val("");
                  }
              });
        }
    };
}]);


efileApp.directive("compiledBind", function($compile){
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope){
                return scope.$eval(attrs.compiledBind);
            },
            function(value) {
                element.html(value);
                $compile(element.contents())(scope);
            }
        )
    }
})

efileApp.directive("equalHeight", function($timeout){
    return {
        restrict: "EA",
        link: function(scope, element, attrs) {
          $timeout(function () {
            $('.equalheight .box, .equalheight .outline-box').equalHeights();//this works
          }, 2000);//500ms is time we think it would take to finish loading the records that need equal heights.
        }
    };
});

