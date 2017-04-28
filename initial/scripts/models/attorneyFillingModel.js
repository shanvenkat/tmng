define([
    'jquery',
    'backbone'
], function ($, Backbone) {
    var AttorneyFillingModel = Backbone.Model.extend({
        urlRoot: '/efile/rest/attorney/filling',
        url: function () {
            var url = this.urlRoot;
            return url;
        },
        destroy: function (options) {
                var opts = _.extend({url: this.urlRoot +'/'+ this.id}, options || {});
                return Backbone.Model.prototype.destroy.call(this, opts);
        }
    });
    return AttorneyFillingModel;
});