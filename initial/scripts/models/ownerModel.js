define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var OwnerModel = Backbone.Model.extend({
            rforeign:  /[^\u0000-\u007f]/,
            url: function(){
                console.log('here in OwnerModel urlRoot');
                if(this.isNew()){
                   console.log('here in OwnerModel urlRoot isNew');
                    return '/efile/rest/owner';
                }else {
                    return '/efile/rest/owner/mark/'+this.get('markId')+'/partyId/'+this.get('id');
                }
            },
            defaults: {
               markId:'',
               firstName:'',
               lastName:'',
               middleName: '',
               suffix:'',
               entityType : '',
               address1: '',
               address2: '',
               address3: '',
               country: 'US',
               city: '',
               state: '',
               zip: '',
               phone: '',
               fax: '',
               email: '',
               website: '',
               doingbusinessAs: '',
               alsoKnownAs: '',
               tradingAs: '',
               formerlyKnownAs: '',
               ownerCountry: '',
               docketNumber: '',
               firmName: '',
               otherEntityType: '',
               otherEntityTypeValue: '',
               otherState: ''
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            destroy: function(){
                var isDeleted = false;
                var url = this.url();
                $.ajax({
                    url: url,
                    async: false,
                    type: 'DELETE',
                    success:function () {
                          isDeleted = true;
                    },
                    error: function(response, error){
                        alert("Error while deleting the owner.");

                    }
                });
                return isDeleted;
            },
            validation: {
                firstName : function(value){
                  if ( $('#ownerTypeRD1').is(':checked')) {   
                      console.log('validating first name');
                      var value = $('input[name="firstName"]').val();
                      if (value == undefined || value === '') {
                        return 'First Name is required.';
                      }
                      if ( this.rforeign.test(value)) {
                        return 'First Name cannot contain non-latin characters.';
                      }
                  }
                },
                lastName : function(value){
                  if ( $('#ownerTypeRD1').is(':checked')) {     
                      var value = $('input[name="lastName"]').val();
                      if (value == undefined || value === '') {
                        return 'Last Name is required.';
                      }
                      if ( this.rforeign.test(value)) {
                        return 'Last Name cannot contain non-latin characters.';
                      }
                  }
                },
                markOwner : function(value){
                  if ( $('#ownerTypeRD2').is(':checked')) {     
                      var value = $('input[name="markOwner"]').val();
                      if (value == undefined || value === '') {
                        return 'Legal Business Name is required.';
                      }
                      if ( this.rforeign.test(value)) {
                        return 'Legal Business Name cannot contain non-latin characters.';
                      }
                  }
                },
                ownerCountry : function(value){
                      var value = $('#ownerCountry').val();
                      if (value == undefined || value === '') {
                        if ( $('#ownerTypeRD1').is(':checked')) {   
                        return 'Country of Citizenship is required.';
                        }
                        if ( $('#ownerTypeRD2').is(':checked')) {   
                        return 'In what country is the business legally organized?  is required.';
                        }  
                      }
                },
                entityType : function(value){
                      var value = $('#entityType').val();
                      if (value == undefined || value === '') {
                        if ( $('#ownerTypeRD2').is(':checked')) {   
                        return 'What type of entity is applying for the trademark (sole proprietor, corporation, etc.)?   is required.';
                        }  
                      }
                },
                
                docketNumber: function(value) {
                  var value = $('#docketNumber').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  if ( this.rforeign.test(value)) {
                    return 'Internal Docket Number cannot contain non-latin characters.';
                  }
                },
                doingbusinessAs: function(value) {
                  var value = $('#doingbusinessAs').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  if ( this.rforeign.test(value)) {
                    return 'Doing business as cannot contain non-latin characters.';
                  }
                },
                alsoKnownAs: function(value) {
                  var value = $('#alsoKnownAs').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  if ( this.rforeign.test(value)) {
                    return 'Also known as cannot contain non-latin characters.';
                  }
                },
                tradingAs: function(value) {
                  var value = $('#tradingAs').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  if ( this.rforeign.test(value)) {
                    return 'Trading as cannot contain non-latin characters.';
                  }
                },
                formerlyKnownAs: function(value) {
                  var value = $('#formerlyKnownAs').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  if ( this.rforeign.test(value)) {
                    return 'Formaly known as cannot contain non-latin characters.';
                  }
                },
              
                address1 : function(value) {
                  var value = $('#address1').val();
                  if ( value == undefined || value === '') {
                    return 'Address Line 1 is required';
                  }
                },
                city :function(value) {
                  console.log(" city value befre: " + value); 
                  var value = $('#city').val();
                  console.log("value after: " +value);
                  if ( value == undefined || value === '') {
                    return 'City is required';
                  }
                },
                zip : function(value) {
                  var value = $('#zip').val();
                  if ( value == undefined || value === '') {
                    return 'Zip is required';
                  }
                },
                country : function(value) {
                  var value = $('#applicantMailAddressCountry').val();
                  if ( value == undefined || value === '') {
                    return 'Country is required';
                  }
                },
                state: function(value) {
                  var value = $('#state').val();
                  var country = $('#applicantMailAddressCountry').val();
                  if ( country === 'US' && (value == undefined || value === '')) {
                    return 'State is required';
                  }
                },
                phone: function(value){
                  var value = $('#phone').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                  if  ( !pattern.test(value)) {
                    return 'Phone Number should have the format: XXX-XXX-XXXX';
                  }
                },
                fax: function(value){
                  var value = $('#fax').val();
                  if ( value == undefined || value === '') {
                    return;
                  }
                  var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                  if  ( !pattern.test(value)) {
                    return 'Fax Number should have the format: XXX-XXX-XXXX';
                  }
                },
                website: function(value){
                  var value = $('#website').val();
                  if ( value === undefined || value === '') {
                    return;
                  }
                  var pattern = /(http(s)?:\\)?([\w-]+\.)+[\w-]+[.com|.in|.org]+(\[\?%&=]*)?/;
                  if  ( !pattern.test(value)) {
                    return 'Invalid website.';
                  }
                }


            }
       
    });
    return OwnerModel;


});