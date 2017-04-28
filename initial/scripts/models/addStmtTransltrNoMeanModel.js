define([
    'jquery',
    'backbone',
    'models/addStmtDisclaimerModel'
], function($, Backbone, AddStmtDisclaimerModel) {

    var AddStmtTransltrNoMeanModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/transltrmarknomean',
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
                if (AddStmtDisclaimerModel.checkStandardText(this.attributes.trademarkId, this.attributes.meaning)) {
                    $('#valTransword').text('');
                    return;
                }
                 else {
                    $('#valTransword').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }

    });
    return AddStmtTransltrNoMeanModel;


});