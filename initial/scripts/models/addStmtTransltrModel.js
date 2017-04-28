define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var AddStmtTransltrModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/transltrmark',
            defaults: {
               meaning: '',
               transliteration: '',
               trademarkId: '',
               statementId: ''
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            }
    });
    return AddStmtTransltrModel;


});