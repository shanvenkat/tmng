define([
    'jquery',
    'backbone',
    'models/addStmtTransNoMeanModel'
], function($, Backbone, AddStmtTransNoMeanModel) {
    'use strict';
    var AddStmtTransNoMeanCollection = Backbone.Collection.extend({
        model: AddStmtTransNoMeanModel,
        url: '/efile/rest/additionalstmt/transltnomeanlist'
    });

    return AddStmtTransNoMeanCollection;

});