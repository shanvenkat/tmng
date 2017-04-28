define([
    'jquery',
    'backbone'
], function ($, Backbone) {
    var DomesticRepFillingModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/domesticrep/filling',
        url: function () {
            var url = this.urlRoot;
            return url;
        },
        destroy: function (options) {
                var opts = _.extend({url: this.urlRoot +'/'+ this.id}, options || {});
                return Backbone.Model.prototype.destroy.call(this, opts);
        }
    });
    return DomesticRepFillingModel;
});