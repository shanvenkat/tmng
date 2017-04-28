define([
    'jquery',
    'backbone',
    'models/lookupModel'
], function($, Backbone, LookupModel) {
    'use strict';
    var LookupDataCollection = Backbone.Collection.extend({
        model: LookupModel,
        url: '/efile/locale/'+ this.lookupType
 
    });

    return LookupDataCollection;

});