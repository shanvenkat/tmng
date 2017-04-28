define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var GSModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/idmsearch',
            defaults: {
               trademarkId:'',
               termId:''
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            }
    });
    return GSModel;
});