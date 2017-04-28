// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone',  'text!templates/reviewAndSignCover.html'],

    function($, jqueryui, Backbone, template) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var ReviewAndSignCoverView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminPage:false,
            markId: '',

            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;   
                this.markId = attrs.markId;       
            },

            // View Event Handlers
            events: {
                'click #continueButton': 'gotoConfirmEntries'
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    //content: JSON.parse(content)
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                //checking if this is admin view
                if (this.adminPage)
                {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;

            },
            gotoConfirmEntries: function(e) {
                var navString = '#confirmEntries'
                if ( this.markId != undefined) {
                    navString += '/' + this.markId;
                }
                this.pageNavigator(navString, true);
            }
            


        });

        // Returns the ReviewAndSignCoverView class
        return ReviewAndSignCoverView;




    }
);
