// BasisDetailsView
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/internationalBasis2.html', 'text!locale/en_us/basisDetails.json'],

    function($, jqueryui, Backbone, template, content) {
        'use strict';

        //Create BasisDetailsView class which extends Backbone.View
        var BasisDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminPage: false,
            markId: '',

            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;
                this.model=attrs.model;
                this.markId = this.model.get('markId');
            },

            // View Event Handlers
            events: {
                'click #continueButton': 'gotoIdentifyBasis',
                "click #previousPage": "previousPage",
                "click input[name=foreignRegIn]": "isForeignRegistration"
            },

            previousPage: function() {
                Backbone.history.history.back();
            },
            isForeignRegistration: function(e) {
                if ($('input:radio[name=foreignRegIn]:checked').val() === "true") {
                    this.model.set('foreignRegIn', true);
                }
            },
            // Renders the view's template to the UI
            render: function() {

                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                   content: this.model.toJSON()
                })
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                this.ModelBindAndValidation(this.model, this.$el);
                //checking if this is admin view
                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;

            },
            gotoIdentifyBasis: function(e) {
                var navString = '#identifyBasis'
                if (this.markId != undefined) {
                    navString += '/' + this.markId;
                }
                this.pageNavigator(navString, true);
            }



        });

        // Returns the BasisDetailsView class
        return BasisDetailsView;




    }
);
