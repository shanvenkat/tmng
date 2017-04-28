define([
    'jquery',
    'backbone',
    'models/ownerModel'
], function($, Backbone, ownerModel) {
    'use strict';
    var OwnerCollection = Backbone.Collection.extend({
        model: ownerModel,
        url: function() {
            if ( this.id ) {
                return '/efile/rest/owner' + this.id;
            } else {
                console.log("else");
                return '/efile/rest/owner';
            }
            
        }
        /*parse: function(response) {
            var results = [],
                that = this;
            if (response instanceof Array) {
                results = response;
            } else {
                results = response.MarkResult;
                this.totalCount = response.recordcount;
            }
            _.each(results, function(mark) {
                var markModel = new markModel({
                    mark: mark
                });
                that.push(markModel);
            });

            return this.models;
        }*/
    });

    return OwnerCollection;

});