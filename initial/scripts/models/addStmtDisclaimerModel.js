define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var AddStmtDisclaimerModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt/disclaimer',
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

            validate: function(attrs, options) {
                if (AddStmtDisclaimerModel.checkStandardText(this.attributes.trademarkId, this.attributes.word)) {
                    $('#disclaimerValMessage').text('');
                    return;
                }
                 else {
                    $('#disclaimerValMessage').text('Value must exist in the standard character text.');
                    return 'false';
                }
            }
    },{
           checkStandardText: function(tmid, uitext, attrs, options) {
                var stuff = { id:tmid, text:uitext };

                var self = this;
                $.ajax({
                    url: '/efile/rest/additionalstmt/checkStandardText',
                    type: 'GET',
                    headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                    },
                    data: jQuery.param(stuff),
                    async: false,
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: function (returndata) {
                        self.validated = returndata;
                    },
                    error: function(xhr, status, text) {
                        console.log(status);
                        self.validated = false;
                    }
                });

                return this.validated;
           }

    });

    return AddStmtDisclaimerModel;

});