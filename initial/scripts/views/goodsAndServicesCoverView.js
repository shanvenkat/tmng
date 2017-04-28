// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone',  'text!templates/goodsAndServicesCover.html',  'text!locale/en_us/goodsAndServicesDetails.json', 'text!locale/en_us/header.json'],

    function($, jqueryui, Backbone, template,  content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var GoodsAndServicesCoverView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.markId = attr.markId;

            },

                  

            // View Event Handlers
            events: {
                'click #continueButton': 'gotoAddClassesAndID',
                "click #previousPage" : "previousPage"
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: JSON.parse(content)
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                // Maintains chainability
                return this;

            },

            //This function will navigate either to the profile page or the compare page based on whether 1 or more providers are selected.
            gotoAddClassesAndID: function() {

                var navString = '#addClassesAndID/' + this.markId;
                this.pageNavigator(navString, true);
            },
            previousPage:function(){
                Backbone.history.history.back();
            }


        });

        // Returns the AppStatusView class
        return GoodsAndServicesCoverView;




    }
);
