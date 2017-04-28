define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var OtherPartnerModel = Backbone.Model.extend({
        defaults: {
            partnerName:'',
            partnerEntityType:'',
            partnerCitizenship:''
        }
       /* validation: {
            email: function (value) {
                var value = $('#email').val();
                if (value == undefined || value === '') {
                    return 'email is required';
                }
                if (!Backbone.Validation.patterns.email.test(value)) {
                    return 'Please enter valid email address.';
                }
            }
        }*/
    });
    return OtherPartnerModel;


});