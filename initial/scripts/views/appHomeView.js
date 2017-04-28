// AppHomeView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/appHome.html'],

    function($, jqueryui, Backbone, template) {
        'use strict';

        //Create AppHomeView class which extends Backbone.View
        var AppHomeView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            // View constructor
            initialize: function() {

                // Calls the view's render method
                //this.render();
                
            },

            // View Event Handlers
            events: {

                "click #startNewApp": "gotoGetStartedCover",
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

            //Show details for mulitple owners
            ownerDetailsShow: function() {
                var ownerStatusDetailsContent = _.template($("#ownerStatusDetails").html());
                $("#ownerStatusDetailsContainer").append(ownerStatusDetailsContent());

            },

            gotoGetStartedCover: function() {
                var navString = '#getStartedCover';
                this.pageNavigator(navString, true);
            },

            gotoOwnerDetails: function() {
                var navString = '#ownerAttorneyCover';
                this.pageNavigator(navString, true);
            }

        });

        // Returns the AppHomeView class
        return AppHomeView;




    }
);
