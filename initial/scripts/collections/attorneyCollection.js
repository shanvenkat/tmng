define([
    'jquery',
    'backbone',
    'models/attorneyModel'
], function($, Backbone, attorneyModel) {
    'use strict';
    var AttorneyCollection = Backbone.Collection.extend({
        model: attorneyModel,
        url: function() {
            return '/efile/rest/attorney';
        },
        next: function (){
              this.setElement(this.at(this.indexOf(this.getElement()) + 1));
              return this;
        }
    });
    return AttorneyCollection;
});