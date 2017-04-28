define([
    'jquery',
    'backbone'
], function($, Backbone) {
    var ElectronicAddressModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/attorney',
        defaults: {
            text: '',
            electronicType: ''
        },
        validate: function(attrs) {
            var emailPattern = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (!attrs.text) {
                $('#emailError').text('email is required.');
                return "email is required.";
            }
            if(!emailPattern.test(attrs.text)){
                $('#emailError').text('please enter the valid email address.');
                return "please enter the valid email address";
            }
        }

    });
    return ElectronicAddressModel;
});