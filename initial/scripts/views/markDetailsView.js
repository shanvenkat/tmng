// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'models/markModel','views/markTypesView', 'text!templates/markDetails.html', 
    'text!templates/markTypeUploadTemplate.html', 'text!locale/en_us/markDetails.json'],

    function($, jqueryui, Backbone, MarkModel, MarkTypeView, template,  markType, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var MarkDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markTypeValueSelected:'',
            markId: '',
            markTypeView: null,
            // View constructor
            initialize: function(attrs) {
                this.markId = attrs.id;

            },

                  

            // View Event Handlers
            events: {
                "click input[name=markType]": "highlightMarkType",
                "click #saveMark": "saveMark",
                "click #previousPage" : "previousPage",
                "click #continueButton": "nextBtn"
            },
        // Renders the view's template to the UI
        render: function() {

            // Setting the view's template property using the Underscore template method
            this.template = _.template(template, {
                content: JSON.parse(content)
            })

            // Dynamically updates the UI with the view's template
            this.$el.html(this.template);

            // Maintains chainability
            return this;

        },
        hideOrShowNext:function(){
            if(this.model.id){
                $("#continueButton").show();
            }else{
                $("#continueButton").hide();
            }
        },
        highlightMarkType: function(e) {

                $.each($('input:radio'),function(index,markType){
                    $(markType).parent().parent().removeClass("selected");
                });
                var selectedRadio;
                if(e !== undefined) {
                    this.markTypeValueSelected = $(e.currentTarget).val();
                     selectedRadio = $(e.currentTarget).parent().parent();
                    selectedRadio.addClass('selected') ;
                }else if(this.model.get('markDrawingTypeCd')){
                    var markTypeCd = this.markTypeValueSelected= this.model.get('markDrawingTypeCd');
                    $('input:radio').filter('[value='+this.markTypeValueSelected+']').prop("checked", true)
                    selectedRadio = $('input:radio').filter('[value='+this.markTypeValueSelected+']').parent();
                    selectedRadio.addClass('selected') ;
                    $.each($('input:radio'),function(index,markType){
                        
                    });
                }

            },
            saveMark: function(e) {
                if(!this.markTypeValueSelected){
                    $("#markTypeError").text("Please select a mark Type.");
                    return false;
                }else{
                    $('#markTypeError').empty();
                    this.model.set('markDrawingTypeCd',this.markTypeValueSelected );
                    var result = false;
                    this.model.save(null, {
                        async: false,
                        success: _.bind(function (model, response) {
                            console.log("success : " + response);
                            result = true;
                            var navString = '#markDetails/' + model.id;
                            this.pageNavigator(navString,true);
                        },this),
                        error: function (model, response) {
                            console.log("error");
                        }
                    });
                    return result;
                }
            },
            previousPage:function(){
                Backbone.history.history.back();
            },
            nextBtn :function(){
                var navString = '#markTypeDetails/'+this.markId;
                this.pageNavigator(navString,true);
            }


        });

        // Returns the AppStatusView class
        return MarkDetailsView;

    }

);
