define(['jquery', 'jqueryui', 'backbone', 'text!templates/leftNavigationBar.html', 'helpers/helper', 'helpers/constants'],

    function($, jqueryui, Backbone, template, Helper, Constants) {
        'use strict';

        //Create SearchView class which extends Backbone.View
        var LeftNavView = Backbone.View.extend({
            routeURL: false,

            // View constructor
            initialize: function(attrs) {
                this.pageMap ='';
                this.parentSection = '';
                this.routeURL = attrs.linkClicked;
            },

            // View Event Handlers
            events: {

            },
            // Renders the view's template to the UI
            render: function() {
                var homeSectionActive=false;
                var gettingStartedActive=false;
                var markInformationActive=false;
                var goodsInformationActive=false;
                var ownerInformationActive=false;
                var contactInformationActive=false;
                var reviewInformationActive=false;
                var payInformationActive=false;

                // subsections need be active too.
                var markDetailsActive = false;
                var markTypeDetailsActive = false;
                var markTypeFeaturesActive = false;
                var markStatementsActive = false;
                var addClassesAndIDActive = false;
                var addClassesAndIDManualActive = false;
                var addBasisCoverActive = false;
                var internationalBasis1Active = false;
                var internationalBasis2Active = false;
                var identifyBasisActive = false;
                var basisDetailsActive = false;
                var goodsStatementsActive = false;
                var ownerListActive = false;
                var ownershipCoverActive = false;
                var ownerDetailsActive = false;
                var attorneyDetailsActive = false;
                var attorneyDetailsNewActive = false;
                var attorneyInfoActive = false;
                var domesticRepDetailsActive = false;
                var domesticRepInfoActive = false;
                var correspondenceDetailsActive = false;
                var confirmEntriesActive = false;
                var reviewSummaryActive = false;
                var signDetailsActive = false;
                
                this.getAllPageStatusDetails();
                this.isDomesticRepNeeded();

                if (this.routeURL === "appHome" || this.routeURL === "savedAppHome") {
                    homeSectionActive = true;
                } else if (this.routeURL === "getStartedCover") {
                    gettingStartedActive = true;
                } else if (this.routeURL === "markCover" 
                    || this.routeURL === "markDetails" 
                    || this.routeURL === "markTypeDetails" 
                    || this.routeURL === "markTypeFeatures" 
                    || this.routeURL === "markStatements") {
                    markInformationActive = true;
                    this.parentSection = 'MARK';

                    //subsections.
                    if(this.routeURL === "markDetails") markDetailsActive = true;
                    if(this.routeURL === "markTypeDetails") markTypeDetailsActive = true;
                    if(this.routeURL === "markTypeFeatures") markTypeFeaturesActive = true;
                    if(this.routeURL === "markStatements") markStatementsActive = true;

                } else if (this.routeURL === "goodsAndServicesCover" 
                    || this.routeURL === "addClassesAndID" 
                    || this.routeURL === "addClassesAndIDManual" 
                    || this.routeURL === "addBasisCover" 
                    || this.routeURL === "internationalBasis1" 
                    || this.routeURL === "internationalBasis2" 
                    || this.routeURL === "identifyBasis" 
                    || this.routeURL === "basisDetails" 
                    || this.routeURL === "goodsStatements") {

                    goodsInformationActive = true;
                    this.parentSection = 'GOODS';

                    //subsections.
                    if(this.routeURL === "addClassesAndID") addClassesAndIDActive = true;
                    if(this.routeURL === "addClassesAndIDManual") addClassesAndIDManualActive = true;
                    if(this.routeURL === "addBasisCover") addBasisCoverActive = true;
                    if(this.routeURL === "internationalBasis1") internationalBasis1Active = true;
                    if(this.routeURL === "internationalBasis2") internationalBasis2Active = true;
                    if(this.routeURL === "identifyBasis") identifyBasisActive = true;
                    if(this.routeURL === "basisDetails") basisDetailsActive = true;
                    if(this.routeURL === "goodsStatements") goodsStatementsActive = true;

                } else if (this.routeURL === "ownerCover" 
                    || this.routeURL === "ownerList" 
                    || this.routeURL === "ownershipCover" 
                    ||this.routeURL === "ownerDetails") {
                    
                    ownerInformationActive = true;
                    this.parentSection = 'OWNER' ;

                    //subsections.
                    if(this.routeURL === "ownerList") ownerListActive = true;
                    if(this.routeURL === "ownershipCover") ownershipCoverActive = true;
                    if(this.routeURL === "ownerDetails") ownerDetailsActive = true;

                }else if (this.routeURL === "contactCover" 
                  //  || this.routeURL === "attorneyDetails"
                    || this.routeURL === "attorneyDetails_new"
                    || this.routeURL === "attorneyInfo"
                    || this.routeURL === "domesticRepDetails"
                    || this.routeURL === "domesticRepInfo"
                    || this.routeURL === "correspondenceDetails" ) {

                    contactInformationActive = true;
                    this.parentSection = 'CNCT';

                    //subsections.
                    if(this.routeURL === "attorneyDetails") attorneyDetailsActive = true;
                    if(this.routeURL === "attorneyDetails_new") attorneyDetailsNewActive = true;
                    if(this.routeURL === "attorneyInfo") attorneyInfoActive = true;
                    if(this.routeURL === "domesticRepDetails") domesticRepDetailsActive = true;
                    if(this.routeURL === "domesticRepInfo") domesticRepInfoActive = true;
                    if(this.routeURL === "correspondenceDetails") correspondenceDetailsActive = true;


                }else if(this.routeURL === "reviewAndSignCover" 
                    || this.routeURL === "confirmEntries" 
                    || this.routeURL === "reviewSummary" 
                    || this.routeURL === "signDetails") {
                    
                    reviewInformationActive = true;
                    this.parentSection = 'RVSN';

                    //subsections.
                    if(this.routeURL === "confirmEntries") confirmEntriesActive = true;
                    if(this.routeURL === "reviewSummary") reviewSummaryActive = true;
                    if(this.routeURL === "signDetails") signDetailsActive = true;
                }

                
                //setup the overall section checkmarks
                var markCheck = false;
                var goodsCheck = false;
                var applicantCheck = false;
                var contactCheck = false;
                var reviewCheck = false;
                if(this.fullPageMap){
                	//only process if we actually have this data
                	
                	//goods and services section
	                if(this.fullPageMap['addClassesAndID'].reviewStatusCd === 'COMPL' &&
	                	this.fullPageMap['internationalBasis1'].reviewStatusCd === 'COMPL' &&
	                	this.fullPageMap['identifyBasis'].reviewStatusCd === 'COMPL' &&
	                	this.fullPageMap['basisDetails'].reviewStatusCd === 'COMPL' &&
	                	this.fullPageMap['goodsStatements'].reviewStatusCd === 'COMPL'){
	                	goodsCheck = true;
	                }
	                
	                //Mark section
	                if(this.fullPageMap['markDetails'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['markTypeDetails'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['markFeatures'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['markStatements'].reviewStatusCd === 'COMPL'){
	                	markCheck = true;
	                }
	                
	                //Applicant section
	                if(this.fullPageMap['ownerList'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['ownerDetails'].reviewStatusCd === 'COMPL'){
	                	applicantCheck = true;
	                }
	                
	                //contact section
	                if(this.fullPageMap['contactCover'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['attorneyDetails_new'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['attorneyDetails_new'].reviewStatusCd === 'COMPL' &&
	                		this.fullPageMap['correspondenceDetails'].reviewStatusCd === 'COMPL'){
	                	contactCheck = true;
	                }
	                
	                //review section
	                if(this.fullPageMap['signDetails'].reviewStatusCd === 'COMPL'){
	                	reviewCheck = true;
	                }
                }
                console.log(this.fullPageMap);
                // Setting the view's template property using the Underscore template method
                this.template = _.template(template, {
                    homeSectionActive: homeSectionActive,
                    gettingStartedActive: gettingStartedActive,
                    markInformationActive: markInformationActive,
                    goodsInformationActive: goodsInformationActive,
                    ownerInformationActive: ownerInformationActive,
                    contactInformationActive: contactInformationActive,
                    reviewInformationActive: reviewInformationActive,
                    markDetailsActive: markDetailsActive,
                    markTypeDetailsActive: markTypeDetailsActive,  
                    markTypeFeaturesActive: markTypeFeaturesActive,  
                    markStatementsActive: markStatementsActive, 
                    addClassesAndIDActive: addClassesAndIDActive,  
                    addClassesAndIDManualActive: addClassesAndIDManualActive,  
                    addBasisCoverActive: addBasisCoverActive,  
                    internationalBasis1Active: internationalBasis1Active,  
                    internationalBasis2Active: internationalBasis2Active,  
                    identifyBasisActive: identifyBasisActive,  
                    basisDetailsActive: basisDetailsActive,  
                    goodsStatementsActive: goodsStatementsActive,  
                    ownerListActive: ownerListActive,  
                    ownershipCoverActive: ownershipCoverActive,  
                    ownerDetailsActive: ownerDetailsActive,    
                    attorneyDetailsActive: attorneyDetailsActive,  
                    attorneyDetailsNewActive:attorneyDetailsNewActive,
                    attorneyInfoActive: attorneyInfoActive,  
                    domesticRepDetailsActive: domesticRepDetailsActive,  
                    domesticRepInfoActive: domesticRepInfoActive,  
                    correspondenceDetailsActive: correspondenceDetailsActive,  
                    confirmEntriesActive: confirmEntriesActive,  
                    reviewSummaryActive: reviewSummaryActive,  
                    signDetailsActive: signDetailsActive,
                    mark: this.model,
                    pageMap:this.fullPageMap,
                    goodsCheck: goodsCheck,
                    markCheck : markCheck,
                    applicantCheck : applicantCheck,
                    contactCheck : contactCheck,
                    reviewCheck : reviewCheck,
                    domesticRep : this.domesticRep
                });

                this.$el.html(this.template);



                // Maintains chainability
                return this;
            },
            getPageStatusDetails:function() {
                var self = this;
                if(this.model.markId !== null && this.routeURL!=='' && this.routeURL!=='appHome' && this.routeURL!=='savedAppHome' && this.routeURL!=='getStartedCover') {
                    $.ajax({
                        url: '/efile/rest/review/' + this.model.markId + '/' +this.parentSection,
                        async: false,
                        dataType:'json',
                        cache: false,
                        success: function (data) {
                            self.pageMap  = data;
                        },
                        error: function (xhr, status, text) {
                            console.log('Failure:getPageStatusDetails ...');
                        }
                    });
                }
            },
            getAllPageStatusDetails:function() {
                var self = this;
                if(this.model.markId !== null && this.routeURL!=='' && this.routeURL!=='appHome' && this.routeURL!=='savedAppHome' && this.routeURL!=='getStartedCover') {
                    $.ajax({
                        url: '/efile/rest/review/map/' + this.model.markId,
                        async: false,
                        dataType:'json',
                        cache: false,
                        success: function (data) {
                            self.fullPageMap  = data;
                        },
                        error: function (xhr, status, text) {
                            console.log('Failure:getFullPageStatusDetails ...');
                        }
                    });
                }
            },
            isDomesticRepNeeded:function() {
            	var self = this;
                if(this.model.markId !== null && this.routeURL!=='' && this.routeURL!=='appHome' && this.routeURL!=='savedAppHome' && this.routeURL!=='getStartedCover') {
                	var repUrl = '/efile/rest/domesticrep/' + this.model.markId;
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

        // Returns the SearchView class
        return LeftNavView;

    }
);
