define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var AddStmtMiscellaneousDocModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/miscellaneousdoc',
            defaults: {
              id: '',
              statementId: '',
              fileName: '',
              cfkDocumentId: ''
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            }

    });

    return AddStmtMiscellaneousDocModel;

});