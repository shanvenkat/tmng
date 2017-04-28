define([
    'jquery',
    'backbone',
    'models/addStmtNoForeignModel'
], function($, Backbone, AddStmtNoForeignModel) {
    'use strict';
    var AddStmtNoForeignCollection = Backbone.Collection.extend({
        model: AddStmtNoForeignModel,
        url: '/efile/rest/additionalstmt/noforeignlist'
    });

    return AddStmtNoForeignCollection;

});

