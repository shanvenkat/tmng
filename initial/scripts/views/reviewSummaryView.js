// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone',  'text!templates/reviewSummary.html','models/summaryReviewModel'],

    function($, jqueryui, Backbone, template,SummaryReviewModel) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var ReviewAndSignCoverView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminPage:false,
            markId: '',

            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;   
                this.markId = attrs.markId;       
            },

            // View Event Handlers
            events: {
                'click a[name=pageUrl]': 'navigateToPage',
                'click #continueButton': 'gotoSignDetails'
            },

            // Renders the view's template to the UI
            render: function() {
            	this.isDomesticRepNeeded();
                this.model = new SummaryReviewModel({id:this.markId});
                this.model.fetch({
                    async: false
                });

                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    markId : this.markId,
                    summaryReviews : this.model.get('summaryReviews'),
                    domesticRep : this.domesticRep
                })

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);

                //checking if this is admin view
                if (this.adminPage)
                {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;

            },
            navigateToPage:function(e){
                var navString = '#';
                    navString += e.currentTarget.id;
                this.pageNavigator(navString, true);
            },
            gotoSignDetails: function(e) {
                var navString = '#signDetails'
                if ( this.markId != undefined) {
                    navString += '/' + this.markId;
                }
                this.pageNavigator(navString, true);
            },
            isDomesticRepNeeded:function() {
            	var self = this;
                if(this.markId !== null && this.routeURL!=='' && this.routeURL!=='appHome' && this.routeURL!=='savedAppHome' && this.routeURL!=='getStartedCover') {
                	var repUrl = '/efile/rest/domesticrep/' + this.markId;
                    $.ajax({
                        url: repUrl,
                        async: false,
                        dataType:'json',
                        cache: false,
                        success: function (data) {
                            self.domesticRep  = data;
                        },
                        error: function (xhr, status, text) {
                            console.log('Failure:isDomesticRepNeeded ...');
                        }
                    });
                }
            }
            
        });

        // Returns the ReviewAndSignCoverView class
        return ReviewAndSignCoverView;




    }
);
