
define([
    'jquery',
    'backbone',
    'models/GSModel'
], function($, Backbone, GSModel) {
    'use strict';
    var GSCollection = Backbone.Collection.extend({
        model: GSModel,
        //url: '../efile/idm/list'
        url: '/efile/rest/idmsearch/list'
    });

    return GSCollection;

});