// DesktopRouter.js
// ----------------
define(['jquery', 'backbone', 'views/appStatusView', 'views/appHomeView', 'views/savedAppHomeView', 'views/getStartedCoverView',
        'views/markCoverView', 'views/markTypesView', 'views/markDetailsView', 'views/markTypeDetailsView', 'views/markTypeFeaturesView',
        'views/markStatementsView', 'views/goodsAndServicesCoverView', 'views/addClassesAndIDView', 'views/addClassesAndIDManualView',
        'views/addBasisCoverView', 'views/internationalBasis1View', 'views/internationalBasis2View', 'views/identifyBasisView',
        'views/basisDetailsView', 'views/goodsStatementsView','views/ownerAttorneyCoverView', 'views/ownerListView', 'views/ownershipCoverView', 
        'views/ownerDetailsView','views/ownerDetailsBusinessView', 'views/ownerDetailsIndividualView',
        'views/contactCoverView', 'views/attorneyDetailsView', 'views/attorneyDetailsView_new', 'views/attorneyTemplateView',
        'views/domesticRepDetailsView', 'views/domesticRepTemplateView', 'views/correspondenceDetailsView', 'views/reviewAndSignCoverView',
        'views/confirmEntriesView', 'views/reviewSummaryView', 'views/signDetailsView', 'models/ownerModel', 'models/attorneyModel', 'models/markModel',
        'models/signatureModel', 'views/leftNavView', 'views/utilityBarView','collections/markCollection', 'models/correspondenceModel', 'models/basisModel',
        'models/appPropertyModel', 'collections/attorneyCollection', 'models/domesticRepModel'
    ],
    function($, Backbone, AppStatusView, AppHomeView, SavedAppHomeView, GetStartedCoverView, MarkCoverView, MarkTypeView,
        MarkDetailsView, MarkTypeDetailsView, MarkTypeFeaturesView, MarkStatementsView, GoodsAndServicesCoverView,
        AddClassesAndIDView, AddClassesAndIDManualView, AddBasisCoverView, InternationalBasis1View, InternationalBasis2View,
        IdentifyBasisView, BasisDetailsView, GoodsStatementsView,
        OwnerAttorneyCoverView, OwnerListView, OwnershipCoverView, OwnerDetailsView, OwnerDetailsBusinessView, OwnerDetailsIndividualView,
        ContactCoverView, AttorneyDetailsView, AttorneyDetailsView_new, AttorneyTemplateView, DomesticRepDetailsView, DomesticRepTemplateView,
        CorrespondenceDetailsView, ReviewAndSignCoverView, ConfirmEntriesView, ReviewSummaryView, SignDetailsView,
        OwnerModel, AttorneyModel, MarkModel, SignatureModel,
        LeftNavView, UtilityBarView, MarkCollection, CorrespondenceModel, BasisModel, AppPropertyModel, AttorneyCollection, DomesticRepModel) {

        var Router = Backbone.Router.extend({
            initialize: function() {
                this.listenTo(this, 'route', this.routerChanged);
                // Tells Backbone to start watching for hashchange events
                Backbone.history.start();
            },
            // All of your Backbone Routes (add more)
            routes: {
                "": "appHome",
                "appHome": "appHome",
                "savedAppHome": "savedAppHome",
                "getStartedCover": "getStartedCover",
                "markCover": "markCover",
                "markCover/:id": "markCover",
                "admin/markCover": "markCover",
                "admin/markCover/:id": "markCover",
                "markDetails": "markDetails",
                "markDetails/:id": "markDetails",
                "markTypeDetails": "markTypeDetails",
                "markTypeDetails/:id": "markTypeDetails",
                "markTypeFeatures": "markTypeFeatures",
                "markTypeFeatures/:id": "markTypeFeatures",
                "markStatements": "markStatements",
                "markStatements/:id": "markStatements",
                "goodsAndServicesCover": "goodsAndServicesCover",
                "goodsAndServicesCover/:id": "goodsAndServicesCover",
                "internationalBasis1": "internationalBasis1",
                "internationalBasis1/:id": "internationalBasis1",
                "internationalBasis2": "internationalBasis2",
                "internationalBasis2/:id": "internationalBasis2",
                "addClassesAndID": "addClassesAndID",
                "addClassesAndID/:id": "addClassesAndID",
                "addClassesAndIDManual": "addClassesAndIDManual",
                "addClassesAndIDManual/:id": "addClassesAndIDManual",
                "addBasisCover": "addBasisCover",
                "addBasisCover/:id": "addBasisCover",
                "identifyBasis": "identifyBasis",
                "identifyBasis/:id": "identifyBasis",
                "basisDetails": "basisDetails",
                "basisDetails/:id": "basisDetails",
                "goodsStatements": "goodsStatements",
                "goodsStatements/:id": "goodsStatements",
                "ownerCover": "ownerCover",
                "ownerCover/:id": "ownerCover",
                "ownerList": "ownerList",
                "ownerList/:id": "ownerList",
                "ownershipCover": "ownershipCover",
                "ownershipCover/:id": "ownershipCover",
                "ownerDetailsIndividual/markId/:markId(/partyId/:partyId)": "ownerDetailsIndividual",
                "ownerDetailsBusiness/markId/:markId(/partyId/:partyId)": "ownerDetailsBusiness",
                "ownerDetails": "ownerDetails",
                "ownerDetails/markId/:markId/partyId/:partyId": "ownerDetails",
                "admin/ownerDetails": "ownerDetails",
                "contactCover": "contactCover",
                "contactCover/:id": "contactCover",
                "attorneyDetails": "attorneyDetails",
                "attorneyDetails/:markId": "attorneyDetails",
                "attorneyDetails_new": "attorneyDetails_new",
                "attorneyDetails_new/:markId": "attorneyDetails_new",
                "attorneyInfo": "attorneyInfo",
                "attorneyInfo/:markId": "attorneyInfo",
                "domesticRepDetails": "domesticRepDetails",
                "domesticRepDetails/:markId": "domesticRepDetails",
                "domesticRepInfo": "domesticRepInfo",
                "domesticRepInfo/:markId": "domesticRepInfoById",
                "domesticRepInfo/:markId?attorney=:attorneyIn": "domesticRepInfoByIdAndAttorney",
                "correspondenceDetails": "correspondenceDetails",
                "correspondenceDetails/:id": "correspondenceDetails",
                "reviewAndSignCover": "reviewAndSignCover",
                "reviewAndSignCover/:id": "reviewAndSignCover",
                "confirmEntries": "confirmEntries",
                "confirmEntries/:id": "confirmEntries",
                "reviewSummary": "reviewSummary",
                "reviewSummary/:id": "reviewSummary",
                "signDetails": "signDetails",
                "signDetails/:id": "signDetails"
            },
            appStatus: function() {
                var markList = new MarkCollection();
                this.appStatusView = new AppStatusView({
                    model: markList
                });
                var self = this;
                markList.fetch().done(function() {
                    $('#main-content').html(self.appStatusView.render().el);
                });

            },
            appHome: function() {
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                this.appHomeView = new AppHomeView({
                    adminRoute: isAdmin
                });
                $('#main-content').html(this.appHomeView.render().el);

            },
            savedAppHome: function() {
                var markList = new MarkCollection();
                this.savedAppHomeView = new SavedAppHomeView({
                    model: markList
                });
                var self = this;

                this.leftNavView = new LeftNavView({

                });
                markList.fetch().done(function() {
                    $('#main-content').html(self.savedAppHomeView.render().el);
                    $('#main-content').find('#leftNavContainer').html(self.leftNavView.render().el);
                });
            },
            getStartedCover: function() {
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                this.getStartedCoverView = new GetStartedCoverView({
                    adminRoute: isAdmin
                });
                $('#main-content').html(this.getStartedCoverView.render().el);
            },
            markCover: function(id) {
                this.markId = id;
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                this.markCoverView = new MarkCoverView({
                    adminRoute: isAdmin,
                    markId: id
                });
                $('#main-content').html(this.markCoverView.render().el);
            },
            markDetails: function(id) {
                this.markId = id;
                var markModel = new MarkModel({
                    id: this.markId
                });
                if (id) {
                    markModel.fetch({
                        async: false
                    });
                }
                this.markDetailsView = new MarkDetailsView({
                    id: id,
                    model: markModel,
                    markTypeValueSelected: markModel.get('markDrawingTypeCd')
                });
                $('#main-content').html(this.markDetailsView.render().el);
                this.markDetailsView.highlightMarkType();
                this.markDetailsView.hideOrShowNext();
            },
            markTypeDetails: function(id) {
                this.markId = id;
                if (id !== undefined && id !== null) {
                    var markModel = new MarkModel({
                        id: this.markId
                    });

                    markModel.fetch({
                        async: false
                    });

                    this.markTypeDetailsView = new MarkTypeDetailsView({
                        id: id,
                        model: markModel,
                        markTypeValueSelected: markModel.get('markDrawingTypeCd')
                    });
                    $('#main-content').html(this.markTypeDetailsView.render().el);
                } else {
                    this.markDetails();
                }
            },
            markTypeFeatures: function(id) {
                this.markId = id;
                if (id !== undefined && id !== null) {
                    var markModel = new MarkModel({
                        id: this.markId
                    });
                    markModel.fetch({
                        async: false
                    });

                    var markType = markModel.get('markDrawingTypeCd');
                    if (markType === '4') {
                        this.markStatements(id);
                    } else {
                        this.markTypeFeaturesView = new MarkTypeFeaturesView({
                            id: id,
                            model: markModel,
                            markTypeValueSelected: markType
                        });

                        $('#main-content').html(this.markTypeFeaturesView.render().el);
                        this.markTypeFeaturesView.showColorDetails();
                        this.markTypeFeaturesView.previewImage();
                    }
                } else {
                    this.markDetails();
                }

            },
            markStatements: function(id) {
                this.markId = id;
                this.markStatementsView = new MarkStatementsView({
                    markId: id
                });
                $('#main-content').html(this.markStatementsView.render().el);

            },
            goodsAndServicesCover: function(id) {
                this.markId = id;
                this.goodsAndServicesCoverView = new GoodsAndServicesCoverView({
                    markId: id
                });
                $('#main-content').html(this.goodsAndServicesCoverView.render().el);

            },
            addClassesAndID: function(id) {
                this.markId = id;
                this.addClassesAndIDView = new AddClassesAndIDView({
                    markId: id
                });
                $('#main-content').html(this.addClassesAndIDView.render().el);

            },
            addClassesAndIDManual: function(id) {
                this.markId = id;
                this.addClassesAndIDManualView = new AddClassesAndIDManualView({
                    markId: id
                });
                $('#main-content').html(this.addClassesAndIDManualView.render().el);

            },
            addBasisCover: function(id) {
                this.markId = id;
                this.addBasisCoverView = new AddBasisCoverView({
                    markId: id
                });
                $('#main-content').html(this.addBasisCoverView.render().el);
            },
            internationalBasis1: function(id) {
                if (id) {
                    if (!this.appPropertyModel) {
                        this.appPropertyModel = new AppPropertyModel({
                            markId: id
                        });
                        this.appPropertyModel.fetch({
                            data: {
                                markId: id
                            },
                            async: false
                        });
                    }
                    this.internationalBasis1View = new InternationalBasis1View({
                        model: this.appPropertyModel
                    });
                    $('#main-content').html(this.internationalBasis1View.render().el);
                }
            },
            internationalBasis2: function(id) {
                if (id) {
                    if (!this.appPropertyModel) {
                        this.appPropertyModel = new AppPropertyModel({
                            markId: id
                        });
                        this.appPropertyModel.fetch({
                            data: {
                                markId: id
                            },
                            async: false
                        });
                    }
                    this.internationalBasis2View = new InternationalBasis2View({
                        model: this.appPropertyModel
                    });
                    $('#main-content').html(this.internationalBasis2View.render().el);
                }
            },
            identifyBasis: function(id) {
                if (id) {
                    if (!this.appPropertyModel) {
                        this.appPropertyModel = new AppPropertyModel({
                            markId: id
                        });
                        this.appPropertyModel.fetch({
                            data: {
                                markId: id
                            },
                            async: false
                        });
                    }
                    this.identifyBasisView = new IdentifyBasisView({
                        model: this.appPropertyModel
                    });
                    $('#main-content').html(this.identifyBasisView.render().el);
                }

            },
            basisDetails: function(id) {
                if (id) {
                    if (!this.appPropertyModel) {
                        this.appPropertyModel = new AppPropertyModel({
                            markId: id
                        });
                        this.appPropertyModel.fetch({
                            data: {
                                markId: id
                            },
                            async: false
                        });
                    }
                    this.basisDetailsView = new BasisDetailsView({
                        model: this.appPropertyModel
                    });
                    $('#main-content').html(this.basisDetailsView.render().el);
                }
            },
            goodsStatements: function(id) {
                this.markId = id;
                this.goodsStatementsView = new GoodsStatementsView({
                    markId: this.markId
                });
                $('#main-content').html(this.goodsStatementsView.render().el);

            },
            ownerCover: function(id) {
                this.markId = id;
                this.ownerAttorneyCoverView = new OwnerAttorneyCoverView({
                    model: id,
                    markId: this.markId
                });
                $('#main-content').html(this.ownerAttorneyCoverView.render().el);

            },
            ownerList: function(id) {
                this.markId = id;
                this.ownerListView = new OwnerListView({
                    model: id,
                    markId: this.markId
                });
                $('#main-content').html(this.ownerListView.render().el);

            },
            ownershipCover: function(id) {
                this.markId = id;
                this.ownershipCoverView = new OwnershipCoverView({
                    model: id,
                    markId: this.markId
                });
                $('#main-content').html(this.ownershipCoverView.render().el);

            },
            ownerDetails: function(markId, partyId) {
                var ownerOne;
                if (markId && partyId) {
                    console.log('fetch begin');
                    ownerOne = new OwnerModel({
                        markId: markId,
                        id: partyId
                    });
                    ownerOne.fetch({
                        async: false
                    });
                    console.log('fetch done');
                } else {
                    ownerOne = new OwnerModel({
                        markId: this.markId
                    });
                }
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin") {
                    isAdmin = true;
                }
                this.ownerDetailsView = new OwnerDetailsView({
                    adminRoute: isAdmin,
                    markId: this.markId,
                    model: ownerOne
                        //  model: ownerOne
                });

                $('#main-content').html(this.ownerDetailsView.render().el);
                if (ownerOne.get("individual") === true) {
                    $('#ownerTypeRD1').attr('checked', 'checked');
                    this.ownerDetailsIndividual(this.markId, ownerOne.id);
                }
                if (ownerOne.get("individual") === false) {
                    $('#ownerTypeRD2').attr('checked', 'checked');
                    $('#ownerTypeRD2').trigger('click');
                }

            },
            ownerDetailsBusiness: function(markId, partyId) {
                var ownerOne;
                if (markId && partyId) {
                    console.log('fetch begin');
                    ownerOne = new OwnerModel({
                        markId: markId,
                        id: partyId
                    });
                    ownerOne.fetch({
                        async: false
                    });
                    console.log('fetch done');
                } else {
                    ownerOne = new OwnerModel({
                        markId: this.markId
                    });
                }
                this.ownerDetailsBusinessView = new OwnerDetailsBusinessView({
                    model: ownerOne,
                    markId: markId
                });
                this.ownerDetailsBusinessView.render();

            },
            ownerDetailsIndividual: function(markId, partyId) {
                console.debug('Inside ownerDetailsIndividual');
                console.debug('markId:' + markId + ', partyId:' + partyId);
                var ownerOne;
                if (markId && partyId) {
                    console.log('fetch begin');
                    ownerOne = new OwnerModel({
                        markId: markId,
                        id: partyId
                    });
                    ownerOne.fetch({
                        async: false
                    });
                    console.log('fetch done');
                } else {
                    ownerOne = new OwnerModel({
                        markId: this.markId
                    });
                }
                this.ownerDetailsIndividualView = new OwnerDetailsIndividualView({
                    model: ownerOne,
                    markId: markId
                });
                this.ownerDetailsIndividualView.render();

            },
            contactCover: function(id) {
                this.markId = id;
                this.contactCoverView = new ContactCoverView({
                    model: id,
                    markId: this.markId
                });
                $('#main-content').html(this.contactCoverView.render().el);

            },
            attorneyDetails: function(markId) {
                var attorney;
                this.markId = markId;
                if (markId) {
                    attorney = new AttorneyModel({
                        markId: markId
                    });
                    attorney.fetch({
                        async: false
                    });
                } else {
                    this.appStatus();
                }
                this.attorneyDetailsView = new AttorneyDetailsView({
                    model: attorney,
                    markId: this.markId
                });

                $('#main-content').html(this.attorneyDetailsView.render().el);
            },
            attorneyDetails_new: function(id) {
                this.markId=id;
                this.attorneyList = new AttorneyCollection();
                this.attorneyList.fetch({
                    data: {
                        markId: id
                    },
                    async: false
                });
                this.attorneyDetailsView_new = new AttorneyDetailsView_new({
                    collection: this.attorneyList,
                    markId: id
                });
                $('#main-content').html(this.attorneyDetailsView_new.render().el);
            },
            attorneyInfo: function(id) {
                this.markId=id;
                this.attorneyTemplateView = new AttorneyTemplateView({
                    collection: this.attorneyList,
                    markId: id
                });
                $('#main-content').html(this.attorneyTemplateView.render().el);
            },
            domesticRepDetails: function(id) {
                this.markId = id;
                this.domesticRep = new DomesticRepModel();
                this.domesticRep.fetch({
                    data: {
                        markId: id,
                        attorneyIn: false
                    },
                    async: false
                });
                this.domesticRep.set("country", "US");
                this.domesticRepDetailsView = new DomesticRepDetailsView({
                    model: this.domesticRep,
                    markId: this.markId
                });
                $('#main-content').html(this.domesticRepDetailsView.render().el);
            },
            domesticRepInfoById: function(id) {
                this.markId = id;
                this.domesticRepTemplateView = new DomesticRepTemplateView({
                    model: this.domesticRep,
                    markId: this.markId
                });
                $('#main-content').html(this.domesticRepTemplateView.render().el);

            },
            domesticRepInfoByIdAndAttorney: function(id, attorneyIn) {
                this.markId = id;
                if (attorneyIn) {
                    attorneyIn = attorneyIn.replace('attorney=', '');
                }
                if (this.domesticRep) {
                    this.domesticRep.set('attorneyIn', attorneyIn);

                }
                this.domesticRepTemplateView = new DomesticRepTemplateView({
                    model: this.domesticRep,
                    markId: this.markId
                });
                $('#main-content').html(this.domesticRepTemplateView.render().el);

            },
            correspondenceDetails: function(id) {
                this.markId = id;
                var correspondenceModel = new CorrespondenceModel();
                correspondenceModel.fetch({
                    data: {
                        markId: id
                    },
                    async: false
                });

                this.correspondenceDetailsView = new CorrespondenceDetailsView({
                    model: correspondenceModel,
                    markId: this.markId
                });

                $('#main-content').html(this.correspondenceDetailsView.render().el);
            },
            reviewAndSignCover: function(id) {
                this.markId = id;
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                this.reviewAndSignCoverView = new ReviewAndSignCoverView({
                    adminRoute: isAdmin,
                    markId: id
                });
                $('#main-content').html(this.reviewAndSignCoverView.render().el);

            },
            confirmEntries: function(id) {
                this.markId = id;
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                this.confirmEntriesView = new ConfirmEntriesView({
                    adminRoute: isAdmin,
                    markId: id
                });
                $('#main-content').html(this.confirmEntriesView.render().el);

            },
            reviewSummary: function(id) {
                this.markId = id;
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin")
                    isAdmin = true;
                if (id) {
                    this.reviewSummaryView = new ReviewSummaryView({
                        adminRoute: isAdmin,
                        markId: id
                    });
                    $('#main-content').html(this.reviewSummaryView.render().el);
                } else {
                    this.markDetails(id);
                }

            },
            signDetails: function(id) {
                this.markId = id;
                var isAdmin = false;
                if (Backbone.history.fragment.split("/")[0] == "admin") {
                    isAdmin = true;
                }

                this.signDetailsView = new SignDetailsView({
                    adminRoute: isAdmin,
                    markId: id
                        //         model: signature
                });
                $('#main-content').html(this.signDetailsView.render().el);

            },
            //router helper function for breadcrumbs view
            routerChanged: function(e) {

                var currentLink = Backbone.history.fragment;
                var attorneyIn=false;

                if (currentLink.indexOf('/') >= 0) {
                    currentLink = currentLink.substring(0, currentLink.indexOf('/'));
                }

                this.leftNavView = new LeftNavView({
                    linkClicked: currentLink,
                    model: {
                        markId: this.markId
                    }
                });


                $('#leftNavContainer').html(this.leftNavView.render().el);

                this.utilityBarView = new UtilityBarView({
                    model: {
                        markId: this.markId
                    }
                });

                if (currentLink !== "appStatus") {
                    //not appending utilityBar based on wireframe update
                }
            }
        });
        // Returns the DesktopRouter class
        return Router;

    }

);