define(['jquery', 'jqueryui', 'backbone', 'models/markModel','text!templates/markTypeFeatureTemplate.html', 'text!locale/en_us/markType.json'],

    function($, jqueryui, Backbone, MarkModel, template, content) {
        'use strict';

        var fileuploaded;
        //Create SearchView class which extends Backbone.View
        var MarkFeatureView = Backbone.View.extend({

            // The DOM Element associated with this view
            el: '#markTypeContainer',
            markTypeValueSelected: '',
            // View constructor
            initialize: function(attr) {
               this.markTypeValueSelected = attr.markTypeValueSelected;
            },

            // View Event Handlers
            events: {
                "click input[name=markColor]": "showColorDetails"                
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
            //new code to make the color container appear for different mark type
            showColorDetails: function (evt) {
                var colorRadioValueSelected = $(evt.currentTarget).val(); 
                //alert(colorRadioValueSelected)
                var yesMarkColorContent = _.template($("#yesMarkColorDetails").html());
                var noMarkColorContent = _.template($("#noMarkColorDetails").html());
                if (colorRadioValueSelected === 'colorYes' ){
                    $("#specialFormMarkColorContainer").html(yesMarkColorContent());
                    $('#colorWarning').hide();
                }
                else{
                    $("#specialFormMarkColorContainer").html(noMarkColorContent());
                $('#colorWarning').show();}

                //this.ModelBindAndValidation(this.model, this.$el);

            }

        });

        // Returns the MarkDetailsView class
        return MarkFeatureView;
    }
);
