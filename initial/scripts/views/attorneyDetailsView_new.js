// AttorneyDetailsView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/attorneyDetails_new.html',
        'models/attorneyFillingModel'
    ],
    function($, jqueryui, Backbone, template, AttorneyFillingModel) {
        'use strict';
        //Create AttorneyDetailsView class which extends Backbone.View
        var AttorneyDetailsView = Backbone.View.extend({
            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.collection = this.collection;
                this.markId = attr.markId;
            },
            // View Event Handlers
            events: {
                //    "change input[name=attorneyFillingIn]": "attorneySelected",
                "click #continueButton": "continueButton",
                "click #saveButton": "saveStatus",
                "click #previousPage": "previousPage",
                "click #confirm": "confirmNextPage",
                "click #cancel": "cancelNextPage"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            confirmNextPage: function(e) {
                this.saveAttorneyFillingInfo();
                this.showDrOrCo();
            },
            cancelNextPage: function(e) {
                $('#deletedAttorneyWarn').hide();
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                var utilityBarExists = true;
                var attorneyFillingIn = false;
                if (this.collection.size() > 0) {
                    attorneyFillingIn = true;
                }
                this.model = new AttorneyFillingModel();
                this.model.set("attorneyFillingIn", attorneyFillingIn);
                this.model.set("tradeMarkId", this.markId);
                this.template = _.template(template, {
                    content: this.model.toJSON()
                });
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);
                // Maintains chainability
                return this;
            },
            continueButton: function(e) {
                var self = this;
                if ($("label[for='attorneyYes']").hasClass('checked')) {
                    this.model.set("attorneyFillingIn", true);
                    this.saveAttorneyFillingInfo();
                    var navString = '#attorneyInfo/' + this.markId;
                    this.pageNavigator(navString, true);

                }
                if ($("label[for='attorneyNo']").hasClass('checked')) {
                    this.model.set("attorneyFillingIn", false);
                    $('#deletedAttorneyWarn').show();
                }
            },
            saveAttorneyFillingInfo: function() {
                this.model.save(null, {
                        wait: true,
                        success: function(model, response) {

                        },
                        error: function(model, response) {}

                });
            },
            showDrOrCo: function() {
                var self = this;
                $.ajax({
                    type: 'GET',
                    async: true,
                    url: "/efile/rest/domesticrep/" + this.markId,
                    success: function(data) {
                        if (data) {
                            var navString = '#domesticRepDetails/' + self.markId;
                            self.pageNavigator(navString, true);
                        } else {
                            var navString = '#correspondenceDetails/' + self.markId;
                            self.pageNavigator(navString, true);
                        }
                    },
                    error: function() {
                        alert("error");
                    }
                });
            }
        });
        return AttorneyDetailsView;
    });