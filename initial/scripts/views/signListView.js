define(['jquery', 'jqueryui', 'backbone', 'views/signListItemView'],

    function($, jqueryui, Backbone, SignListItemView) {
        'use strict';

        //Create SignListView class which extends Backbone.View
        var SignListView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: '#signatoryContainer',
            // View constructor
            initialize: function() {

                // Ensure our methods keep the `this` reference to the view itself
                _.bindAll(this, 'render');

                // Bind collection changes to re-rendering
                this.collection.bind('add', this.render);
                this.collection.bind('remove', this.render);

            },
            // Renders the view's template to the UI
            render: function() {
                console.log("SignListView rendering...");
                console.log(this.collection.length);

                //Clear out the existing list to avoid duplications
                $(this.el).empty();

                _.each(this.collection.models, function(signature) {
                    $(this.el).append(new SignListItemView({
                        model: signature
                    }).render().el);
                }, this);

                return this;

            }

        });

        // Returns the SignTypeView class
        return SignListView;
    }
);