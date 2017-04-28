define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {

    var AddStmtNoSignificanceModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/nosignificance',
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
                    $('#valNosignificance').text('');
                    return;
                }
                 else {
                    $('#valNosignificance').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }

    });
    return AddStmtNoSignificanceModel;


});