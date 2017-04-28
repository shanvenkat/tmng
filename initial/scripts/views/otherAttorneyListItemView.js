define(['jquery', 'jqueryui', 'backbone', 'text!templates/otherAttorneyTemplate.html'],
    function($, jqueryui, Backbone, template) {
        'use strict';
        var OtherAttorneyListItemView = Backbone.View.extend({
            template: _.template(template),
            // View constructor
            initialize: function() {
            },
            events: {
               // 'click #removeOtherAttorney': 'removeOtherAttorney'
            },
            // Renders the view's template to the UI
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                // Maintains chainability
                return this;
            }
        });
        return OtherAttorneyListItemView;
    }
);