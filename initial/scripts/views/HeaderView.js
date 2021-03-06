// HeaderView.js
// -------
define(['jquery', 'backbone', 'text!templates/header.html', 'text!locale/en_us/header.json'],

    function($, Backbone, headerTemplate,  headerContent) {
        'use strict';

        //Create HeaderView class which extends Backbone.View
        var HeaderView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: 'header',

            // View constructor
            initialize: function() {

                // Calls the view's render method
                this.render();

            },

            // View Event Handlers
            events: {
                
            },

            // Renders the view's template to the UI
            render: function() {

                // Setting the view's template property using the Underscore template method
                this.template = _.template(headerTemplate, {
                    content: JSON.parse(headerContent)
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                              
                // Maintains chainability
                return this;

            }

            
        });

        // Returns the HeaderView class
        return HeaderView;

    }

);