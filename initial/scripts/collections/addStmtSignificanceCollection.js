define([
    'jquery',
    'backbone',
    'models/addStmtSignificanceModel'
], function($, Backbone, AddStmtSignificanceModel) {
    'use strict';
    var AddStmtSignificanceCollection = Backbone.Collection.extend({
        model: AddStmtSignificanceModel,
        url: '/efile/rest/additionalstmt/transltmarklist'
    });

    return AddStmtSignificanceCollection;

});