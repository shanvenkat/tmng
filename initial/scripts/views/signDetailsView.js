// SignDetailsView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/signatureModel', 'views/signTypesView', 'text!templates/signDetails.html', 'collections/signatureCollection'],

    function($, jqueryui, Backbone, SignatureModel, SignTypeView, template, SignatureCollection) {
        'use strict';
        //Create SignDetailsView class which extends Backbone.View
        var SignDetailsView = Backbone.View.extend({
            // The DOM Element associated with this view
            model: '',
            adminPage: false,
            markId: '',
            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;
                this.markId = attrs.markId;
                this.collection = new SignatureCollection();
                if (this.markId) {
                    this.collection.fetch({
                        data: {
                            markId: this.markId
                        },
                        processData: true,
                        async: false
                    });
                }
            },
            // View Event Handlers
            events: {
                "click input[name=signType]": "showSignTypeDetails",
                'click #continueButton': 'gotoSignDetail',
                'click #saveSignButton': 'saveSignature',
                'click #confirm': 'confirmNextPage',
                'click #cancel': 'cancelNextPage'
            },

            // Renders the view's template to the UI
            render: function() {
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template);

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                //checking if this is admin view
                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;
            },
            confirmNextPage: function(e) {
                var navString = '#'
                this.pageNavigator(navString, true);

            },
            cancelNextPage: function(e){
              $('#unsignWarningCon').hide();
            },
            gotoSignDetail: function(e) {
                if ($('#electronicSign').is(':checked')) {
                    if (this.collection.size() === 0) {
                        $('#unsignWarning').hide();
                        $('#unsignWarningCon').show();
                    } else {
                        this.collection.save();
                    }
                }
                if ($('#unSign').is(':checked')) {
                    this.collection.reset();
                    this.collection.save(this.markId);
                    $('#unsignWarning').hide();
                    $('#unsignWarningCon').show();
                }
            },
            showSignTypeDetails: function(evt) {
                var signTypeValueSelected = $(evt.currentTarget).val();
                if (this.signTypeView == null) {
                    var signature = new SignatureModel({
                        markId: this.markId
                    });
                    this.signTypeView = new SignTypeView({
                        model: signature,
                        collection: this.collection,
                        markId: this.markId,
                        signTypeValueSelected: signTypeValueSelected
                    });
                } else {
                    this.signTypeView.signTypeValueSelected = signTypeValueSelected;
                }
                this.signTypeView.render();
            },
            saveSignature: function(e) {
                if ($('#electronicSign').is(':checked')) {
                    if (this.collection.size() === 0) {
                        $('#unsignWarningCon').hide();
                        $('#unsignWarning').show();
                    } else {
                        this.collection.save();
                    }
                }
                if ($('#unSign').is(':checked')) {
                    this.collection.reset();
                    this.collection.save(this.markId);
                    $('#unsignWarningCon').hide();
                    $('#unsignWarning').show();
                }
            }
        });

        // Returns the SignDetailsView class
        return SignDetailsView;
    }
);