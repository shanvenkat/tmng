define([
    'jquery',
    'backbone',
    'models/otherAttorneyModel'
], function ($, Backbone, OtherAttorneyModel) {
    'use strict';
    var OtherAttorneyCollection = Backbone.Collection.extend({
        model: OtherAttorneyModel,
        urlRoot: '/efile/rest/attorney',
        url: function () {
            var url = this.urlRoot;
            return url;
        }
    });
    return OtherAttorneyCollection;
});