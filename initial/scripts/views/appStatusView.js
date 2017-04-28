// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/appStatus.html', 'text!locale/en_us/ownerDetails.json'],

    function($, jqueryui, Backbone, template, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var AppStatusView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            // View constructor
            initialize: function() {

                // Calls the view's render method
                //temp fix to scroll to top of the page when you click on start new search button on results
                $('html, body').animate({
                    scrollTop: this.$el.offset()
                }, 100);

                // Use JqueryEqualHeights to side by side divs equal height
                //$(".row .panel-equal-height").equalHeight();
                

            },

            // View Event Handlers
            events: {

                "click #continueNewApp": "gotoAppDetails",
                "click #previousPage": "previousPage"
                

            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                this.template = _.template(template, {marks: this.model.models});

                // Setting the view's template property using the Underscore template method
                /*this.template = _.template(template, {
                    content: JSON.parse(content)
                })*/

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);


                // Maintains chainability
                return this;

            },

            gotoAppDetails: function() {
                var navString = '#appHome';
                this.pageNavigator(navString, true);
            },


            //Show details for mulitple owners
            ownerDetailsShow: function() {
                var ownerStatusDetailsContent = _.template($("#ownerStatusDetails").html());
                $("#ownerStatusDetailsContainer").append(ownerStatusDetailsContent());

            },

            gotoMarkDetails: function() {
                var navString = '#markCover';
                this.pageNavigator(navString, true);
            },

            gotoOwnerDetails: function() {
                var navString = '#ownerAttorneyCover';
                this.pageNavigator(navString, true);
            }

        });

        // Returns the AppStatusView class
        return AppStatusView;




    }
);
