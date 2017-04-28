define(["jquery"], function($){
    'use strict';
    // Custom Chainable jquery function to set equal heights
    $.fn.equalHeight = function () {
        var maxHeight = 0;

        // Calculate the max height by looping through the jquery selector
        this.each(function () {
            maxHeight = ($(this).height() > maxHeight) ? $(this).height() : maxHeight;
        });
        
        this.each(function () {
            // set height to only those that have lesser height
            if (parseInt($(this).height()) < maxHeight) {
                return $(this).height(maxHeight);
            }
        });
        
        // return to make the plugin chainable
        return this;
    }
 
});
