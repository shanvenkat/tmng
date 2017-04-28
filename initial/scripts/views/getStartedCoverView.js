// GetStartedCoverView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/getStartedCover.html'],

    function($, jqueryui, Backbone, template) {
        'use strict';

        //Create GetStartedCoverView class which extends Backbone.View
        var GetStartedCoverView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            // View constructor
            initialize: function() {

                // Calls the view's render method
                
            },

            // View Event Handlers
            events: {

                "click #continueButton": "gotoMarkDetails",
                "click #previousPage": "previousPage"
                

            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                this.template = _.template(template,{});

               
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

        // Returns the GetStartedCoverView class
        return GetStartedCoverView;




    }
);
