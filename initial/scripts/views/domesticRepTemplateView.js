// DomesticRepTemplateView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/domesticRepTemplate.html', 'models/domesticRepModel'],
    function($, jqueryui, Backbone, template, DomesticRepModel) {
        'use strict';
        //Create DomesticRepTemplateView class which extends Backbone.View
        var DomesticRepTemplateView = Backbone.View.extend({
            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.model = attr.model;
                this.markId = attr.markId;
            },
            // View Event Handlers
            events: {
                "click #emailPermissionFlag": "isEmailPermitted",
                "click #saveButton": "saveDomesticRep",
                "click #continueButton": "continueButton",
                "click #previousPage": "previousPage"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                console.log(this.model);
                var utilityBarExists = true;
                if(!this.model){
                   this.model=new DomesticRepModel();
                }
                this.model.fetch({
                        data: {
                            markId: this.markId,
                            attorneyIn: "" + this.model.get('attorneyIn')
                        },
                        async: false
                });

                this.model.set('country','US');
                this.template = _.template(template, {
                    content: this.model.toJSON()
                });
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);
                // Dynamically updates the UI with the view's template
                // Maintains chainability
                return this;
            },
            isEmailPermitted: function() {
                if ($("#emailPermissionFlag").is(":checked")) {
                    this.model.set("emailPermissionFlag", true);
                } else {
                    this.model.set("emailPermissionFlag", false);
                }
            },
            saveDomesticRep: function() {
                this.model.set('markId',this.markId);
                if (this.model.isValid(true)) {
                    this.model.save(null, {
                        wait: true,
                        success: function(model, response) {},
                        error: function(model, response) {}
                    });
                    return false;
                }
            },
            continueButton: function(e) {
                 this.saveDomesticRep();
                 var navString = '#correspondenceDetails/' + this.markId;
                 this.pageNavigator(navString, true);
            }
        });
        return DomesticRepTemplateView;
    }
);