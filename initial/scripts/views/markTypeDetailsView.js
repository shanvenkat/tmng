// MarkTypeDetailsView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/markModel','views/markTypesView', 'text!templates/markTypeDetails.html', 
    'text!templates/markTypeUploadTemplate.html', 'text!locale/en_us/markDetails.json'],

    function($, jqueryui, Backbone, MarkModel, MarkTypeView, template,  markType, content) {
        'use strict';

        //Create MarkTypeDetailsView class which extends Backbone.View
        var MarkTypeDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            
            // View constructor
            initialize: function(attrs) {
               this.markId = attrs.markId;  
               this.markTypeValueSelected = attrs.markTypeValueSelected;
               
            },

                  

            // View Event Handlers
            events: {
                "click input[name=markType]": "showMarkTypeDetails",
                "click #confirmImageMark": "showSpecialFormMarkDetails",
                "click #confirmSoundMark": "showSoundMarkDetails",
                //"click #colorin": "showSpecialFormMarkColorDetails",
                "change :file": "fileChange",
                "submit #uploadForm" :"uploadForm",
                "click #saveMark": "saveMark",
                "click #continueButton":"nextBtn",
                "click #previewImage": "previewImage",
                "click #previousPage": "previousPage"

            },

            // Renders the view's template to the UI
            render: function() {
                
                // Setting the view's template property using the Underscore template method
                this.template = _.template(markType, {
                    content: JSON.parse(content),
                    markTypeValueSelected:this.markTypeValueSelected
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                this.ModelBindAndValidation(this.model, this.$el);
                this.$('#fileUploadErrorMsgContainer, #fileUploadSuccessMsgContainer').hide();
                if(this.markTypeValueSelected !== '4'  && this.model.get('filename') === '') {
                    this.$("#continueButton").hide();
                }
                // Maintains chainability
                return this;

            },
            showMarkTypeDetails: function(evt) {
                if ( this.markTypeView == null ) {
                    this.markTypeView = new MarkTypeView({
                        markTypeValueSelected: markTypeValueSelected                    
                    });     
                } else {
                    this.markTypeView.markTypeValueSelected = markTypeValueSelected;
                }

                this.markTypeView.render();        

            },
            saveMark: function(){

                $('#uploadMarkError').empty();
                $('#confirmSpecialMark').empty();
                $('#fileUploadedMessage').empty();
                $('#markTypeError').empty();
                $('#standardCharError').empty();
                $('#markSavedMessage').empty();

                this.model.set('markDrawingTypeCd',this.markTypeValueSelected );

                if (this.markTypeValueSelected == "2" || this.markTypeValueSelected == "3"
                    || this.markTypeValueSelected == "5") {
                    this.model.set('fileupload', true);
                    if (this.model.get('documentId') == undefined) {
                        $('#uploadMarkError').text("please upload file.");
                        return false;
                    }
                }else if (this.markTypeValueSelected == "4"){
                        this.model.set('fileupload',false);
                        if ( $('#standardChar').val() == "" ) {
                            $('#standardCharError').text("standard character mark cannot be empty.");
                            return false;
                        } else {
                            var regexUTF = /[^\u0000-\u007f]+/;
                            if ( regexUTF.test(this.model.get('standardChar'))) {
                                $('#standardCharError').text("standard character mark must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.");
                                return;
                            }
                        }
                } else {
                        $('#markTypeError').text("Please select your mark type.");
                        return false;
                }

                if(this.model.isValid(true)){
                    var result = false;
                    this.model.save(null, {
                        async: false,
                        success: _.bind(function (model, response) {
                            console.log("success : " + response);
                            result = true;
//                            var navString = '#markTypeFeatures/' + model.id;
//                            this.pageNavigator(navString);
                        },this),
                        error: function (model, response) {
                            console.log("error");
                            result = false;
                        }
                    });
                    return result;
                }
            },
            previewImage: function(e) {

                $('#standardCharError').empty();

                var regexUTF = /[^\u0000-\u007f]+/;
                if ( regexUTF.test(this.model.get('standardChar'))) {
                    //alert('standard character mark must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.');
                    $('#standardCharError').text("standard character mark must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.");
                    return;
                }
                if ($("#standardChar").val() != "") {
                    var formData = 'text='+this.model.get('standardChar');
                    $.ajax({
                        url: '/efile/rest/tmdocument/converttoimage?text='+this.model.get('standardChar'),
                        type: 'POST',
                        async: false,
                        cache: false,
                        processData: false,
                        success: function (returndata) {
                            if(returndata != null && returndata !== '') {
                                $("#previewdiv").empty();
                                var previewTemplate = _.template($("#previewDivDetails").html());
                                $("#previewDivContainer").html(previewTemplate());
                                var imag = "<img width='100%' "
                                    + "src='" + "data:image/jpg;base64,"
                                    + returndata + "'/>";

                                $("#previewdiv").html(imag);
                            }
                        }

                    });
                }else{
                    $('#standardCharError').text("standard character mark cannot be empty.");
                }
            },/**/
            showSpecialFormMarkDetails: function (e, opt) {

                var showSpecialFormMarkSelected;
                if ( opt == undefined ) {
                    showSpecialFormMarkSelected = e.currentTarget.checked;
                } else {
                    showSpecialFormMarkSelected = this.model.confirmSpecialMark;
                }

                var specialFormMarkContent = _.template($("#specialFormMarkDetails").html());
                if (showSpecialFormMarkSelected == true) {
                    $("#specialFormMarkContainer").append(specialFormMarkContent());
                }
                else{$("#specialFormMarkContainer").empty();}

                this.ModelBindAndValidation(this.model, this.$el);

            },
            showSoundMarkDetails: function (e) {

                var showSoundMarkSelected = e.currentTarget.checked;

                var soundMarkContent = _.template($("#soundMarkDetails").html());
                if (showSoundMarkSelected == true) {
                    $("#soundMarkContainer").append(soundMarkContent());
                }
                else{$("#soundMarkContainer").empty();}

                this.ModelBindAndValidation(this.model, this.$el);

            },
            //old code - Bhuvan once you have integrated the new code, please delete it.
            showSpecialFormMarkColorDetails: function (e, opt) {
                var showMarkColorSelected;
                if ( opt == undefined ) {
                    showMarkColorSelected = e.currentTarget.checked;
                } else {
                    showMarkColorSelected = this.model.colorin;
                }

                var specialFormMarkColorContent = _.template($("#specialFormMarkColorDetails").html());
                if (showMarkColorSelected == true) {
                    $("#specialFormMarkColorContainer").html(specialFormMarkColorContent());
                }
                else{$("#specialFormMarkColorContainer").empty();}

                this.ModelBindAndValidation(this.model, this.$el);

            },


            fileChange: function(e){
                var file = e.target.files[0];
                if ( file != undefined ) {
                    var name = file.name;
                    var size = file.size;
                    var type = file.type;
                    this.model.set('filename', name);
                } else {
                    this.model.set('filename', '');
                }

            },
            isAllowedFileExtension:function isAllowedFileExtension(fileExt) {
                var isValid = false;
                var fileExtension = fileExt.toUpperCase();
                $.ajax({
                    url: '/efile/rest/tmdocument/document/image/extensions',
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
                $('#uploadMarkError').empty();
                $('#fileUploadErrorMsgContainer, #fileUploadSuccessMsgContainer').hide();
                $('#fileUploadedMessage').empty();

                event.stopPropagation(); // Stop stuff happening
                event.preventDefault(); // Totally stop stuff happening
                //grab all form data
                //var formData =  new FormData($('#uploadForm'));
                var formData = new FormData();

                var files = document.getElementById('file').files[0];

                if ( files != undefined) {

                    if(files.size > 10485760){
                        $('#fileUploadErrorMsgContainer').show();
                        $('#fileUploadedErrorMessage').text("File size is limited to 10 MB.");
                        return false;
                    }

                    if(!this.isAllowedFileExtension(files.name.split('.')[1])){
                        $('#fileUploadErrorMsgContainer').show();
                        $('#fileUploadedErrorMessage').text("Provided file format is not supported.");
                        return false;
                    }

                    formData.append('file', files);
                    var filename = files.name;

                    var self = this;
                    $.ajax({
                        url: '/efile/rest/tmdocument/upload',
                        type: 'POST',
                        data: formData,
                        async: false,
                        cache: false,
                        contentType: false,
                        processData: false,
                        success: function (returndata) {
                            self.model.set('documentId',returndata);
                            $('#fileUploadSuccessMsgContainer').show();
                            $('#fileUploadedSuccessMessage').text("File uploaded successfully!");
                            $("#continueButton").show();
                        },
                        error: function(xhr, status, text) {
                            console.log(xhr.responseText);
                            //var response = $.parseJSON(xhr.responseText);

                            console.log('Failure!');

                        }
                    });
                }
                else{
                    $('#uploadMarkError').text("please upload file.");
                }

                return false;
            },
            nextBtn: function(e) {
                if ( this.saveMark(e) ) {
                    if(this.markTypeValueSelected === '4'){
                        var navString = '#markStatements/' + this.model.id;
                    }else{
                        var navString = '#markTypeFeatures/' + this.model.id;
                    }
                    this.pageNavigator(navString, true);
                }
            },
            previousPage:function(){
                var currentURL = Backbone.history.fragment
                if(currentURL.indexOf('/')>0){
                    Backbone.history.history.back();
                }else{
                    var navString = '#markDetails';
                    this.pageNavigator(navString, true);
                }
            }

        });

        // Returns the MarkTypeDetailsView class
        return MarkTypeDetailsView;




    }
);
