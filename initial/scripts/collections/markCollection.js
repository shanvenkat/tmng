define([
    'jquery',
    'backbone',
    'models/markModel'
], function($, Backbone, markModel) {
    'use strict';
    var MarkCollection = Backbone.Collection.extend({
        model: markModel,
        url: '/efile/rest/mark'
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

    return MarkCollection;

});