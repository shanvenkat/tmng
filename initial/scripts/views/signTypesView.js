define(['jquery', 'jqueryui', 'backbone', 'models/signatureModel', 'views/signListView', 'text!templates/signTypeTemplate.html', 'text!locale/en_us/signType.json', 'collections/signatureCollection'],

    function($, jqueryui, Backbone, SignatureModel, SignListView, template, content, SignatureCollection) {
        'use strict';

        //Create SignTypeView class which extends Backbone.View
        var SignTypeView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: '#signTypeContainer',
            signTypeValueSelected: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.signTypeValueSelected = attr.signTypeValueSelected;
                this.markId = attr.markId;
                this.collection = attr.collection;
                this.averments=this.collection.averments;
            },
            // View Event Handlers
            events: {
                "click #addSignatory": "addAnotherSignatory"
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: this.model.toJSON(),
                    signTypeValueSelected: this.signTypeValueSelected
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                $("#averments").html(this.averments);

                this.signListView = new SignListView({
                    collection: this.collection
                });
                this.signListView.render();

                this.ModelBindAndValidation(this.model, this.$el);

                this.model.bind('change', function() {
                    console.log('Model changed!');
                });

                // Maintains chainability
                return this;

            },
            addAnotherSignatory: function() {
                console.log("Adding Another Signature...");
                if (this.model.isValid(true)) {
                    var signature = new SignatureModel({
                        markId: this.markId,
                        signature: this.model.get('signature'),
                        signatoryName: this.model.get('signatoryName'),
                        signatoryPhoneNumber: this.model.get('signatoryPhoneNumber'),
                        signatoryPosition: this.model.get('signatoryPosition'),
                        signingDt: this.model.get('signingDt')
                    });
                    this.collection.add(signature);
                    this.model.clear();
                    this.model.set({signingDt: moment().format("YYYY-MM-DD")});
                }
            }
        });
        // Returns the SignTypeView class
        return SignTypeView;
    }
);