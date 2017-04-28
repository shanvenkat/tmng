// CorrespondenceCountryView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/correspondenceCountryTemplate.html'],
    function($, jqueryui, Backbone, template) {
        'use strict';
        //Create CorrespondenceCountryView class which extends Backbone.View
        var CorrespondenceCountryView = Backbone.View.extend({
            country: '',
            initialize: function(attr) {
                this.country = attr.country;
            },
            // Renders the view's template to the UI
            render: function() {
                // Secondary Email collection
                var self = this;
                self.template = _.template(template, {
                    country: this.country
                });
                // Dynamically updates the UI with the view's template
                self.$el.html(self.template);
                return this;
            }
        });

        return CorrespondenceCountryView;
    }
);