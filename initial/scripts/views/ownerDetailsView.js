// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'editable', 'views/entityTypesView', 'text!templates/ownerDetails.html', 
    'text!templates/entityTemplate.html','text!templates/countryTemplate.html',             
        'text!templates/stateUSTemplate.html','text!templates/stateNonUSTemplate.html', 'text!templates/mailAddress.html',
        'text!templates/mailAddressUSSection.html','text!templates/mailAddressNonUSSection.html', 'text!locale/en_us/ownerDetails.json'],

    function($, jqueryui, Backbone, Editable, EntityTypeView, template, entityType, countryTemplate, stateUSTemplate, stateNonUSTemplate, 
            mailAddressTemplate,mailAddressUSTemplate, mailAddressNonUSTemplate,content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var OwnerDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminPage: false,
            markId: '',
            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;
                this.markId = attrs.markId;
                
   
                
                this.otherStateUSTemplate = _.template(stateUSTemplate, { entityTypeValueSelected: "1",
                   name: "otherState", id:"otherState"                                                
                });
                
                this.otherStateNonUSTemplate = _.template(stateNonUSTemplate, { entityTypeValueSelected: "1",
                   name: "otherState", id:"otherState"                                                          
                });
                
                this.stateUSTemplate = _.template(stateUSTemplate, { entityTypeValueSelected: "1",
                   name: "state", id:"state"                                                
                });
                
                this.stateNonUSTemplate = _.template(stateNonUSTemplate, { entityTypeValueSelected: "1",
                   name: "state", id:"state"                                                          
                });
                
                this.mailAddressTemplate = _.template(mailAddressTemplate, {});
                this.mailAddressUSTemplate = _.template(mailAddressUSTemplate, {});
                this.mailAddressNonUSTemplate = _.template(mailAddressNonUSTemplate, {});
            },
            // View Event Handlers
            events: {
                "change #entityType": "showEntityTypeDetails",
                "change #country": "countryChanged",
                "change #otherNamesChxBox": "otherNameChxBoxSelected",
                "click #editButton": "editLabels",
                "click #previousPage": "previousPage",
                "click #ownerTypeRD1": "gotoOwnerDetailsIndividualView",
                "click #ownerTypeRD2": "gotoOwnerDetailsBusinessView",
                "change #ownerCountry" : "setEntityState",
                "change #applicantMailAddressCountry" : "setApplicantState",
                "change #otherState" : "onChangeOfOtherState"
            },

            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: this.model.toJSON()                    
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.loadResources();
     
                
      


                if (this.model.get('country') !== 'US') {
                    this.$('#state').prop('disabled', 'disabled');
                }
                

                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }
                
          
             

                // Maintains chainability
                return this;

            },

            gotoContactCover: function() {

                var navString = '#contactCover/' + this.markId;
                this.pageNavigator(navString, true);
            },
            
            loadResources: function() {
                var ROOT_URL = '/efile/rest/resource/ownerDetails';
                var self = this;
                $.ajax({
                    type: 'GET',
                    url: ROOT_URL,
                    dataType: "json",
                    async: true,
                    success: function(data) {
                        var count = data.length;
                        for (var i = 0; i < count; i++) {
                            $('a#' + data[i].resourceKey).text(data[i].resourceValue);
                            $('a#' + data[i].resourceKey).attr('data-pk', data[i].id);
                        }
                    },
                    error: function(jqXHR) {
                    }
                });
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

                var otherNameSelected = e.currentTarget.checked;
                if (otherNameSelected == true) {
                    document.getElementById('otherNamesContainer').style.display = "block";
                } else {
                    document.getElementById('otherNamesContainer').style.display = "none";
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

            },
            
            gotoOwnerDetailsIndividualView : function(evt) {
                console.log('markid:'+ this.model.markId+','+ this.markId);
                var str = '';
                if(this.markId != undefined) { 
                    str= '/markId/'+this.markId;
                }
                if(this.model.id != undefined) {
                    str += '/partyId/'+this.model.id
                }
                var navString = '#ownerDetailsIndividual'+str;
                this.pageNavigator(navString, true);
            },
            
             gotoOwnerDetailsBusinessView : function(evt) {
                 console.log('markid:'+ this.model.markId+','+ this.markId); 
                var str = '';
                if(this.markId != undefined) { 
                    str= '/markId/'+this.markId;
                }
                if(this.model.id != undefined) {
                    str += '/partyId/'+this.model.id
                }
                var navString = '#ownerDetailsBusiness'+str;
                this.pageNavigator(navString, true);
            },
            
              setEntityState : function(evt) {
                var stateDiv = $('#entityState div.controls');
                stateDiv.empty();
                var selectedCountry = $('#ownerCountry').val();
                $('#entityState').removeClass('hidden');
                if(selectedCountry === 'US')  {
                     stateDiv.html(this.otherStateUSTemplate);
 
                }
                else if(selectedCountry !== 'US' && selectedCountry !== '')  { 
                     stateDiv.html(this.otherStateNonUSTemplate);
                }
                else {
                     $('#entityState').addClass('hidden');
                }
               

            },
            
            setApplicantState : function(evt) {
               var selectedApplicantCountry = $('#applicantMailAddressCountry').val();
                if($('#mailAddressSection').length===0) {
                     $('#applicantCountry').after(this.mailAddressTemplate);
                     
                }
                else {
                    $('#buttonsDiv').remove();
                    $('#mailAddressSection').replaceWith(this.mailAddressTemplate);
                }
                var citySection = $('#city').closest('div.form-group');
                if(selectedApplicantCountry === 'US')  {
                   citySection.after(this.mailAddressUSTemplate);
                    $('#applicantState div.controls').html(this.stateUSTemplate);
                }
                else if(selectedApplicantCountry !== 'US' && selectedApplicantCountry !== '')  { 
                     citySection.after(this.mailAddressNonUSTemplate);
                }
                return false;
            },
            
            setupCountryPulldowns : function() {
                           
                this.entityCountryTemplate = _.template(countryTemplate, { 
                    name : "ownerCountry",  id : "ownerCountry"
                });
                
                this.applicantCountryTemplate = _.template(countryTemplate, { 
                    name : "country",  id : "applicantMailAddressCountry"
                });
  
                $('#entityCountry div.controls').empty().html(this.entityCountryTemplate);
                $('#applicantCountry div.controls').empty().html(this.applicantCountryTemplate);
            },
            
            onChangeOfOtherState : function(evt) {
            },
         
            //This function will navigate either to the profile page or the compare page based on whether 1 or more providers are selected.
            gotoCorrespondenceDetails: function() {
              var error = false;
            
            //have to manually set these form field values on the model, because, these fields 
            //are not present in the dom when the page is loaded.. they are dynamically added,
            //depending on user selection of applicant country field in mailing address section.  
            var self = this;
             $(':input').each(function() {
               
                 var type = $(this).get(0).tagName.toLowerCase();
                 if($(this).attr('type') !== undefined) {
                     type = $(this).attr('type');   
                 }
                 console.log("Name:"+$(this).attr('name')+",value:"+$(this).val()+",type:"+type);
                 if(type === 'radio' || type==='checkbox') {
                       if($(this).is(':checked')) {
                           self.model.set($(this).attr('name'), $(this).val());
                       }
                 }
                 else {
                        self.model.set($(this).attr('name'), $(this).val());
                 }
             });
       
                
              if(!error && this.model.isValid(true)){
                var self = this;
                this.model.save(null, {
                    success: _.bind(function (model, response) {
                        console.log("success : " + response);
                        var navString = '#ownerList/' + self.markId;
                        self.pageNavigator(navString, true);
                    },this),
                    error: function (model, response) {
                      if(response.status == 200) {
                        var navString = '#ownerList/' + self.markId;
                        self.pageNavigator(navString, true);
                      }else{
                        console.log("error");
                      }
                      
                    }
                });
                
                  //clear the fields.
              }

            },
            
            populatePage : function()  {
                 $('#mailAddressSection').empty();
                 $('#applicantMailAddressCountry').change();
                 if(this.model.id !== undefined && this.model.id !== null) {
                        var self = this;
                        $(':input').each(function() {
                         var type = $(this).get(0).tagName.toLowerCase();
                         if($(this).attr('type') !== undefined) {
                             type = $(this).attr('type');   
                         }
                         if(type === 'radio') {
                            if($(this).val() === self.model.get($(this).attr('name')) ) {    
                                    $(this).attr('checked', 'checked');
                            }
                         }
                         else {
                                   $(this).val(self.model.get($(this).attr('name')));   
                         }
                        });
                        $('input[name="otherNamesChxBox"]').click();
                        $("#entityType").change();
                        $("#ownerCountry").change();
                        $('#otherState').val(this.model.get('otherState'));

                }
            }
        });

        // Returns the OwnerDetailsView class
        return OwnerDetailsView;




    }
);
