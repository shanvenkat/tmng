define(['jquery', 'jqueryui', 'backbone', 'text!templates/entityTemplate.html', 'text!locale/en_us/entityType.json', 'text!templates/countryTemplate.html', 
    'text!templates/stateUSTemplate.html', 'text!templates/stateNonUSTemplate.html', 'text!templates/entityDependentTemplate.html','text!models/otherPartnerModel.js'],
    function($, jqueryui, Backbone, template, content, countryTemplate, StateUSTemplate, StateNonUSTemplate,  
        EntityDependentTemplate,OtherPartnerModel) {
        'use strict';
        //Create SearchView class which extends Backbone.View
        var EntityTypeView = Backbone.View.extend({
            // The DOM Element associated with this view
            el: '#entityTypeContainer',
            // View constructor
            initialize: function() {
                this.render();
                
            },
            // View Event Handlers
            events: {
                "change #ownerCountry": "countrySelected",
                "click #addAnotherPartner": "addAnotherPartner",
                "click #previousPage": "previousPage"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;


                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    //content: JSON.parse(content),
                    entityTypeValueSelected: self.model

                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                this.countryTemplate = _.template(countryTemplate, {
                     id: "entityTypeCountry", name : "entityTypeCountry"
                });

                this.$('#countryContainer').append(this.countryTemplate);
                
                // Maintains chainability
                return this;
            },

            countrySelected: function(e) {
                var selectedcountry = $('#ownerCountry').val();
                
                var selectedentity = this.model;

                // Appending state template
                this.stateNonUSTemplate = _.template(StateNonUSTemplate, {
                    entityTypeValueSelected: selectedentity
                });

                 this.stateUSTemplate = _.template(StateUSTemplate, {
                    entityTypeValueSelected: selectedentity

                });

                //initialize a new view for Name & Type
                this.countryBasedTemplate = _.template(EntityDependentTemplate, {
                    entityTypeValueSelected: selectedentity
                    //index:0,
                    //model:new OtherPartnerModel()
                });

                if (selectedcountry === 'US') {
                   alert(selectedcountry);
                        this.$('#stateContainer').html(this.stateUSTemplate);
                        if (selectedentity !== "3" || selectedentity !== "16") {
                            this.$('#countryDependentContainer').html(this.countryBasedTemplate);
                        }
                    
                } else {
                    this.$('#stateContainer').html(this.stateNonUSTemplate);
                    this.$('#countryDependentContainer').html(this.countryBasedTemplate);
                }
            },
            addAnotherPartner:function(){
                var otherPartnerIndex = $("#otherPartnerIndex").val();

                this.otherPartnerContent = _.template(EntityDependentTemplate, {
                    index:$("#otherPartnerIndex").val(),
                    model:new OtherPartnerTemplate({})
                });
                this.$('#otherPartnerContainer').append(this.otherPartnerContent);
                $("#otherPartnerIndex").val(Number(otherPartnerIndex+1));
            }
        });
        // Returns the MarkDetailsView class
        return EntityTypeView;
    });
