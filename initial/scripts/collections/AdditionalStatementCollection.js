define([
    'jquery',
    'backbone',
    'models/additionalStatementModel'
], function($, Backbone, AdditionalStatementModel) {
    'use strict';
    var AdditionalStatementCollection = Backbone.Collection.extend({
        model: AdditionalStatementModel,
        url: '/efile/rest/additionalstmt',
        addStmtTransltCollection: new AddStmtTransltCollection(),
        addStmtTransNoMeanCollection: new AddStmtTransNoMeanCollection()
    });

    return AdditionalStatementCollection;

});