define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var MarkModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/mark',
            url:function(){
                if(this.isNew()){
                    return this.urlRoot;
                }
                return this.urlRoot+'/'+this.id;
            },
            defaults: {
               documentId:'',
               colorin:false,
               threedimenstion:false,
               literalText:'',
               description:'',
               standardChar:'',
               filename: '',
               confirmImageMark: false,
               confirmSpecialMark: false,
               colors: '',
               fileupload: false
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            }
    });
    return MarkModel;


});