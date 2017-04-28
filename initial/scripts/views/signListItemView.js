define(['jquery', 'jqueryui', 'backbone', 'text!templates/signItemTemplate.html'],

    function($, jqueryui, Backbone, template) {
        'use strict';

        //Create SignListItemView class which extends Backbone.View
        var SignListItemView = Backbone.View.extend({
            template: _.template(template),
            // View constructor
            initialize: function() {
                this.listenTo(this.model, 'remove', this.remove);

            },
            events: {
                // User clicks Delete button
                'click #removeSignatory': 'removeSignatory'
            },

            // Renders the view's template to the UI
            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));

                // Maintains chainability
                return this;

            },
            removeSignatory: function(e) {
                console.log("remove Signatory...")
                e.preventDefault();
                this.model.collection.remove(this.model);
            }

        });

        // Returns the SignListItemView class
        return SignListItemView;
    }
);