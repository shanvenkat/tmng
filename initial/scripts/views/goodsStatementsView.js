// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/AdditionalStatementModel', 'models/addStmtTransModel', 'models/addStmtTransNoMeanModel',
    'models/addStmtTransltrModel', 'models/addStmtTransltrNoMeanModel',
    'models/addStmtSignificanceModel', 'models/addStmtNoSignificanceModel', 'models/addStmtNoForeignModel', 
    'models/addStmtDisclaimerModel',
     'text!templates/goodsAdditionalStatements.html', 'text!templates/goodsStatementsTemplate.html',  'text!locale/en_us/markStatements.json'],

    function($, jqueryui, Backbone, AdditionalStatementModel, AddStmtTransModel, AddStmtTransNoMeanModel, AddStmtTransltrModel, AddStmtTransltrNoMeanModel, 
        AddStmtSignificanceModel, AddStmtNoSignificanceModel, AddStmtNoForeignModel, AddStmtDisclaimerModel, template, additionalStatementsTemplate, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var GoodsAdditionalStatementsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: AdditionalStatementModel,
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.markId = attr.markId;
                this.model = new AdditionalStatementModel();
            },

            // View Event Handlers
            events: {
                'click #continueButton': 'gotoOwnerCover', 
                'click #save': 'saveStatement',
                //"click #addAnotherTranslation": "addAnotherTranslation",
                //"click #removeTranslation": "removeTranslation",
                //"click #addAnotherNoTranslation": "addAnotherNoTranslation",
                //"click #removeAnotherNoTranslation": "removeAnotherNoTranslation",
                //"click #addAnotherTransliteration": "addAnotherTransliteration",
               // "click #removeTransliteration": "removeTransliteration",
                //"click #addAnotherNoTransliteration": "addAnotherNoTransliteration",
                //"click #removeAnotherNoTransliteration": "removeAnotherNoTransliteration",
                //"click #addAnotherSignificance": "addAnotherSignificance",
               // "click #removeSignificance": "removeSignificance",
                //"click #addAnotherNoSignificance": "addAnotherNoSignificance",
                //"click #removeNoSignificance": "removeNoSignificance",
                //"click #addAnotherNoForeign": "addAnotherNoForeign",
                //"click #removeNoForeign": "removeNoForeign",
                "click #addAnotherDisclaimer": "addAnotherDisclaimer",
                "click #removeDisclaimer": "removeDisclaimer",
                "change #additionalStatementsRadioYes": "additionalStatementsShow",
                "click #additionalStatementsRadioYes": "additionalStatementsShow",
                "change #additionalStatementsRadioNo": "additionalStatementsHide",
                "click #additionalStatementsRadioNo": "additionalStatementsHide",
                "click #previousPage": "previousPage"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    content: JSON.parse(content)
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                this.model.fetch({async:false, data:{id:this.markId, form:'goods'}});
                this.template2 = _.template($(additionalStatementsTemplate).filter('#mainContainer').html(), {
                    addStmtDisclaimerCollection : this.model.addStmtDisclaimerCollection
                });

                this.$('#infoMessage').hide();
                this.$('#errorMessage').hide();

                // Maintains chainability
                return this;

            },
            saveStatement: function() {
                console.log('Saving statement...');

                this.model.attributes.goodsStatement = true;
                this.model.attributes.markId = this.markId;
                this.model.attributes.additionalStatementsChbx = $('#additionalStatementsRadioYes').is(':checked');
            
                this.model.addStmtMiscellaneous.attributes.trademarkId = this.markId;
                this.model.addStmtMiscellaneous.attributes.goodsStatement = true;

                if ( this.model.attributes.additionalStatementsChbx ) {
                   if ( this.model.addStmtDisclaimerCollection.size() > 0 ) {
                        this.model.addStmtMiscellaneous.attributes.completed = true;
                   } else {
                        this.model.addStmtMiscellaneous.attributes.completed = false;
                   }
                } else {
                    this.model.addStmtMiscellaneous.attributes.completed = true;
                }

                this.model.addStmtMiscellaneous.save(null, {
                            wait: true,
                            success: _.bind(function (model, response) {
                                self.$('#infoMessage').show();
                                self.$('#errorMessage').hide();
                                $('#infoMessage').html('Successfully Saved Information.');
                                $('#errorMessage').html('');
                            },this),
                            error: function (model, response) {
                                self.$('#infoMessage').hide();
                                self.$('#errorMessage').show();
                                $('#infoMessage').html();
                                $('#errorMessage').html('Error occured during saving Information.');
                            }//,
                            //type: 'post'
                        });
                console.log('Saved.');
            },    
            //Show details for additional Statements
            additionalStatementsShow: function(e) {
                if (!this.showingStatements) {
                    this.$('#additionalStatementsContainer').append(this.template2);
                    this.showingStatements = true;
                }
            },

            additionalStatementsHide: function(e) {
                this.$('#additionalStatementsContainer').empty();
                this.showingStatements = false;
            },

            gotoOwnerCover: function() {

                this.saveStatement();

                var navString = '#ownerCover/' + this.markId;
                this.pageNavigator(navString, true);
            },
            addAnotherDisclaimer: function() {
                if ($('#disclaimer').val() != undefined && $('#disclaimer').val() !== '' ) {
                    var addStmtDisclaimerModel = new AddStmtDisclaimerModel();
                    addStmtDisclaimerModel.set('word', $('#disclaimer').val());
                    addStmtDisclaimerModel.set('trademarkId', this.markId);

                    if(addStmtDisclaimerModel.isValid(true)){
                        var self = this;
                        addStmtDisclaimerModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addDisclaimerSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#disclaimer').val('');
                                self.model.addStmtDisclaimerCollection.add(model);
                                $("#addDisclaimerContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeDisclaimer: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtDisclaimerCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#disclaimer' + model.id).remove();
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeDisclaimer");
                                 $('#disclaimer' + model.id).remove();
                            } else {
                                console.log("error");
                            }
                        }
                });
             }
            

        });

        // Returns the GoodsAdditionalStatementsView class
        return GoodsAdditionalStatementsView;




    }
);
