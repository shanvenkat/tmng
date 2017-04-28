
define([
    'jquery',
    'backbone',
    'models/addStmtNoSignificanceModel'
], function($, Backbone, AddStmtNoSignificanceModel) {
    'use strict';
    var AddStmtNoSignificanceCollection = Backbone.Collection.extend({
        model: AddStmtNoSignificanceModel,
        url: '/efile/rest/additionalstmt/nosignificancelist'
    });

    return AddStmtNoSignificanceCollection;

});

