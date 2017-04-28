define([
    'jquery',
    'backbone',
    'models/electronicAddressModel'
], function($, Backbone, ElectronicAddressModel) {
    'use strict';
  
    var ElectronicAddressCollection = Backbone.Collection.extend({
       model: ElectronicAddressModel
    });
  
    return ElectronicAddressCollection;
});