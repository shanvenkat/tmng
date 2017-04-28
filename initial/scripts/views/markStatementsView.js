// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/AdditionalStatementModel', 'models/addStmtTransModel', 'models/addStmtTransNoMeanModel',
    'models/addStmtTransltrModel', 'models/addStmtTransltrNoMeanModel',
    'models/addStmtSignificanceModel', 'models/addStmtNoSignificanceModel', 'models/addStmtNoForeignModel', 'models/addStmtMiscellaneousModel', 'models/addStmtMiscellaneousDocModel',
    'views/addStmtMiscDocCollectionView', 'text!templates/markAdditionalStatements.html', 'text!templates/markStatementsTemplate.html',
    'text!locale/en_us/markStatements.json'],

    function($, jqueryui, Backbone, AdditionalStatementModel, AddStmtTransModel, AddStmtTransNoMeanModel, AddStmtTransltrModel, AddStmtTransltrNoMeanModel,
        AddStmtSignificanceModel, AddStmtNoSignificanceModel, AddStmtNoForeignModel, AddStmtMiscellaneousModel, AddStmtMiscellaneousDocModel, AddStmtMiscDocCollectionView, template, additionalStatementsTemplate, content) {
        'use strict';


        //Create SearchView class which extends Backbone.View
        var MarkAdditionalStatementsView = Backbone.View.extend({

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
                'click #continueButton': 'gotoGoodsAndServices',                
                "click #addAnotherTranslation": "addAnotherTranslation",
                "click #removeTranslation": "removeTranslation",
                "click #addAnotherNoTranslation": "addAnotherNoTranslation",
                "click #removeAnotherNoTranslation": "removeAnotherNoTranslation",
                "click #addAnotherTransliteration": "addAnotherTransliteration",
                "click #removeTransliteration": "removeTransliteration",
                "click #addAnotherNoTransliteration": "addAnotherNoTransliteration",
                "click #removeAnotherNoTransliteration": "removeAnotherNoTransliteration",
                "click #addAnotherSignificance": "addAnotherSignificance",
                "click #removeSignificance": "removeSignificance",
                "click #addAnotherNoSignificance": "addAnotherNoSignificance",
                "click #removeNoSignificance": "removeNoSignificance",
                "click #addAnotherNoForeign": "addAnotherNoForeign",
                "click #removeNoForeign": "removeNoForeign",
                "click #additionalStatementsChbx": "additionalStatementsShow",
                "click #addAnotherMiscellaneous": "addAnotherMiscellaneous",
                "click #uploadMiscellaneous": "uploadMiscellaneous",
                "click #previousPage": "previousPage",
                "click #saveMarkStatements": "saveMarkStatements",

                "change :file": "fileChange",
                "change #miscStatementYes": "miscStatementsShow",
                "click #miscStatementYes": "miscStatementsShow",
                "change #miscStatementNo": "miscStatementsHide",
                "click #miscStatementNo": "miscStatementsHide",
                "click #removeDocument": "removeDocument",
                "submit #uploadForm" :"uploadForm"
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

                this.model.fetch({async:false, data:{id:this.markId, form:'mark'}});
                this.template2 = _.template($(additionalStatementsTemplate).filter('#mainContainer').html(), {
                    addStmtTransltCollection: this.model.addStmtTransltCollection,
                    addStmtTransNoMeanCollection: this.model.addStmtTransNoMeanCollection,
                    addStmtTransltrCollection: this.model.addStmtTransltrCollection,
                    addStmtTransltrNoMeanCollection: this.model.addStmtTransltrNoMeanCollection,
                    addStmtSignificanceCollection : this.model.addStmtSignificanceCollection,
                    addStmtNoSignificanceCollection : this.model.addStmtNoSignificanceCollection,
                    addStmtNoForeignCollection : this.model.addStmtNoForeignCollection,
                    addStmtMiscellaneousModel : this.model.addStmtMiscellaneousModel
                });

                this.template3 = _.template($(additionalStatementsTemplate).filter('#editStmtMisc').html(), {
                    addStmtMiscellaneousModel : this.model.addStmtMiscellaneousModel
                });

                // Maintains chainability
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);

                this.additionalStatementsShow();
                this.$('#infoMessage').hide();
                this.$('#errorMessage').hide();

                return this;
            },

            //Show details for additional Statements
            additionalStatementsShow: function(e) {
                if (this.model.get("additionalStatementsChbx") == true) {
                    this.$('#additionalStatementsContainer').append(this.template2);

                    // Show the Misc Statement panel if data exists:
                    if (this.model.addStmtMiscellaneous.attributes.text) {
                        this.model.set("miscStatementSelected", true);
                        this.miscStatementsShow(e);
                    }
                    else {
                        this.miscStatementsHide(e);
                        this.model.set("miscStatementSelected", false);
                    }
                }
                else {
                    this.miscStatementsHide(e);
                    this.model.set("miscStatementSelected", false);
                    this.$('#additionalStatementsContainer').empty();
                }

                $('#miscellaneous').summernote({
                    height: 300
                });

                this.ModelBindAndValidation(this.model, this.$el);
            },

            // TODO:  (GWH)  This doesn't reliably work.  It works fine on the radio button events.  It only shows the text in the textbox on page refresh, and it doesn't work at all when switching between views.
            miscStatementsShow: function(e) {
                this.$('#editStmtMiscPanel').empty();
                this.$('#editStmtMiscPanel').append(this.template3);
                this.model.set("miscStatementSelected", true);

                var self = this;

                // Render the attached document list:
                this.renderSupportingDocs();
                this.ModelBindAndValidation(this.model, this.$el);

                $(document).ready(function() {
                    $('#miscellaneous').summernote({
                        height: 300
                    });
                    $('#miscellaneous').code(self.model.addStmtMiscellaneous.attributes.text);
                });
            },

            miscStatementsHide: function(e) {
                this.model.set("miscStatementSelected", false);
                this.$('#editStmtMiscPanel').empty();
            },

            renderSupportingDocs: function() {
                var docs = this.model.addStmtMiscellaneous.supportingDocuments;
                $('#addStmtMiscDocPanel').html(new AddStmtMiscDocCollectionView( { collection: docs } ).render().el);
            },

            removeDocument: function(e) {
                this.model.addStmtMiscellaneous.supportingDocuments.models[e.currentTarget.name].set("isDeleted","true");
                this.renderSupportingDocs();
                $('#fileUploadedMessage').empty();
            },

            fileChange: function(e){
                var file = e.target.files[0];
                if ( file != undefined ) {
                    var name = file.name;
                    var size = file.size;
                    var type = file.type;
                    $('#fileUploadedMessage').empty();
                    $('#filename').val(name);
  //                  this.model.set('filename', name);  <-- This clobbers the misc statements document model, for some reason.  ???
                } else {
                    $('#fileUploadedMessage').empty();
                    $('#filename').val('');
//                    this.model.set('filename', '');
                }

            },

            isAllowedFileExtension:function isAllowedFileExtension(fileExt) {
                var isValid = false;
                var fileExtension = fileExt.toUpperCase();
                $.ajax({
                    url: '/efile/rest/tmdocument/document/file/extensions',
                    type: 'GET',
                    async: false,
                    cache: true,
                    contentType: "text/plain",
                    success: function (allowedExtensions) {
                        var fileExtensions = allowedExtensions.split(',');

                        $.each(fileExtensions, function( index, value ) {
                            if(value === fileExtension){
                                isValid = true;
                            }
                        });

                    },
                    error: function(xhr, status, text) {
                        console.log(xhr.responseText);
                        console.log('Could not get supported file formats.');
                    }
                });
                return isValid;
            },    

            uploadForm: function (event) {
                $('#uploadFileError').empty();
                $('#fileUploadedMessage').empty();

                event.stopPropagation(); // Stop stuff happening
                event.preventDefault(); // Totally stop stuff happening
                //grab all form data
                var formData = new FormData();

                var files = document.getElementById('file').files[0];

                if ( files != undefined) {

                    if(files.size > 10485760){
                        $('#fileUploadedMessage').text("File size is limited to 10 MB.");
                        return false;
                    }

                    if(!this.isAllowedFileExtension(files.name.split('.')[1])){
                        $('#fileUploadedMessage').text("Provided file format is not supported.");
                        return false;
                    }

                    formData.append('file', files);

                    var filename = files.name;

                    $.ajax({
                        context: this,
                        url: 'efile/rest/additionalstmt/upload',
                        type: 'POST',
                        data: formData,
                        async: false,
                        cache: false,
                        //dataType: 'json',
                        contentType: false,
                        processData: false,
                        success: function (returndata) {
                        	this.model.attributes.addStmtMiscellaneous.supportingDocuments.push({statementId: 0, fileName: files.name, cfkDocumentId: returndata});
                            this.model.addStmtMiscellaneous.supportingDocuments.add({statementId: 0, fileName: files.name, cfkDocumentId: returndata});
                            this.renderSupportingDocs();
                            $('#filename').val(name);
                            $('#fileUploadedMessage').text("File uploaded successfully!");

                            // Clear the file selection:
                            $("#file").replaceWith($("#file").clone());
                        },
                        error: function(xhr, status, text) {
                            console.log(xhr.responseText);
                            $('#uploadFileError').text(xhr.statusText);

                            console.log('Failure!');

                        }
                    });
                    }
                    else{
                        $('#uploadFileError').text("Please select a file to upload.");
                    }

                return false;
            },

            saveMarkStatements: function() {
                console.log('Saving...');
                var self = this;
                this.model.attributes.goodsStatement = false;
                var statementTx = $('#miscellaneous').code();
                if(statementTx=='' || $('#miscStatementNo').is(':checked')) {
                    statementTx=' ';//statementTx is required 
                } 

                this.model.attributes.additionalStatementsChbx = $('#additionalStatementsChbx').is(':checked');
                if ( this.model.attributes.additionalStatementsChbx ) {
                   if ( this.model.addStmtTransltCollection.size() > 0 || 
                    this.model.addStmtTransNoMeanCollection.size() > 0 ||
                    this.model.addStmtTransltrCollection.size() > 0 ||
                    this.model.addStmtTransltrNoMeanCollection.size() > 0 ||
                    this.model.addStmtSignificanceCollection.size() > 0 ||
                    this.model.addStmtNoSignificanceCollection.size() > 0 ||
                    this.model.addStmtNoForeignCollection.size() > 0 ||
                    (statementTx != undefined && statementTx !== ' ')) {
                        this.model.addStmtMiscellaneous.attributes.completed = true;
                   } else {
                        this.model.addStmtMiscellaneous.attributes.completed = false;
                   }
                   this.model.addStmtMiscellaneous.attributes.text = statementTx;
                } else {
                    this.model.addStmtMiscellaneous.attributes.completed = true;
                    this.model.addStmtMiscellaneous.attributes.text = '';
                }
                
                this.model.addStmtMiscellaneous.attributes.trademarkId = this.markId;
                this.model.attributes.goodsStatement = false;
                this.model.attributes.markId = this.markId;
                /*this.model.save(null, {
                            wait: true,
                            success: _.bind(function (model, response) {
                                this.$('#infoMessage').show();
                                this.$('#errorMessage').hide();
                                $('#infoMessage').html('Successfully Saved Information.');
                                $('#errorMessage').html('');
                            },this),
                            error: function (model, response) {
                                this.$('#infoMessage').hide();
                                this.$('#errorMessage').show();
                                $('#infoMessage').html();
                                $('#errorMessage').html('Error occured during saving Information.');
                            }//,
                            //type: 'post'
                        });*/
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

            //This function will navigate either to the profile page or the compare page based on whether 1 or more providers are selected.
            gotoGoodsAndServices: function() {

                var navString = '#goodsAndServicesCover/' + this.markId;
                this.pageNavigator(navString, true);
            },

            addAnotherTranslation: function() {
                if ($('#transword').val() != undefined && $('#transword').val() !== '' &&
                    $('#translation').val() != undefined && $('#translation').val() !== '' ) {
                     var addStmtTransltModel = new AddStmtTransModel();
                    addStmtTransltModel.set('translation', $('#translation').val());
                    addStmtTransltModel.set('meaning', $('#transword').val())
                    addStmtTransltModel.set('trademarkId', this.markId);

                    if(addStmtTransltModel.isValid(true)){
                        var self = this;
                        addStmtTransltModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherTranslation = _.template($(additionalStatementsTemplate).filter("#addAnotherTranslationSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#translation').val('');
                                $('#transword').val('');
                                self.model.addStmtTransltCollection.add(model);
                                $("#addTranslationContainer").append(addAnotherTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeTranslation: function(e) {
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtTransltCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtTranslt' + model.id).remove();
                            self.model.addStmtTransltCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeTranslation");
                                 $('#addStmtTranslt' + model.id).remove();
                                 self.model.addStmtTransltCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });

            },
            addAnotherNoTranslation: function() {
                if ($('#notranslation').val() != undefined && $('#notranslation').val() !== '' ) {
                    var addStmtTransNoMeanModel = new AddStmtTransNoMeanModel();
                    addStmtTransNoMeanModel.set('word', $('#notranslation').val());
                    addStmtTransNoMeanModel.set('trademarkId', this.markId);

                    if(addStmtTransNoMeanModel.isValid(true)){
                        var self = this;
                        addStmtTransNoMeanModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addNoTranslationSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#notranslation').val('');
                                self.model.addStmtTransNoMeanCollection.add(model);
                                $("#addNoTranslationContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeAnotherNoTranslation: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtTransNoMeanCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtNoTranslt' + model.id).remove();
                            self.model.addStmtTransNoMeanCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeAnotherNoTranslation");
                                 $('#addStmtNoTranslt' + model.id).remove();
                                 self.model.addStmtTransNoMeanCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });
             },
            addAnotherTransliteration: function() {
                if ($('#transltrword').val() != undefined && $('#transltrword').val() !== '' &&
                    $('#transliteration').val() != undefined && $('#transliteration').val() !== '' ) {
                     var addStmtTransltModel = new AddStmtTransltrModel();
                    addStmtTransltModel.set('transliteration', $('#transliteration').val());
                    addStmtTransltModel.set('meaning', $('#transltrword').val())
                    addStmtTransltModel.set('trademarkId', this.markId);

                    if(addStmtTransltModel.isValid(true)){
                        var self = this;
                        addStmtTransltModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherTranslation = _.template($(additionalStatementsTemplate).filter("#addAnotherTransliterationSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#transliteration').val('');
                                $('#transltrword').val('');
                                self.model.addStmtTransltrCollection.add(model);
                                $("#addTransliterationContainer").append(addAnotherTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeTransliteration: function(e) {
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtTransltrCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtTransltr' + model.id).remove();
                            self.model.addStmtTransltrCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeTransliteration");
                                 $('#addStmtTransltr' + model.id).remove();
                                 self.model.addStmtTransltrCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });

            },
            addAnotherNoTransliteration: function() {
                if ($('#noTransliteration').val() != undefined && $('#noTransliteration').val() !== '' ) {
                    var addStmtTransNoMeanModel = new AddStmtTransltrNoMeanModel();
                    addStmtTransNoMeanModel.set('word', $('#noTransliteration').val());
                    addStmtTransNoMeanModel.set('trademarkId', this.markId);

                    if(addStmtTransNoMeanModel.isValid(true)){
                        var self = this;
                        addStmtTransNoMeanModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addNoTransliterationSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#noTransliteration').val('');
                                self.model.addStmtTransltrNoMeanCollection.add(model);
                                $("#addNoTransliterationContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeAnotherNoTransliteration: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtTransltrNoMeanCollection.get(id);
                
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtNoTransltr' + model.id).remove();
                            self.model.addStmtTransltrNoMeanCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeAnotherNoTranslation");
                                 $('#addStmtNoTransltr' + model.id).remove();
                                 self.model.addStmtTransltrNoMeanCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });
             },
             addAnotherSignificance: function() {
                if ($('#Significance').val() != undefined && $('#Significance').val() !== '' &&
                  $('#SigniMean').val() != undefined && $('#SigniMean').val() !== '' ) {
                    var addtStmtSignificanceModel = new AddStmtSignificanceModel();
                    addtStmtSignificanceModel.set('word', $('#Significance').val());
                    addtStmtSignificanceModel.set('meaning', $('#SigniMean').val());
                    addtStmtSignificanceModel.set('trademarkId', this.markId);

                    if(addtStmtSignificanceModel.isValid(true)){
                        var self = this;
                        addtStmtSignificanceModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addSignificanceSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#Significance').val('');
                                $('#SigniMean').val('');
                                self.model.addStmtSignificanceCollection.add(model);
                                $("#addSignificanceContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeSignificance: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtSignificanceCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtSignificance' + model.id).remove();
                            self.model.addStmtSignificanceCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeSignificance");
                                 $('#addStmtSignificance' + model.id).remove();
                                  self.model.addStmtSignificanceCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });
             },
             addAnotherNoSignificance: function() {
                if ($('#noSignificance').val() != undefined && $('#noSignificance').val() !== '' ) {
                    var addtStmtSignificanceModel = new AddStmtNoSignificanceModel();
                    addtStmtSignificanceModel.set('word', $('#noSignificance').val());
                    addtStmtSignificanceModel.set('trademarkId', this.markId);

                    if(addtStmtSignificanceModel.isValid(true)){
                        var self = this;
                        addtStmtSignificanceModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addNoSignificanceSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#noSignificance').val('');
                                self.model.addStmtNoSignificanceCollection.add(model);
                                $("#addNoSignificanceContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeNoSignificance: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtNoSignificanceCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtNoSignificance' + model.id).remove();
                            self.model.addStmtNoSignificanceCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeNoSignificance");
                                 $('#addStmtNoSignificance' + model.id).remove();
                                 self.model.addStmtNoSignificanceCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });
             },
             addAnotherNoForeign: function() {
                if ($('#noForeign').val() != undefined && $('#noForeign').val() !== '' ) {
                    var addStmtNoForeignModel = new AddStmtNoForeignModel();
                    addStmtNoForeignModel.set('word', $('#noForeign').val());
                    addStmtNoForeignModel.set('trademarkId', this.markId);

                    if(addStmtNoForeignModel.isValid(true)){
                        var self = this;
                        addStmtNoForeignModel.save(null, {
                            success: _.bind(function (model, response) {
                                var addAnotherNoTranslation = _.template($(additionalStatementsTemplate).filter("#addNoForeignSummary").html(), 
                                {
                                    model:  model
                                });
                                $('#noForeign').val('');
                                self.model.addStmtNoForeignCollection.add(model);
                                $("#addNoForeignContainer").append(addAnotherNoTranslation);
                            },this),
                            error: function (model, response) {
                                console.log("error");
                                
                            }
                        });
                    }
                }
             },
             removeNoForeign: function(e){
                var id = e.target.name;
                var self = this;
                var model = this.model.addStmtNoForeignCollection.get(id);
                model.destroy({ 
                        success: function(model, response) {
                            $('#addStmtNoForeign' + model.id).remove();
                            self.model.addStmtNoForeignCollection.remove(model);
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in goodsStatemensView removeNoSignificance");
                                 $('#addStmtNoForeign' + model.id).remove();
                                 self.model.addStmtNoForeignCollection.remove(model);
                            } else {
                                console.log("error");
                            }
                        }
                });
             },

             addAnotherMiscellaneous: function(e){
                alert("addAnotherMiscellaneous.");
             },

            uploadMiscellaneous : function(e){
                alert("uploadMiscellaneous.");
            }


        });

        // Returns the AppStatusView class
        return MarkAdditionalStatementsView;

    }






);
