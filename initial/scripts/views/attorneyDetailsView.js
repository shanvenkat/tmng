// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/attorneyDetails.html', 'text!templates/attorneyDetailsSubTemplate.html',
        'text!templates/otherAttorneyTemplate.html','text!templates/domRepDetailsSubTemplate.html', 'text!locale/en_us/attorneyDetails.json',
        'models/attorneyModel','models/otherAttorneyModel'
    ],

    function($, jqueryui, Backbone, template, AttorneySubTemplate,OtherAttorneyTemplate, DomRepSubTemplate, content, AttorneyModel,OtherAttorneyModel) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var AttorneyDetailsView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {

                // Calls the view's render method
                // Use JqueryEqualHeights to side by side divs equal height
                this.markId = attr.markId;
            },

            // View Event Handlers
            events: {
                "click #attorneyFilingFlag": "attorneySelected",
                "click #domesticRepFlag": "domRepSelected",
                "click #saveAttorneyButton": 'saveAttorney',
                "change #country": "selectCountry",
                "change #domCountry": "selectdomCountry",
                "click #continueButton": "continueButton",
                "click #addAnotherAttorney": "addAnotherAttorney",
                "click #attorneyEmailPermissionFlag": "attorneyEmailPermission",
                "click #previousPage": "previousPage"

            },
            previousPage:function(){
                Backbone.history.history.back();
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                var utilityBarExists = true;

                this.template = _.template(template, {
                    content: this.model.toJSON()
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);


                if (this.model.get('attorneyFilingFlag')) {
                    this.addressAttorneyContent = _.template(AttorneySubTemplate, {});
                    this.$('#addressAttorneyContainer').append(this.addressAttorneyContent);
                }
                var otherAttorneyList = this.model.get('otherAttorneys');
                if((otherAttorneyList!== undefined && otherAttorneyList.length>0)){
                    var otherAttorneyContent;
                    $.each(otherAttorneyList,function(i,otherAttorney){
                        otherAttorneyContent = _.template(OtherAttorneyTemplate, {
                            index:i,
                            model:otherAttorney
                        });
                        $("#otherAttorneyIndex").val(Number(i+1));
                        self.$("#otherAttorneyContainer").append(otherAttorneyContent);
                    });

                }

                if (this.model.get('domesticRepFlag')) {
                    this.addressDRContent = _.template(DomRepSubTemplate, {});
                    this.$('#addressDomesticRepContainer').append(this.addressDRContent);
                }

                this.ModelBindAndValidation(this.model, this.$el);

                this.model.bind('change', function () {
                });

                // Maintains chainability
                return this;

            },
            addAnotherAttorney:function(){
                var otherAttorneyIndex = $("#otherAttorneyIndex").val();

                this.otherAttorneyContent = _.template(OtherAttorneyTemplate, {
                    index:$("#otherAttorneyIndex").val(),
                    model:new OtherAttorneyModel({})
                    });
                this.$('#otherAttorneyContainer').append(this.otherAttorneyContent);
                $("#otherAttorneyIndex").val(Number(otherAttorneyIndex+1));
            },
            //On check event for attoney address
            attorneySelected: function(evt) {

                var showAttorneySelected = evt.currentTarget.checked;

                this.addressAttorneyContent = _.template(AttorneySubTemplate, {});

                if (showAttorneySelected == true) {
                    $('#errorSummary').html('');
                    this.$('#addressAttorneyContainer').append(this.addressAttorneyContent);
                    this.ModelBindAndValidation(this.model, this.$el);

                } else {
                    $("#addressAttorneyContainer").empty();
                }



            },
            attorneyEmailPermission: function(e) {
                var attorneyEmailPermissionFlag = e.currentTarget.checked;

                if ( $("#attorneyFilingFlag:checked").val() == undefined && attorneyEmailPermissionFlag ) {
                    $('#errorSummary').html("<div class='alert alert-danger'>Please enter attorney information.</div>");
                    $("#attorneyEmailPermissionFlag").attr("checked", false);
                    $("#attorneyEmailPermissionFlag").removeAttr("value");
                    this.model.set('attorneyEmailPermissionFlag', false);
                    return;
                } else {
                    $('#errorSummary').html('');
                }

                if ( attorneyEmailPermissionFlag ) {
                    $('#domName').attr('disabled', 'disabled');
                    $('#domDocketNumber').attr('disabled', 'disabled');
                    $('#domAddressNameLn1').attr('disabled', 'disabled');
                    $('#domAddress1').attr('disabled', 'disabled');
                    $('#domAddress2').attr('disabled', 'disabled');
                    $('#domAddress3').attr('disabled', 'disabled');
                    $('#domCountry').attr('disabled', 'disabled');
                    $('#domCity').attr('disabled', 'disabled');
                    $('#domState').attr('disabled', 'disabled');
                    $('#domZip').attr('disabled', 'disabled');
                    $('#domPhone').attr('disabled', 'disabled');
                    $('#domFax').attr('disabled', 'disabled');
                    $('#domEMail').attr('disabled', 'disabled');
                    $('#domEmailPermit').attr('disabled', 'disabled');
                } else {
                    $('#domName').removeAttr('disabled');
                    $('#domDocketNumber').removeAttr('disabled');
                    $('#domAddressNameLn1').removeAttr('disabled');
                    $('#domAddress1').removeAttr('disabled');
                    $('#domAddress2').removeAttr('disabled');
                    $('#domAddress3').removeAttr('disabled');
                    $('#domCountry').removeAttr('disabled');
                    $('#domCity').removeAttr('disabled');
                    $('#domState').removeAttr('disabled');
                    $('#domZip').removeAttr('disabled');
                    $('#domPhone').removeAttr('disabled');
                    $('#domFax').removeAttr('disabled');
                    $('#domEMail').removeAttr('disabled');
                    $('#domEmailPermit').removeAttr('disabled');
                }
            },
            //On check event for dom rep address
            domRepSelected: function(e) {
                var showDomRepSelected = e.currentTarget.checked;

                this.addressDomRepContent = _.template(DomRepSubTemplate, {});

                if (showDomRepSelected == true) {
                        this.$('#addressDomesticRepContainer').append(this.addressDomRepContent);
                    this.ModelBindAndValidation(this.model, this.$el);
                } else {
                    $('#errorSummary').html('');
                    $("#addressDomesticRepContainer").empty();
                }
            },
            selectCountry: function() {
                // If not US, disable the state - Attorney
                $(document).on('click keyup', '#country', function(e) {
                    $('#state').prop("disabled", false);
                    if ($("#country").val() != "US") {
                        $('#state').val('');
                        $('#state').prop("disabled", "disabled");
                    }
                });

            },
            selectdomCountry: function() {
                // If not US, disable the state - Attorney
                $(document).on('click keyup', '#domCountry', function(e) {
                    $('#domState').prop("disabled", false);
                    if ($("#domCountry").val() != "US") {
                        $('#domState').val('');
                        $('#domState').prop("disabled", "disabled");
                    }
                });

            },
            saveAttorney: function() {
                var self = this;
                /*Backbone.Validation.bind(this, {
                    invalid: function(view, attr, error, selector) {
                        var $el = view.$('[name=' + attr + ']'),
                            $group = $el.closest('div');
                        $group.addClass('has-error');
                        $group.find(".help-block").remove();
                        $group.append("<span for=" + attr + " class='help-block'>" + error + "</span>");
                    }
                });*/
                console.log("SAVE ATTORNEY!!");
                var tradeMarkId = this.model.get("markId");
                var interestedPartyId;

                if (this.model.isValid(true)) {

                    //TODO validate otherAttorney before save
                    $.each($(".otherAttorney"),function(index,otherAttorneyHTML){
                        var attorneyFields = $("#otherAttorney"+index+" :input");
                        var otherAttorneys = self.model.get('otherAttorneys');
                        var oAid =attorneyFields[0].value;
                        if(oAid===null || oAid=== ''){
                            otherAttorneys[index] = new OtherAttorneyModel({
                                id:attorneyFields[0].value,
                                oAFirstName:attorneyFields[1].value,
                                oAFamilyName:attorneyFields[2].value,
                                oAMiddleName:attorneyFields[3].value,
                                oASuffix:attorneyFields[4].value
                            });
                        }else{
                            otherAttorneys[index].oAFirstName = attorneyFields[0].value,
                            otherAttorneys[index].oAFirstName = attorneyFields[1].value,
                            otherAttorneys[index].oAFamilyName=attorneyFields[2].value,
                            otherAttorneys[index].oAMiddleName=attorneyFields[3].value,
                            otherAttorneys[index].oASuffix=attorneyFields[4].value
                        }
                    });

                    console.log("valid");
                    this.model.save(null, {
                        async: true,
                        success: function(model, response) {
                            console.log('Successfully saved!');
                            interestedPartyId = response.entity;
                            if (interestedPartyId) {
                                console.log("enter if");
                                var navString = '#attorneyDetails/' + interestedPartyId;
                                console.log(navString);
                                self.pageNavigator(navString, true);
                            }


                        },
                        error: function(model, response) {
                            if(response.status == 200) {
                                interestedPartyId = response.entity;
                                if (interestedPartyId) {
                                    console.log("enter else in save ");
                                    var navString = '#attorneyDetails/' + interestedPartyId;
                                    console.log(navString);
                                    self.pageNavigator(navString, true);
                                }
                            } else {
                            console.log(response.responseText);
                        }
                        }
                    });


                    return false;
                }

            },
            continueButton: function(e) {
                this.saveAttorney();
                var navString = '#correspondenceDetails/' + this.markId;
                this.pageNavigator(navString, true);
            }

        });

        return AttorneyDetailsView;
    }
);