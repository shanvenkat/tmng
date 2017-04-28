define([
    'jquery',
    'backbone',
    'moment'
], function($, Backbone, moment) {

    var SignatureModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/tmsignature',
        url: function() {
            var url = this.urlRoot;
            return url;
        },
        defaults: {
            signingDt: moment().format("YYYY-MM-DD")
        },
        validation: {
            signature: function(value) {
                var value = $('#signature').val();
                if (value == undefined || value === '') {
                    return 'Signature is required.';
                }
                if (!value.match("^\/.+\/$")) {
                    return 'Signature does not contain two forward slashes with at least one alpha/numeric between the slashes.'
                }
                return;
            },
            signatoryName: function(value) {
                var value = $('#signatoryName').val();
                if (value == undefined || value === '') {
                    return "Signatory's name is required.";
                }
                return;
            },
            signatoryPhoneNumber: function(value) {
                var value = $('#signatoryPhoneNumber').val();
                if (value == undefined || value === '') {
                    return;
                }
                if (!Backbone.Validation.patterns.phone.test(value)) {
                    return 'Phone Number should have the format: XXX-XXX-XXXX';
                }
            },
            signatoryPosition: function(value) {
                var value = $('#signatoryPosition').val();
                if (value == undefined || value === '') {
                    return "Signatory's position is required.";
                }
                return;
            },
            signingDt: function(value) {
                var value = $('#signingDt').val();
                if (value == undefined || value === '') {
                    return "Signing date is required.";
                }
                if (!moment(value, ["YYYY-MM-DD"], true).isValid()) {
                    return "please enter the valid date";
                }
                var today = moment();
                var aDate = moment(value);
                var diffInDays = aDate.diff(today, 'days');
                if (diffInDays > 0) {
                    alert("Warning: The date in the Date Signed field is equal to or greater than one day after the current date!");
                    return;
                }
                if (diffInDays < 0) {
                    alert("Warning: The date in the Date Signed field is earlier than the current date!");
                    return;
                }
            }
        },
        parse: function(data) {
            if (data) {
                return data;
            }
        }
    });
    return SignatureModel;
});