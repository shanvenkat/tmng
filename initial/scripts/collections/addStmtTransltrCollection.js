define([
    'jquery',
    'backbone',
    'models/addStmtTransltrModel'
], function($, Backbone, AddStmtTransltrModel) {
    'use strict';
    var AddStmtTransltrCollection = Backbone.Collection.extend({
        model: AddStmtTransltrModel,
        url: '/efile/rest/additionalstmt/transltrmarklist'
    });

    return AddStmtTransltrCollection;

});