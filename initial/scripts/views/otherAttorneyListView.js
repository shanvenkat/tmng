define(['jquery', 'jqueryui', 'backbone', 'views/otherAttorneyListItemView'],
    function ($, jqueryui, Backbone, OtherAttorneyListItemView) {
        'use strict';
        //Create SignListView class which extends Backbone.View

        var OtherAttorneyListView = Backbone.View.extend({
            //el: '#otherAttorneyContainer',
            initialize: function (attr) {
                // Ensure our methods keep the `this` reference to the view itself
                _.bindAll(this, 'render');
                // Bind collection changes to re-rendering
                // Bind collection changes to re-rendering
                this.collection.bind('add', this.render);
                this.collection.bind('remove', this.render);
            },
            // Renders the view's template to the UI
            render: function () {
                //Clear out the existing list to avoid duplications
                $(this.el).empty();
                _.each(this.collection.models, function (otherAttorney) {
                    $(this.el).append(new OtherAttorneyListItemView({
                        model: otherAttorney
                    }).render().el);
                }, this);
                return this;
            }
        });
        return OtherAttorneyListView;
    }
);