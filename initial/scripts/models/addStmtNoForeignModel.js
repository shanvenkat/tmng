define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {

    var AddStmtNoForeignModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/noforeignmean',
            defaults: {
              trademarkId: '',
              statementId: '',
              word: ''
            },
            parse: function(data) {
                if (data){
                    return data;
                }
            },
            validation: {
               
            },

            validate: function(attrs, options) {
                if (AddStmtDisclaimerModel.checkStandardText(this.attributes.trademarkId, this.attributes.word)) {
                    $('#valNoForeign').text('');
                    return;
                }
                 else {
                    $('#valNoForeign').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }

    });
    return AddStmtNoForeignModel;


});