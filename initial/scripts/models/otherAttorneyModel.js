define([
    'jquery',
    'backbone'
], function($, Backbone) {

    var OtherAttorneyModel = Backbone.Model.extend({
        defaults: {
            oAFirstName:'',
            oAFamilyName:'',
            oAMiddleName:'',
            oASuffix:''
        },
        validate: function (attrs) {
            if (!attrs.oAFirstName) {
               return 'First Name is required!';
            }
        }
    });
    return OtherAttorneyModel;


});