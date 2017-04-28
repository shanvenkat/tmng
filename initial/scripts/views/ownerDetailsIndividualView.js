// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'editable', 'views/entityTypesView', 'views/ownerDetailsView', 
        'text!templates/ownerDetailsIndividual.html', 
        'text!templates/entityTemplate.html', 'text!locale/en_us/ownerDetails.json'],

    function($, jqueryui, Backbone, Editable, EntityTypeView, OwnerDetailsView,template, entityType, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var OwnerDetailsIndividualView = OwnerDetailsView.extend({

            // The DOM Element associated with this view
            el: '#individualOrCompanyView',
            adminPage: false,
            markId: '',
            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;
                this.markId = attrs.markId;
                this.listenTo(this.model,"change", this.onChangeOfOtherState);
            },
            // View Event Handlers
            events: {
                'click #continueButton': 'gotoCorrespondenceDetails',
                //adding this button just for testing purposes and create the whole flow of the pages
                'click #continueButton1': 'gotoContactCover',
                "change #entityType": "showEntityTypeDetails",
                "change #country": "countryChanged",
                "change #otherNamesChxBox": "otherNameChxBoxSelected",
                "click #editButton": "editLabels",
                "click #previousPage": "previousPage"
            },

            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {                    
                });
            
                
                // Dynamically updates the UI with the view's template
                this.$el.empty().html(this.template);
                
                this.setupCountryPulldowns();
                 this.ModelBindAndValidation(this.model, this.$el);
                
                
                this.populatePage();
                
                // Maintains chainability
                return this;

            },

            gotoContactCover: function() {

                var navString = '#contactCover/' + this.markId;
                this.pageNavigator(navString, true);
            },

            
            countryChanged: function(e) {
                var country = e.currentTarget.value;
                if (country !== "US") {
                    $('#state').prop('disabled', 'disabled');
                } else {
                    $('#state').removeAttr('disabled');
                }
            },
            //On check event for dom rep address
            otherNameChxBoxSelected: function(e) {

                var otherNameSelected = e.currentTarget.checked;
                if (otherNameSelected == true) {
                    document.getElementById('otherNamesContainer').style.display = "block";
                } else {
                    document.getElementById('otherNamesContainer').style.display = "none";
                }

            }
        });

        // Returns the OwnerDetailsView class
        return OwnerDetailsIndividualView;




    }
);
