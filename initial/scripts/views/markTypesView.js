    define(['jquery', 'jqueryui', 'backbone', 'models/markModel','text!templates/markTypeUploadTemplate.html', 'text!locale/en_us/markType.json'],

        function($, jqueryui, Backbone, MarkModel, template, content) {
            'use strict';

        var fileuploaded;
        //Create SearchView class which extends Backbone.View
        var MarkTypeView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: '#markTypeContainer',
            markTypeValueSelected: '',
            // View constructor
            initialize: function(attr) {
               this.markTypeValueSelected = attr.markTypeValueSelected;
            },

            // View Event Handlers
            events: {
                // all of these functions are old functions
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
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                var self = this;
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                   // content: this.model.toJSON(),
                    markTypeValueSelected: this.markTypeValueSelected
                    //mark: this.model.toJSON()
                });

               /* if ( this.model.trademarkId != undefined) {
                    this.showSpecialFormMarkDetails(null, true);
                    this.showSpecialFormMarkColorDetails(null, true);
                    this.showSoundMarkDetails(null, true);
                }*/

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                this.ModelBindAndValidation(this.model, this.$el);

                // Maintains chainability
                return this;

            },

           
            nextBtn: function(e) {
                this.saveMark(e, true);
            }
        });

        // Returns the MarkDetailsView class
        return MarkTypeView;
    }
);
