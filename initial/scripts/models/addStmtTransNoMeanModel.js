define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {

    var AddStmtTransNoMeanModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/transmarknomean',
            defaults: {
               word: '',
               trademarkId: '',
               statementId: ''
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
                    $('#valNotranslation').text('');
                    return;
                }
                 else {
                    $('#valNotranslation').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }

    });
    return AddStmtTransNoMeanModel;


});