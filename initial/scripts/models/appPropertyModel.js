define([
    'jquery',
    'backbone'
], function($, Backbone, moment) {
    var AppPropertyModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/property',
        url: function() {
            var url = this.urlRoot;
            return url;
        },
        parse: function(data) {
            if (data) {
                return data;
            }
        }
    });
    return AppPropertyModel;
});