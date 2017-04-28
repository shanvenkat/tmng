// AttorneyListView .js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/attorneyList.html',
        'collections/attorneyCollection'
    ],
    function($, jqueryui, Backbone, template, AttorneyCollection) {
        'use strict';
        //Create SearchView class which extends Backbone.View
        var AttorneyListView = Backbone.View.extend({
            collection: '',
            // View constructor
            initialize: function(attr) {
                this.collection = attr.collection;
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                this.template = _.template(template, {
                    collection: this.collection.toJSON()
                });
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);



                // Maintains chainability
                return this;
            }
        });
        return AttorneyListView ;
    }
);