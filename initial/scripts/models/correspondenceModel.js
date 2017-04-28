define([
    'jquery',
    'backbone',
    'collections/electronicAddressCollection'
], function($, Backbone, ElectronicAddressCollection) {
    var errors;
    var CorrespondenceModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/correspondence',
        url: function() {
            var url = this.urlRoot;
            return url;
        },
        secondaryEmails:'',
        defaults: {
            secondaryEmails: new ElectronicAddressCollection()
        },
        parse: function(response) {
            this.secondaryEmails = new ElectronicAddressCollection(response.secondaryEmails);
            return response;
        },
        validation: {
            correspondenceName: function(value) {
                var value = $('input[name="correspondenceName"]').val();
                if (value == undefined || value === '') {
                    return 'CorrespondenceName Name is required.';
                }
            },
            country: function(value) {
                var value = $('#correspondenceCountry').val();
                if (value == undefined || value === '') {
                    return 'Country is required';
                }
            },
            city: function(value) {
                var value = $('#correspondenceCity').val();
                if (value == undefined || value === '') {
                    return 'City is required';
                }
            },
            zip: function(value) {
                var country = $('#correspondenceCountry').val();
                if (country === 'US') {
                    var value = $('#correspondenceZip').val();
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
                var value = $('#correspondenceEmail').val();
                if (value == undefined || value === '') {
                    if ($('#correspondenceEmailPermissionFlag').is(':checked')) {
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
                var value = $('#correspondenceAddress1').val();
                if (value == undefined || value === '') {
                    return 'Address Line 1 is required';
                }
            },
            phone: function(value) {
                var country = $('#correspondenceCountry').val();
                if (country === 'US') {
                    var value = $('#correspondencePhone').val();
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
                var country = $('#correspondenceCountry').val();
                if (country === 'US') {
                    var value = $('#correspondenceFax').val();
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
                var value = $('#correspondenceWebsiteAddress').val();
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
    return CorrespondenceModel;
});