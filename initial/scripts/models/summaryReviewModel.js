define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var SummaryReviewModel = Backbone.Model.extend({
        urlRoot:'/efile/rest/review',
        url:function(){
            if(this.isNew()){
                return this.urlRoot;
            }

            return this.urlRoot+'/'+this.id;
        },
        parse: function(data) {
            console.log('parse data summaryReviewModel');
            if (data){
                console.log('inside summaryReviewModel: parse: data');
                return data;
            }
        }
    });
    return SummaryReviewModel;
});