define([
    'jquery',
    'backbone',
    'collections/addStmtMiscellaneousDocCollection'
], function($, Backbone, AddStmtMiscellaneousDocCollection) {

    var AddStmtMiscellaneousModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/miscellaneous',

            defaults: {
              trademarkId: '',
              statementId: '',
              text: '',
              miscStatementSelected: "no"//,
            },
            initialize: function (options) {
                this.trademarkId = options.trademarkId;
                this.text = options.text;
                this.supportingDocuments = options.supportingDocuments;
                this.supportingDocuments = new AddStmtMiscellaneousDocCollection(options.supportingDocuments);
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            }

    });

    return AddStmtMiscellaneousModel;

});

