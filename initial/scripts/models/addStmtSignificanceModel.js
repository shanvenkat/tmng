define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {

    var AddStmtSignificanceModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/significance',
            defaults: {
              trademarkId: '',
              statementId: '',
               word: '',
               meaning: ''
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
                    $('#valSignificance').text('');
                    return;
                }
                 else {
                    $('#valSignificance').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }

    });
    return AddStmtSignificanceModel;


});