// OwnerListView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'collections/ownerCollection', 'collections/attorneyCollection','text!templates/ownerList.html', 'text!locale/en_us/attorneyDetails.json'],

    function($, jqueryui, Backbone, OwnerCollection, AttorneyCollection, template, content) {
        'use strict';

        //Create OwnerListView class which extends Backbone.View
        var OwnerListView = Backbone.View.extend({

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
                "click #addAnotherOwner" : "gotoOwnershipCover",
                "click #editOwner": "editOwner" ,
                "click #ownerDelete": "deleteOwner" ,
                "click #continueButton": "continueButton",
                "click #previousPage": "previousPage"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },
            continueButton:function(){
            	if(this.collections.owners.length > 0){
            		if(this.markId!=null) {
                        var navString = '#contactCover/'+this.markId;
                        this.pageNavigator(navString, true);
                    }else{
                        var navString = "#markCover";
                        this.pageNavigator(navString,true);
                    }
            	}else{
            		this.gotoOwnershipCover();
            	}
            },

            // Renders the view's template to the UI
            render: function() {

                this.markId = this.model;

                this.collections = {owners: new OwnerCollection()
                    // Could not remove Attorney Collection and the template has Attorney commented out but Backbone use replace function on template which tries to replace commented attorney model
                    , attorneys: new AttorneyCollection()};
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
                //hide the "no applicants" div if there are no applicants
                if(self.collections.owners.length > 0){
                	this.$("#noApplicants").hide();
                }
                // Maintains chainability
                return this;

            },

            gotoOwnershipCover: function() {
                if(this.markId!=null) {
                    var navString = '#ownershipCover/'+this.markId;
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
                owner.set('markId', this.markId);
                var self = this;
                if(owner.destroy()) {
                    this.collections.owners.remove(owner);
                    Backbone.history.fragment = null;
                    var navString = '#ownerList/' + self.markId;
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

        // Returns the OwnerListView class
        return OwnerListView;




    }
);
