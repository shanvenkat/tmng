define(['jquery', 'jqueryui', 'backbone', 'text!templates/secondaryEmailTemplate.html'],
    function($, jqueryui, Backbone, template) {
        'use strict';
        var SecondaryEmailItemView = Backbone.View.extend({
            template: _.template(template),
            // View constructor
            initialize: function() {
                this.listenTo(this.model, 'remove', this.remove);
            },
            events: {
                // User clicks Delete button

                'click #removeEmail': 'removeEmail'
            },
            // Renders the view's template to the UI
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            },
            removeEmail: function(e) {
                console.log("remove");
                this.model.collection.remove(this.model);
            }

        });
        return SecondaryEmailItemView;
    }
);