// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'collections/ownerCollection', 'collections/attorneyCollection','text!templates/ownershipCover.html', 'text!locale/en_us/attorneyDetails.json'],

    function($, jqueryui, Backbone, OwnerCollection, AttorneyCollection, template, content) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var OwnerAttorneyCoverView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            markId: '',
            // View constructor
            initialize: function(attr) {
                this.markId = attr.markId;

            },

            // View Event Handlers
            events: {
                "click #continueButton": "gotoOwnerDetails",
                "click #previousPage": "previousPage"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {

                this.markId = this.model;

                this.collections = {owners: new OwnerCollection()
                   , attorneys: new AttorneyCollection()};
                    // Could not remove Attorney Collection and the template has Attorney commented out but Backbone use replace function on template which tries to replace commented attorney model
                   
                var self = this;

                console.log(this.collections);


                if(this.markId){
                    this.collections.owners.fetch({data: { id: this.markId }, processData: true, async:false});
                }

                self.template = _.template(template, {
                    collections: (self.collections)
                });

                    // Dynamically updates the UI with the view's template
                self.$el.html(self.template);

                // Setting the view's template property using the Underscore template method                
                // Maintains chainability
                return this;

            },

            gotoOwnerDetails: function() {
                if(this.markId!=null) {
                    var navString = '#ownerDetails';
                    this.pageNavigator(navString, true);
                }else{
                    var navString = "#markCover";
                    this.pageNavigator(navString,true);
                }
            }


        });

        // Returns the AppStatusView class
        return OwnerAttorneyCoverView;




    }
);
