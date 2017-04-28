define([
    'jquery',
    'backbone'
], function($, Backbone) {
    var DomesticRepModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/domesticrep',
        url: function() {
            var url = this.urlRoot;
            return url;
        },
        validation: {
            firstName: function(value) {
                var value = $('#firstName').val();
                if (value == undefined || value === '') {
                    return 'Attorney first Name is required.';
                }
                if (Backbone.Validation.patterns.rforeign.test(value)) {
                    return 'Attorney first Name cannot contain non-latin characters.';
                }

            },
            lastName: function(value) {
                var value = $('#lastName').val();
                if (value == undefined || value === '') {
                    return 'Attorney last Name is required.';
                }
                if (Backbone.Validation.patterns.rforeign.test(value)) {
                    return 'Attorney last Name cannot contain non-latin characters.';
                }
            },
            city: function(value) {
                var value = $('#city').val();
                if (value == undefined || value === '') {
                    return 'City is required';
                }
            },
            state: function(value) {
                var value = $('#state').val();
                if (value == undefined || value === '') {
                    return 'State is required.';
                }
            },
            zip: function(value) {
                var value = $('#zip').val();
                if (value == undefined || value === '') {
                    return 'Zip code is required.';
                }
                var pattern = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
                if (!pattern.test(value)) {
                    return 'Please enter valid zip code.';
                }
            },
            email: function(value) {
                var value = $('#email').val();
                if (value == undefined || value === '') {
                    if ($('#emailPermissionFlag').is(':checked')) {
                        return 'Please enter valid email address.';
                    } else {
                        return;
                    }
                }
                if (!Backbone.Validation.patterns.email.test(value)) {
                    return 'Please enter valid email address.';
                }
            },
            address1: function(value) {
                var value = $('#address1').val();
                if (value == undefined || value === '') {
                    return 'Address Line 1 is required';
                }
            },
            phone: function(value) {
                var value = $('#phone').val();
                if (value == undefined || value === '') {
                    return;
                }
                var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                if (!pattern.test(value)) {
                    return 'Phone Number should have the format: XXX-XXX-XXXX';
                }
            },
            fax: function(value) {
                var value = $('#fax').val();
                if (value == undefined || value === '') {
                    return;
                }
                var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                if (!pattern.test(value)) {
                    return 'Fax Number should have the format: XXX-XXX-XXXX';
                }
            },
            website: function(value) {
                var value = $('#website').val();
                if (value === undefined || value === '') {
                    return;
                }
                var pattern = /(http(s)?:\\)?([\w-]+\.)+[\w-]+[.com|.in|.org]+(\[\?%&=]*)?/;
                if (!pattern.test(value)) {
                    return 'Invalid website.';
                }
            }
        }
    });
    return DomesticRepModel;
});