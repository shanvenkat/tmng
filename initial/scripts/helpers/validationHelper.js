define(['jquery', 'underscore', "backbone", "backboneValidation"],
    function($, _, BB, BBValidation) {
        'use strict';
        _.extend(Backbone.Validation.callbacks, {
            valid: function(view, attr, selector) {
                var control = view.$('[' + selector + '=' + attr + ']');
                var group = control.closest(".control-group");
                group.removeClass("has-error");

                if (control.data("error-style") === "tooltip") {
                    // CAUTION: calling tooltip("hide") on an uninitialized tooltip
                    // causes bootstraps tooltips to crash somehow...
                    if (control.data("tooltip"))
                        control.tooltip("hide");
                } else if (control.data("error-style") === "inline") {
                    group.find(".help-inline.error-message").remove();
                } else {
                    var error_child = group.find(".help-block.error-message:first");
                    if (!error_child.closest(".control-group").hasClass('error'))
                        error_child.remove();
                }
            },
            invalid: function(view, attr, error, selector) {
                var control = view.$('[' + selector + '=' + attr + ']');
                var group = control.closest(".control-group");
                group.addClass("has-error");

                if (control.data("error-style") === "tooltip") {
                    var position = control.data("tooltip-position") || "right";
                    control.tooltip({
                        placement: position,
                        trigger: "manual",
                        title: error
                    });
                    control.tooltip("show");
                } else if (control.data("error-style") === "inline") {
                    if (group.find(".help-inline").length === 0) {
                        group.find(".controls").append("<span class=\"help-inline error-message\"></span>");
                    }
                    var target = group.find(".help-inline");
                    target.text(error);
                } else {
                    if (group.find(".help-block").length === 0) {
                        group.find(".controls:first").append("<p class=\"help-block error-message\"></p>");
                    }
                    var target = group.find(".help-block");
                    target.text(error);
                }
            }
        });

        _.extend(Backbone.Validation.patterns, {
            phoneOrFaxRegex : /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/,
            emailRegex : /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/,
            websiteRegex : /(http(s)?:\\)?([\w-]+\.)+[\w-]+[.com|.in|.org]+(\[\?%&=]*)?/,
            rforeign : /[^\u0000-\u007f]/
        });
    });