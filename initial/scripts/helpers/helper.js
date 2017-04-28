define(['jquery', 'equalize'],
    function($, equalize) {
        'use strict';

        var Helper = {

            // Function to set equal heights
            setEqualizeHeight: function(parent, child) {
                $(parent).equalize({
                    equalize: 'outerHeight',
                    children: child,
                    reset: true
                });
            },

            // Function to activate custom inputs
            activateCustomInputs: function() {
                $(':input').customInput();
            },

            toTitleCase: function(str) {
                return str.replace(/\w\S*/g, function(txt) {
                    if (txt == "U.S.") {
                        return txt.substring(0, txt.length - 1);
                    } else return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }

        };

        return Helper;
    });