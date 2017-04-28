// SavedAppHomeView .js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/savedAppHome.html'],

    function($, jqueryui, Backbone, template) {
        'use strict';

        //Create SavedAppHomeView class which extends Backbone.View
        var SavedAppHomeView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            // View constructor
            initialize: function() {
                
            },

            // View Event Handlers
            events: {

                "click #continueNewApp": "gotoMarkDetails",
                "click #previousPage": "previousPage"
                

            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                this.template = _.template(template, {marks: this.model.models});

                
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);


                // Maintains chainability
                return this;

            },

           
            gotoMarkDetails: function() {
                var navString = '#markCover';
                this.pageNavigator(navString, true);
            }

        });

        // Returns the SavedAppHomeView class
        return SavedAppHomeView;




    }
);
