// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'editable', 'views/entityTypesView', 'views/ownerDetailsView',  'text!templates/ownerDetailsBusiness.html', 
    'text!templates/entityTemplate.html', 'text!locale/en_us/ownerDetails.json'],

    function($, jqueryui, Backbone, Editable, EntityTypeView, OwnerDetailsView, template, entityType, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var OwnerDetailsBusinessView = OwnerDetailsView.extend({

            // The DOM Element associated with this view
            el: '#individualOrCompanyView',
            model: '',
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
                "click input[name=otherNamesChxBox]": "otherNameChxBoxSelected",
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
                     

                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }

                this.$('#otherNamesContainer').hide();
                
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

           
            //On change event for entityType dropdown
            showEntityTypeDetails: function(evt) {
                var entityTypeValueSelected = $(evt.currentTarget).val();
                var entityTypeView = new EntityTypeView({
                    model: entityTypeValueSelected

                });

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

                var otherNameSelected = $(e.currentTarget).val();


                 if (otherNameSelected === 'true') {
                     $('#otherNamesContainer').show();
                 } else {
                     $('#otherNamesContainer').hide();
                 }

            },
            editLabels: function() {
                var pageName='ownerDetails';
                var labelModule='label';
                var ROOT_URL= '/efile/rest/resource/save';

                $.fn.editable.defaults.ajaxOptions = {type: "post", contentType: 'application/json', dataType: 'json'}

                $('.editable').editable({
                          validate: function(value) {
                            if($.trim(value) == '') return 'This field is required';
                          },
                          url: ROOT_URL,
                          params: function(params) {
                             var resourceKey = $(this).attr("id");
                             var data = {};
                             data['id']=params.pk;
                             data['resourceKey'] = resourceKey;
                             data['resourceValue'] = params.value;
                             data['moduleName'] = labelModule;
                             data['pageName']=pageName;
                             console.log(JSON.stringify(data));
                             return JSON.stringify(data);
                          },
                          success: function(response, newValue) {
                            console.log("success");
                            console.log(response);
                            console.log(newValue);
                          }

               });

            }

        });

        // Returns the OwnerDetailsView class
        return OwnerDetailsBusinessView;




    }
);
