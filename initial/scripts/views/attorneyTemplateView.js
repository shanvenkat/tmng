// AttorneyTemplateView .js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/attorneyTemplate.html',
        'models/attorneyModel', 'views/attorneyCountryView', 'views/attorneyListView', 'collections/attorneyCollection'
    ],
    function($, jqueryui, Backbone, template, AttorneyModel, AttorneyCountryView, AttorneyListView, AttorneyCollection) {
        'use strict';
        //Create SearchView class which extends Backbone.View
        var AttorneyTemplateView = Backbone.View.extend({
            model: '',
            markId: '',
            collection: '',
            // View constructor
            initialize: function(attr) {
                this.collection = attr.collection;
                this.markId = attr.markId;
            },
            // View Event Handlers
            events: {
                "click #saveButton": 'saveAttorney',
                "click #addAttorney": 'saveAttorney',
                "click #editAttorney": "editAttorney",
                "click .glyphicon": "stopClickEvent",
                "click #deleteAttorney": "deleteAttorney",
                "click #country": "selectCountry",
                "click input[type=radio]": "changePrimaryAttorney",
                "click #continueButton": "continueButton",
                "click #attorneyEmailPermissionFlag": "attorneyEmailPermission",
                "click #previousPage": "previousPage"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            stopClickEvent: function(e) {
                e.stopPropagation();
                return false;
            },
            changePrimaryAttorney: function(e) {
                var el, col;
                el = $(this);
                col = el.data("col");
                $("input[data-col=" + col + "]").prop("checked", false);
                el.prop("checked", true);
                var self = this;
                var partyId = e.target.id;
                var attorney = this.collection.get(partyId);
                attorney.set('markId', this.markId);
                attorney.set('attorneyType', 'AT');
                attorney.set('nextPrimaryAttorneyId', partyId);
                var url = attorney.urlRoot;
                attorney.save(null, {
                    url: url + '/primaryAttorney',
                    wait: true,
                    success: function(model, response) {
                        self.updatePage();
                    },
                    error: function(model, xhr, response) {
                        if (xhr.status === 200) {
                            self.updatePage();
                        }
                    }
                });
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                var utilityBarExists = true;
                this.collection = new AttorneyCollection();
                this.collection.fetch({
                    data: {
                        markId: this.markId
                    },
                    async: false
                });

                this.model = new AttorneyModel();
                this.template = _.template(template, {
                    content: this.model.toJSON()
                });
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.attorneyListView = new AttorneyListView({
                    collection: this.collection
                });
                this.$('#attorneyListContainer').html(this.attorneyListView.render().el);

                this.attorneyCountryView = new AttorneyCountryView({
                    country: this.model.get('country')
                });
                this.$('#countryContainer').html(this.attorneyCountryView.render().el);

                this.ModelBindAndValidation(this.model, this.$el);
                var checkboxes = this.$('#attorneyListContainer').find('input[type=radio]');
                _.each(checkboxes, function(checkbox) {
                    var label = self.$('#attorneyListContainer').find('label[for="' + checkbox.id + '"]')[0];
                    if (checkbox.value === 'AT') {
                        self.$('#' + checkbox.id + '').prop('checked', true);
                        label.className = 'sr-only checked';
                    }
                });

                // Maintains chainability
                return this;
            },
            attorneyEmailPermission: function(e) {
                var attorneyEmailPermissionFlag = e.currentTarget.checked;
                if ($("#attorneyFilingFlag:checked").val() == undefined && attorneyEmailPermissionFlag) {
                    $('#errorSummary').html("<div class='alert alert-danger'>Please enter attorney information.</div>");
                    $("#attorneyEmailPermissionFlag").attr("checked", false);
                    $("#attorneyEmailPermissionFlag").removeAttr("value");
                    this.model.set('attorneyEmailPermissionFlag', false);
                    return;
                } else {
                    $('#errorSummary').html('');
                }
            },
            editAttorney: function(e) {
                console.log(e.target);
                var attorney = this.collection.get(e.target.name);
                var url = attorney.urlRoot;
                this.model.fetch({
                    url: url + '/info',
                    data: {
                        markId: this.markId,
                        partyId: attorney.get('id'),
                        roleCd: attorney.get('attorneyType')
                    },
                    async: false
                });
                var country = this.model.get('country');
                this.attorneyCountryView = new AttorneyCountryView({
                    country: country
                });
                this.$('#countryContainer').html(this.attorneyCountryView.render().el);
                this.ModelBindAndValidation(this.model, this.$el);
            },
            deleteAttorney: function(e) {
                var self = this;
                var attorney = this.collection.get(e.target.name);
                if (attorney.get('attorneyType') === 'AT') {
                    var index = this.collection.indexOf(attorney);
                    if (!((index + 1) === this.collection.length)) {
                        var primaryAttorney = this.collection.at(index + 1);
                        attorney.set("nextPrimaryAttorneyId", primaryAttorney.get('id'));
                    }
                }
                var partyId = attorney.get('id');
                var roleCd = attorney.get('attorneyType');
                var nextPrimaryAttorneyId = attorney.get('nextPrimaryAttorneyId');

                attorney.destroy({
                    contentType: 'application/json',
                    data: JSON.stringify({
                        markId: this.markId,
                        id: partyId,
                        attorneyType: roleCd,
                        nextPrimaryAttorneyId: nextPrimaryAttorneyId
                    }),
                    success: function() {
                        console.log("success........");
                        self.updatePage();
                    },
                    error: function(model, xhr, response) {
                        if (xhr.status === 200) {
                            self.updatePage();
                        }
                    }
                });
            },
            selectCountry: function(e) {
                e.preventDefault();
                var country = e.currentTarget.value;
                if (country === 'US' || country == 'CA') {
                    $('#foreignAttorneyWarning').hide();
                } else {
                    $('#foreignAttorneyWarning').show();
                }
                this.attorneyCountryView = new AttorneyCountryView({
                    country: country
                });
                this.$('#countryContainer').html(this.attorneyCountryView.render().el);
                this.ModelBindAndValidation(this.model, this.$el);
            },
            saveAttorney: function() {
                var self = this;
                this.model.set('markId', this.markId);
                if (this.model.isValid(true)) {
                    this.model.save(null, {
                        wait: true,
                        success: function(model, response) {
                            console.log("success");
                            /* if (!self.collection.contains(response)) {
                                 self.collection.add(response);
                             } else {
                                 var attorney = self.collection.get(response.id);
                                 attorney.set(response);
                             }
                             self.model.clear();
                             self.attorneyListView = new AttorneyListView({
                                 collection: self.collection
                             });
                             self.$('#attorneyListContainer').html(self.attorneyListView.render().el);*/
                            self.updatePage();
                        },
                        error: function(model, xhr, response) {
                            console.log("error");
                            if (xhr.status === 200) {
                                self.updatePage();
                            }
                        }
                    });
                }
                return false;
            },
            updatePage: function() {
                this.collection = null;
                Backbone.history.fragment = null;
                var navString = '#attorneyInfo/' + this.markId;
                this.pageNavigator(navString, true);
            },
            continueButton: function(e) {
                var self = this;
                this.saveAttorney();
                if (this.collection.size() > 0) {
                    $.ajax({
                        type: 'GET',
                        async: true,
                        url: "/efile/rest/domesticrep/" + this.markId,
                        success: function(data) {
                            if (data) {
                                var navString = '#domesticRepDetails/' + self.markId;
                                self.pageNavigator(navString, true);
                            } else {
                                var navString = '#correspondenceDetails/' + self.markId;
                                self.pageNavigator(navString, true);
                            }
                        },
                        error: function() {
                            alert("error");
                        }
                    });
                }
            }
        });
        return AttorneyTemplateView;
    }
);