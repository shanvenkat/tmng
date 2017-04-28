define([
    'jquery',
    'backbone'
], function($, Backbone) {
    var AttorneyModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/attorney',
        url: function() {
            var url = this.urlRoot;
            return url;
        },
        defaults: {
           markId:''
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
            country: function(value) {
                var value = $('#country').val();
                if (value == undefined || value === '') {
                    return 'Country is required';
                }
            },
            city: function(value) {
                var value = $('#city').val();
                if (value == undefined || value === '') {
                    return 'City is required';
                }
            },
            state: function(value) {
                var country = $('#country').val();
                if (country === 'US') {
                    var value = $('#state').val();
                    if (value == undefined || value === '') {
                        return 'State is required.';
                    }

                }

            },
            zip: function(value) {
                var country = $('#country').val();
                if (country === 'US') {
                    var value = $('#zip').val();
                    if (value == undefined || value === '') {
                        return 'Zip code is required.';
                    }
                    var pattern = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
                    if (!pattern.test(value)) {
                        return 'Please enter valid zip code.';
                    }
                } else {
                    var value = $('#foreignZip').val();
                    if (value == undefined || value === '') {
                        return 'Postal code is required.';
                    }
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
                var country = $('#country').val();
                if (country === 'US') {
                    var value = $('#phone').val();
                    if (value == undefined || value === '') {
                        return;
                    }
                    var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                    if (!pattern.test(value)) {
                        return 'Phone Number should have the format: XXX-XXX-XXXX';
                    }
                }
            },
            fax: function(value) {
                var country = $('#country').val();
                if (country === 'US') {
                    var value = $('#fax').val();
                    if (value == undefined || value === '') {
                        return;
                    }
                    var pattern = /^\(?[\d\s]{3}-[\d\s]{3}-[\d\s]{4}$/;
                    if (!pattern.test(value)) {
                        return 'Fax Number should have the format: XXX-XXX-XXXX';
                    }
                }
            },
            website: function(value) {
                var value = $('#websiteAddress').val();
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
    return AttorneyModel;
});