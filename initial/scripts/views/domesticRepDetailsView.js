// DomesticRepDetailsView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/domesticRepDetails.html', 'models/domesticRepFillingModel'],
    function($, jqueryui, Backbone, template, DomesticRepFillingModel) {
        'use strict';

        //Create DomesticRepDetailsView class which extends Backbone.View
        var DomesticRepDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                // Calls the view's render method
                this.model = attr.model;
                this.markId = attr.markId;
            },
            // View Event Handlers
            events: {
                "click #drYes": "domRepSelected",
                "click #drNo": "domRepUnSelected",
                "click #continueButton": "continueButton",
                "click #previousPage": "previousPage"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                var utilityBarExists = true;
                this.template = _.template(template, {
                    content: this.model.toJSON()
                });
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);
                this.$('#confirmAttorney').hide();
                // Maintains chainability
                return this;
            },
            domRepUnSelected: function(e) {
                $('#confirmAttorney').hide();
            },
            domRepSelected: function(e) {
                var showDomRepSelected = e.currentTarget.checked;
                if (showDomRepSelected === true) {
                    if (!this.model.get('domesticRepFilingIn') && this.model.get('attorneyFilingIn')) {
                        $('#confirmAttorney').show();
                    }
                }
            },
            continueButton: function(e) {
                var domesticRepFillingModel = new DomesticRepFillingModel();
                domesticRepFillingModel.set('id', this.markId);
                if ($("label[for='drYes']").hasClass('checked') && this.model.get('domesticRepFilingIn')) {
                    var navString = '#domesticRepInfo/' + this.markId;
                    this.pageNavigator(navString, true);
                }
                if ($("label[for='drYes']").hasClass('checked') && !this.model.get('domesticRepFilingIn')) {
                    if ($("label[for='attorneyYes']").hasClass('checked')) {
                        console.log("attorney");
                        var navString = '#domesticRepInfo/' + this.markId + '?attorney=true';
                        this.pageNavigator(navString, true);
                    }
                    if ($("label[for='attorneyNo']").hasClass('checked')) {
                        var navString = '#domesticRepInfo/' + this.markId + '?attorney=false';
                        this.pageNavigator(navString, true);
                    }
                }
                if ($("label[for='drNo']").hasClass('checked')) {
                    domesticRepFillingModel.destroy({
                        success: function(model, response) {

                        },
                        error: function(model, response) {

                        }
                    });
                    var navString = '#correspondenceDetails/' + this.markId;
                    this.pageNavigator(navString, true);
                }
            }

        });

        return DomesticRepDetailsView;
    });