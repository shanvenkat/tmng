// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'collections/ownerCollection', 'collections/attorneyCollection','text!templates/contactCover.html', 'text!locale/en_us/attorneyDetails.json'],

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
                "click #addAnotherOwner" : "gotoAttorneyDetails",
                "click #editOwner": "editOwner" ,
                "click #ownerDelete": "deleteOwner" ,
                // "click #addAnotherAttorney": "gotoAttorneyDetails",
                // "click #editAttorney": "editAttorney",
                // "click #deleteAttorney": "deleteAttorney",
                "click #continueButton": "gotoAttorneyDetails",
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
//                    this.collections.attorneys.fetch({data: { markId: this.markId }, processData: true, async:false});
                }

                self.template = _.template(template, {
                    collections: (self.collections)
                });

                    // Dynamically updates the UI with the view's template
                self.$el.html(self.template);

                // Setting the view's template property using the Underscore template method
                /*this.template = _.template(template, {
                    content: JSON.parse(this.model)
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);*/

                
                // Maintains chainability
                return this;

            },

            gotoOwnerList: function() {
                if(this.markId!=null) {
                    var navString = '#ownerList/'+this.markId;
                    this.pageNavigator(navString, true);
                }else{
                    var navString = "#markCover";
                    this.pageNavigator(navString,true);
                }
            },
            gotoAttorneyDetails: function(e) {
                if(this.markId!=null){
                    var navString = '#attorneyDetails_new/'+this.markId;
                    this.pageNavigator(navString, true);
                }else{
                    var navString = "#markCover";
                    this.pageNavigator(navString,true);
                }

            },
            editOwner: function(e) {
                console.log('inside editOwner');
                
                var navString = '#ownerDetails/markId/'+this.markId+'/partyId';
                if ( e.target.name ) {
                    navString += '/' + e.target.name;
                }
                this.pageNavigator(navString, true);
            },
            deleteOwner: function(e) {
                var owner=this.collections.owners.get(e.target.name);
                owner.set('id',e.target.name);
                var self = this;
                if(owner.destroy()) {
                    this.collections.owners.remove(owner);
                    Backbone.history.fragment = null;
                    var navString = '#ownerAttorneyCover/' + self.markId;
                    console.log(navString);
                    self.pageNavigator(navString, true);
                }

            },
            editAttorney: function(e) {
                var self = this;
                var navString = '#';
                if ( e.target.name ) {
                    navString += 'attorneyDetails/' + e.target.name;
                }
                this.pageNavigator(navString, true);
            },
            deleteAttorney: function(e) {
              var attorney=this.collections.attorneys.get(e.target.name);
              attorney.set('markId',this.markId);
              var self = this;
              attorney.destroy({
                  success:function () {
                              alert('deleted successfully');
                              //window.history.back();
                              
                              Backbone.history.fragment = null;

                              var navString = '#ownerAttorneyCover/' + self.markId;
                                console.log(navString);
                                self.pageNavigator(navString, true);
                  }
               });
              return false;
            },
            gotoCorrespondence: function(e) {
                var navString = '#correspondenceDetails/' + this.markId;
                this.pageNavigator(navString, true);
            }


        });

        // Returns the AppStatusView class
        return OwnerAttorneyCoverView;




    }
);
