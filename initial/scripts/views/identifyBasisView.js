// BasisDetailsView
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/identifyBasis.html'],

    function($, jqueryui, Backbone, template) {
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
                this.model = attrs.model;
                this.markId = this.model.get('markId');
            },

            // View Event Handlers
            events: {
                "click input[name=basisType]": "assignBases",
                "click #continueButton": "gotoBasisDetails",
                "click #previousPage": "previousPage",
                "click #saveButton": "saveBasisType"
            },

            previousPage: function() {
                Backbone.history.history.back();
            },
            assignBases: function(evt) {
                this.model.set('basisType', $(evt.currentTarget).val());
                this.ModelBindAndValidation(this.model, this.$el);
                console.log(this.model.get('basisType'));
                if (this.model.get('basisType') === '1(b)') {
                    this.$('#conformationForIb').show();
                    this.loadResources();
                } else {
                    this.$('#conformationForIb').hide();
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

                console.log(this.model.get('basisType'));

                if (this.model.get('basisType') === '1(b)') {
                    this.$('#conformationForIb').show();
                    this.loadResources();
                } else {
                    this.$('#conformationForIb').hide();
                }
                //checking if this is admin view
                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;

            },
            saveBasisType: function() {
                if (this.model.get('basisType') === 'noBasis') {
                    $.ajax({
                        type: 'DELETE',
                        url: '../efile/rest/basis/' + this.markId,
                        async: true,
                        dataType: "json",
                        success: function(data) {

                        },
                        error: function(jqXHR) {
                        }
                    });
                }

                this.model.save(null, {
                    wait: true,
                    success: function(model, response) {

                    },
                    error: function(model, response) {
                        console.log("error");
                    }
                });


            },
            loadResources: function() {
                var ROOT_URL = '/efile/rest/resource/identifyBasis';
                var self = this;
                $.ajax({
                    type: 'GET',
                    url: ROOT_URL,
                    dataType: "json",
                    async: true,
                    success: function(data) {
                        var count = data.length;
                        for (var i = 0; i < count; i++) {
                            console.log($('#' + data[i].resourceKey));
                            $('#' + data[i].resourceKey).html(data[i].resourceValue);
                        }
                    },
                    error: function(jqXHR) {
                    }
                });
            },
            gotoBasisDetails: function(e) {
                this.saveBasisType();
                if (this.model.get('basisType') === '1(b)' && $('#new1').is(':checked')) {
                    var navString = '#basisDetails'
                    if (this.markId != undefined) {
                        navString += '/' + this.markId;
                    }
                    this.pageNavigator(navString, true);
                }
                console.log($('#new1').is(':checked'));
                if (this.model.get('basisType') === '1(b)' && !$('#new1').is(':checked')) {
                    $('#identifyBasisError').html("Please check the checkbox.");
                }
                if (this.model.get('basisType') === 'noBasis') {
                    this.pageNavigator('#goodsStatements/' + this.markId, true);
                }
            }
        });

        // Returns the BasisDetailsView class
        return BasisDetailsView;
    }
);