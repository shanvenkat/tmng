define(['jquery', 'jqueryui', 'backbone', 'models/basisModel', 'text!templates/basisTypeTemplate.html', 'collections/basisCollection'],

    function($, jqueryui, Backbone, BasisModel, template, BasisCollection) {
        'use strict';
        //Create SignTypeView class which extends Backbone.View
        var BasisTypeView = Backbone.View.extend({
            // The DOM Element associated with this view
            //el: '#basisTypeContainer',
            basisTypeValueSelected: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.basisTypeValueSelected = attr.basisTypeValueSelected;
                this.markId = attr.markId;
                this.collection = attr.collection;
            },
            // View Event Handlers
            events: {
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    collection: (self.collection),
                    basisTypeValueSelected: this.basisTypeValueSelected
                });
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                if (this.basisTypeValueSelected === 'gs' || this.basisTypeValueSelected === 'class') {

                    $('#pagination').pagination({
                        items: self.collection.totalResults,
                        itemsOnPage: self.collection.pageSize,
                        currentPage: self.collection.currentPage,
                        //cssStyle: 'light-theme',
                        onPageClick: function(pageNumber, event) {
                            // Callback triggered when a page is clicked
                            // Page number is given as an optional parameter;
                            self.getData(pageNumber);
                            return false;
                        }
                    });
                }
                // Maintains chainability
                return this;

            },
            getData: function(pageNumb) {
                var self = this;
                this.collection.fetch({
                    data: {
                        markId: this.markId,
                        basisType: this.basisTypeValueSelected,
                        pageSize: self.collection.pageSize,
                        pageNumber: pageNumb
                    },
                    processData: true,
                    async: false
                });
                this.render();
            }
        });
        // Returns the SignTypeView class
        return BasisTypeView;
    }
);