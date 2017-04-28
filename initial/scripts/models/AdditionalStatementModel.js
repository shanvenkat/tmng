define([
    'jquery',
    'backbone',
    'collections/addStmtTransltCollection',
    'collections/addStmtTransNoMeanCollection',
    'collections/addStmtTransltrCollection',
    'collections/addStmtTransltrNoMeanCollection',
    'collections/addStmtSignificanceCollection',
    'collections/addStmtNoSignificanceCollection',
    'collections/addStmtNoForeignCollection',
    'collections/addStmtDisclaimerCollection',
    'collections/addStmtMiscellaneousDocCollection',
    'models/addStmtMiscellaneousModel'
], function($, Backbone, AddStmtTransltCollection, AddStmtTransNoMeanCollection, AddStmtTransltrCollection, AddStmtTransltrNoMeanCollection,
  AddStmtSignificanceCollection, AddStmtNoSignificanceCollection, AddStmtNoForeignCollection, AddStmtDisclaimerCollection, AddStmtMiscellaneousDocCollection, AddStmtMiscellaneousModel) {

    var AdditionalStatementModel = Backbone.Model.extend({
            urlRoot:'/efile/rest/additionalstmt',
            defaults: {
               
            },
            initialize: function() {
              _.bindAll(this, 'fetchComplete');
              this.bind('change', this.fetchComplete);
            },
            parse: function(data) {
                if (data){                    
                    return data;
                }
            },
            fetchComplete: function(){
              this.addStmtTransltCollection = new AddStmtTransltCollection(this.get('addStmtTransltCollection'));
              this.addStmtTransNoMeanCollection = new AddStmtTransNoMeanCollection(this.get('addStmtTransNoMeanCollection'));     
              this.addStmtTransltrCollection = new AddStmtTransltrCollection(this.get('addStmtTransltrCollection'));
              this.addStmtTransltrNoMeanCollection = new AddStmtTransltrNoMeanCollection(this.get('addStmtTransltrNoMeanCollection'));
              this.addStmtSignificanceCollection = new AddStmtSignificanceCollection(this.get('addStmtSignificanceCollection'));
              this.addStmtNoSignificanceCollection = new AddStmtNoSignificanceCollection(this.get('addStmtNoSignificanceCollection'));
              this.addStmtNoForeignCollection = new AddStmtNoForeignCollection(this.get('addStmtNoForeignCollection'));
              this.addStmtDisclaimerCollection = new AddStmtDisclaimerCollection(this.get('addStmtDisclaimerCollection'));

              var docs = new AddStmtMiscellaneousDocCollection(this.get('addStmtMiscellaneous').supportingDocuments);
              this.addStmtMiscellaneous = new AddStmtMiscellaneousModel(this.get('addStmtMiscellaneous'), docs);

            },
            validation: {
               
            }
    });
    return AdditionalStatementModel;


});