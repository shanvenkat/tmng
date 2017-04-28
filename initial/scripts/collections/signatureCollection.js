define([
    'jquery',
    'backbone',
    'models/signatureModel'
], function($, Backbone, SignatureModel) {
    'use strict';
    var SignatureCollection = Backbone.Collection.extend({
        model: SignatureModel,
        averments:"",
        url: function() {
            return '/efile/rest/tmsignature';
        },
        parse: function(response) {
                    var attrs;
                    this.averments = response.averments;

                    return attrs = response.signatureInfoFormList;
         },
        save: function(markId) {
            if (this.length === 0) {
                var urlStr = '/efile/rest/tmsignature/' + markId;
                $.ajax({
                    url: urlStr,
                    type: 'DELETE',
                    dataType: "json",
                    success: function(resp, status, xhr) {
                        $('#signError').html(resp.value);
                    },
                    error: function(resp, status, xhr) {
                        $('#signError').html(resp.value);
                    }
                });
            } else {
                Backbone.sync('create', this, {
                    success: function(resp, status, xhr) {
                         $('#signError').html(resp.value);
                    },
                    error: function(resp, status, xhr) {
                         $('#signError').html(resp.responseJSON.value);
                    }
                });
            }
        }
    });
    return SignatureCollection;
});