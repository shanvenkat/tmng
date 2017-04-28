define([
    'jquery',
    'backbone',
    'models/addStmtTransltrNoMeanModel'
], function($, Backbone, AddStmtTransltrNoMeanModel) {
    'use strict';
    var AddStmtTransltrNoMeanCollection = Backbone.Collection.extend({
        model: AddStmtTransltrNoMeanModel,
        url: '/efile/rest/additionalstmt/transltrnomeanlist'
    });

    return AddStmtTransltrNoMeanCollection;

});