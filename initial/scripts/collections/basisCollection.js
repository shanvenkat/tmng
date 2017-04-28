define([
    'jquery',
    'backbone',
    'models/basisModel'
], function($, Backbone, BasisModel) {
    'use strict';
    var BasisCollection = Backbone.Collection.extend({
        model: BasisModel,
        url: function() {
            return '/efile/rest/basis';
        },
        totalResults: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 0,
        selectedClasses: 0,
        selectedGoods: 0,
        parse: function(response) {
            var attrs;
            this.totalResults = response.totalResults;
            this.totalPages = response.totalPages;
            this.currentPage = response.currentPage;
            this.pageSize = response.pageSize;
            this.selectedClasses = response.selectedClasses;
            this.selectedGoods = response.selectedGoods;
            return attrs = response.bases;
        },
        save: function() {
           var self=this;
            Backbone.sync('create', this, {
                success: function(resp, status, xhr) {
                  $('#basisError').text(resp.value);
                },
                error: function(resp, status, xhr) {
                  $('#basisError').text(resp.value);
                }
            });
        }
    });
    return BasisCollection;
});