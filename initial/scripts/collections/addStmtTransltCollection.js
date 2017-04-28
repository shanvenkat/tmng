define([
    'jquery',
    'backbone',
    'models/addStmtTransModel'
], function($, Backbone, AddStmtTransModel) {
    'use strict';
    var AddStmtTransltCollection = Backbone.Collection.extend({
        model: AddStmtTransModel,
        url: '/efile/rest/additionalstmt/transltmarklist'
    });

    return AddStmtTransltCollection;

});