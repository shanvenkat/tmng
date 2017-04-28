
define([
    'jquery',
    'backbone',
    'models/addStmtMiscellaneousDocModel'
], function($, Backbone, AddStmtMiscellaneousDocModel) {
    'use strict';
    var AddStmtMiscellaneousDocCollection = Backbone.Collection.extend({
        model: AddStmtMiscellaneousDocModel,
        url: '/efile/rest/additionalstmt/miscellaneousdoc'
    });

    return AddStmtMiscellaneousDocCollection;

});

