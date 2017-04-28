// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/utilityBar.html', 'text!locale/en_us/header.json'],

    function($, jqueryui, Backbone, template, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var UtilityBarView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            // View constructor
            initialize: function() {

            },

            // View Event Handlers
            events: {
                         
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: JSON.stringify(this.model)
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                

                // Maintains chainability
                return this;

            }

            
        });

        // Returns the AppStatusView class
        return UtilityBarView;




    }
);
