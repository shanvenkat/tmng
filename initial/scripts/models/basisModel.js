define([
    'jquery',
    'backbone'
], function($, Backbone, moment) {

    var BasisModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/basis',
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
    return BasisModel;
});