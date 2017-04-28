define(['collections/locationAutoCompleteCollection', 'collections/nameAutoCompleteCollection', 'helpers/constants'],
    function(LocationAutoCompleteCollection, NameAutoCompleteCollection, Constants) {
        'use strict';

        var AutoCompleteHelper = {

            //this will bind the autocomplete to location field
            bindLocationAutoComplete: function(input, thisView, locTypes, bmodel) {
                this.categoriesResults();
                var self = this;
                $(input).catcomplete({
                    source: $.proxy(this.locationSearch, this, thisView, locTypes),
                    minLength: 2,
                    search: function(event, ui) {
                        self.setModelValues({}, bmodel);
                    },
                    select: function(event, ui) {
                        self.setModelValues(ui.item.object, bmodel);
                    }
                });
            },

            //this will bind the autocomplete to name field
            bindNameAutoComplete: function(input, thisView, bmodel) {

                $(input).autocomplete({
                    source: $.proxy(this.nameSearch, this, thisView),
                    minLength: 2,
                    select: function(event, ui) {
                        bmodel.set({
                            name: ui.item.label
                        });
                    }
                });

            },

            // this method helps set model values
            setModelValues: function(item, model) {
                if (model) {
                    model.set({
                        type: item.category,
                        lat: item.lat,
                        lng: item.lng,
                        state: item.state,
                        isLocValid: true,
                        // dist: 0,
                        sort: (item.category === 'ST') ? Constants.nameSort + '|' + Constants.ascendingSort : Constants.distanceSort + '|' + Constants.ascendingSort
                    });
                    if (item.value) // to avoid conflict with model binder, set the location value only when it is defined
                        model.set('loc', item.value)
                }
            },

            // this method is used to query results for location autocomplete
            locationSearch: function(thisView, locTypes, request, response) {
                thisView.collection = new LocationAutoCompleteCollection();
                thisView.collection.types = locTypes;
                this.autoCompleteSearchHelper(thisView.collection, request, response);
            },

            // this method is used to query results for location autocomplete
            nameSearch: function(thisView, request, response) {
                if (thisView.model.isValidLocation()) {
                    thisView.model.set({
                        dist: '25'
                    });
                    thisView.nameCollection = new NameAutoCompleteCollection();
                    thisView.nameCollection.url = thisView.model.pathToNameSerive(request.term);
                    this.autoCompleteSearchHelper(thisView.nameCollection, request, response);
                }
            },

            //helper for fetching the data
            autoCompleteSearchHelper: function(myCollection, request, response) {
                var that = this;
                $.when(myCollection.search(request.term))
                    .then(function(data) {
                        response(_.map(data, function(d) {
                            return {
                                value: d.value,
                                label: d.label,
                                object: d
                            };
                        }));
                    });
            },

            categoriesResults: function() {
                $.widget("custom.catcomplete", $.ui.autocomplete, {
                    _renderMenu: function(ul, items) {
                        var that = this,
                            currentCategory = "",
                            cat = {
                                ZIP: "Zipcode",
                                CS: "City",
                                ST: "State"
                            };
                        $.each(items, function(index, item) {
                            if (item.object.category != currentCategory) {
                                ul.append("<li class='ui-autocomplete-category'>" + cat[item.object.category] + "</li>");
                                currentCategory = item.object.category;
                            }
                            that._renderItemData(ul, item);
                        });
                    }
                });
            },

            //helper for manually validating location when user doesnt select from the autocomplete suggetions
            triggerVerifyLocation: function(thisView, thisModel) {
                var loc = thisModel.get('loc');
                if (!thisModel.isValidLocation() && loc) {
                    var self = this;
                    thisView.collection = thisView.collection || new LocationAutoCompleteCollection();
                    $.when(thisView.collection.verifyLocation(loc))
                        .done(function(data) {
                            if (data.length > 0) {
                                self.setModelValues(data[0], thisModel);
                            }
                        });
                }
            }

        }

        return AutoCompleteHelper;
    });