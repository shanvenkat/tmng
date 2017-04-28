// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/markModel', 'views/markFeaturesView', 'text!templates/markFeatureDetails.html',
        'text!templates/markTypeFeatureTemplate.html', 'text!locale/en_us/markDetails.json'
    ],

    function($, jqueryui, Backbone, MarkModel, MarkTypeView, template, markType, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var MarkTypeFeaturesView = Backbone.View.extend({

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
                "click input[name=colorin]": "showColorDetails",
                "click #saveMark": "saveMark",
                "click #continueButton": "nextBtn",
                "click #previousPage": "previousPage"
            },

            // Renders the view's template to the UI
            render: function() {

                // Setting the view's template property using the Underscore template method
                this.template = _.template(markType, {
                    content: this.model.toJSON(),
                    markTypeValueSelected: this.markTypeValueSelected
                })
                console.log(this.model);
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);
                //markTypeValueSelected: markTypeValueSelected ;

                this.model.bind('change', function() {
                    console.log('Model changed!');
                });
                // Maintains chainability
                return this;

            },
            /*showMarkTypeDetails: function(evt) {
                var markTypeValueSelected = $(evt.currentTarget).val();
                if ( this.markTypeView == null ) {
                    this.markTypeView = new MarkTypeView({
                       // model: new MarkModel(),
                        markTypeValueSelected: markTypeValueSelected
                    });
                } else {
                    this.markTypeView.markTypeValueSelected = markTypeValueSelected;
                }

                this.markTypeView.render();
            },*/
            saveMark: function() {

                $('#uploadMarkError').empty();
                $('#confirmSpecialMark').empty();
                $('#descriptionTypeError').empty();
                $('#markTypeError').empty();
                $('#literalTypeError').empty();
                $('#markSavedMessage').empty();
                $('#colorsTypeError').empty();
                this.model.set('page','markFeartures');
                this.model.set('fileupload', true);
                var regexUTF = /[^\u0000-\u007f]+/;
                var literlaText = $("#literalText").val();
                var descText = $("#description").val();
                var colorText = $("#colors").val();

                if(literlaText !== undefined && literlaText === '' ){
                    $('#literalTypeError').append("Literal Text is required.");
                    return false;
                }else if(literlaText !== undefined &&  regexUTF.test(literlaText)){
                    $('#literalTypeError').text("Literal element must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.");
                    return false;
                }

                if(colorText !== undefined && colorText === ''){
                    $('#colorsTypeError').text("Color description is required.");
                    return false;
                }else if(colorText !== undefined && regexUTF.test(colorText)){
                    $('#colorsTypeError').text("Color description must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.");
                    return false;
                }else if(colorText === undefined){
                    this.model.set('colors',null);
                }

                if (this.model.isValid(true)) {
                    var result = false;
                    this.model.save(null, {
                        async: false,
                        success: _.bind(function(model, response) {
                            console.log("success : " + response);
                            result = true;
                        }, this),
                        error: function(model, response) {
                            console.log("error");
                        }
                    });
                    return result;
                }
            },
            showColorDetails: function(e) {
                var colorTemplate;
                if ($('input:radio[name=colorin]:checked').val() === "true") {
                    console.log("Yes");
                    this.model.set('colorin',true);
                    colorTemplate = _.template($("#yesMarkColorDetails").html());
                } else {
                this.model.set('colorin',false);
                    colorTemplate = _.template($("#noMarkColorDetails").html());
                }
                console.log(this.model);
                $("#specialFormMarkColorContainer").html(colorTemplate());

                this.ModelBindAndValidation(this.model, this.$el);
            },
            previewImage: function(e) {
                var regexUTF = /[^\u0000-\u007f]+/;
                if ( regexUTF.test(this.model.get('standardChar'))) {
                    $('#standardCharError').text("standard character mark must contains characters from http://www.uspto.gov/teas/standardCharacterSet.html.");
                    return;
                }
                if (this.model.get('standardChar') !== null && this.model.get('standardChar') !== '') {
                    var formData = 'text='+this.model.get('standardChar');
                    $.ajax({
                        url: '/efile/rest/tmdocument/converttoimage?text='+this.model.get('standardChar'),
                        type: 'POST',
//                        data: formData,
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
                } else {
                    $('#standardCharError').text("standard character mark cannot be empty.");
                }
            },
            nextBtn: function(e) {
                if (this.saveMark(e)) {
                    var navString = '#markStatements/' + this.model.id;
                    this.pageNavigator(navString, true);
                }
            },
            previousPage: function() {
                    Backbone.history.history.back();
            }




        });

        // Returns the AppStatusView class
        return MarkTypeFeaturesView;




    }
);