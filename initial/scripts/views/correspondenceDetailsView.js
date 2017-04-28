// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/correspondenceDetails.html', 'collections/electronicAddressCollection', 'models/electronicAddressModel',
        'text!locale/en_us/correspondenceDetails.json', 'models/correspondenceModel', 'views/correspondenceCountryView', 'views/secondaryEmailListView'
    ],
    function($, jqueryui, Backbone, template, ElectronicAddressCollection, ElectronicAddressModel, content, CorrespondenceModel, CorrespondenceCountryView, SecondaryEmailListView) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var CorrespondenceDetailsView = Backbone.View.extend({

            model: '',
            markId: 0,
            initialize: function(attr) {
                this.model = attr.model;
                this.markId = attr.markId;
            },
            // View Event Handlers
            events: {
                "click #continueButton": "gotoReviewAndSignCover",
                "click #correspondenceCountry": "countryChanged",
                "click #addSecondaryEmail": "addSecondaryEmail",
                "click #addSecondaryEmailLink": "showSecondaryEmail",
                "click #previousPage": "previousPage",
                "click #saveButton": "saveCorrespondence"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            // Renders the view's template to the UI
            render: function() {
                // Secondary Email collection
                var self = this;
                self.template = _.template(template, {
                    content: this.model.toJSON()
                    //      emails:this.model.get('secondaryEmails')
                });
                // Dynamically updates the UI with the view's template
                self.$el.html(self.template);
                this.correspondenceCountryView = new CorrespondenceCountryView({
                    country: this.model.get('country')
                });
                this.$('#countryContainer').html(this.correspondenceCountryView.render().el);

                this.secondaryEmails = new SecondaryEmailListView({
                    collection: this.model.secondaryEmails
                });
                this.$('#secondaryEmailContainer').html(this.secondaryEmails.render().el);

                this.ModelBindAndValidation(this.model, this.$el);
                // Maintains chainability
                return this;
            },
            showSecondaryEmail: function(e){
                 console.log("addd");
                 $('#secondaryEmails').show();
            },
            countryChanged: function(e) {
                var country = e.currentTarget.value;
                this.correspondenceCountryView = new CorrespondenceCountryView({
                    country: country
                });
                this.$('#countryContainer').html(this.correspondenceCountryView.render().el);
                this.ModelBindAndValidation(this.model, this.$el);
            },
            addSecondaryEmail: function(e) {
                var electronicAddressModel = new ElectronicAddressModel({
                    text: $('#secondaryEmail').val(),
                    electronicType: 'EMAIL'

                });
                if (electronicAddressModel.isValid()) {
                    this.model.secondaryEmails.add(electronicAddressModel);
                    $('#secondaryEmail').val("");
                }
                this.secondaryEmails = new SecondaryEmailListView({
                    collection: this.model.secondaryEmails
                });
                this.$('#secondaryEmailContainer').html(this.secondaryEmails.render().el);
            },
            saveCorrespondence: function(e) {
                this.model.set('secondaryEmails',this.model.secondaryEmails);
                this.model.set('markId',this.markId);
                if (this.model.isValid(true)) {
                    this.model.save(null, {
                        wait: true,
                        success: function(model, response) {

                        },
                        error: function(model, response) {}
                    });
                    return false;
                }
            },
            gotoReviewAndSignCover: function(e){
                this.saveCorrespondence();
                var navString = '#reviewAndSignCover/' + this.markId;
                this.pageNavigator(navString, true);
            }
        });
        return CorrespondenceDetailsView;
    }
);