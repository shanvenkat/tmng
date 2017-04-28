// FooterView.js
// -------
define(['jquery', 'backbone', 'text!templates/footer.html', 'text!locale/en_us/footer.json'],

    function($, Backbone, template, content) {
        'use strict';

        //Create FooterView class which extends Backbone.View
        var FooterView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: 'footer',

            // View constructor
            initialize: function() {

                // Calls the view's render method
                this.render();

            },

            // View Event Handlers
            events: {
                'click .push-down h3': "toggleGlyphs",
                'keyup .push-down h3': "toggleGlyphs",
                'click #footer-home-btn': "reloadPage",
                "click #previousPage": "previousPage"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: JSON.parse(content)
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                // Maintains chainability
                return this;

            },

            //functions to control mobile menu
            mobileFooterMenu: function() {
                this.$(".push-down h3").attr("data-toggle", "collapse");
                this.$('.push-down ul').addClass("collapse");
                this.$('.col-pull .push-down:first-child ul').removeClass("collapse");
                this.$('.push-down .email-form').addClass("collapse");
            },

            killMobileFooterMenu: function() {
                this.$(".push-down h3").attr("data-toggle", "");
                this.$('.push-down ul').removeClass("collapse");
                this.$('.push-down ul').removeAttr("style")
                this.$('.push-down .email-form').removeClass("collapse");
                this.$('.push-down .email-form').removeAttr("style")
            },

            toggleGlyphs: function(e) {
                if (this.version == 2) {
                    $(e.currentTarget).find(".glyphicon").toggleClass("glyphicon-chevron-up").toggleClass("glyphicon-chevron-down");
                }
            },

            reloadPage: function(e) {
                location.reload();
            }

        });

        // Returns the FooterView class
        return FooterView;

    }

);