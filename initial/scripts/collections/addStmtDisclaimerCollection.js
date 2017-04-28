
define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {
    'use strict';
    var AddStmtDisclaimerCollection = Backbone.Collection.extend({
        model: AddStmtDisclaimerModel,
        url: '/efile/rest/additionalstmt/noforeignlist'
    });

    return AddStmtDisclaimerCollection;

});

