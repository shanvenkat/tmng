// BasisDetailsView
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/basisDetails.html', 'text!locale/en_us/basisDetails.json', 'collections/basisCollection', 'views/basisTypeView' ],
    function($, jqueryui, Backbone, template, content, BasisCollection, BasisTypeView) {
        'use strict';
        //Create BasisDetailsView class which extends Backbone.View
        var BasisDetailsView = Backbone.View.extend({
            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminPage: false,
            markId: '',
            totalClasses: '',
            totalGoods: '',
            basisTypeValueSelected: '',
            isSelected: false,
            // View constructor
            initialize: function(attrs) {
                this.adminPage = attrs.adminRoute;
                this.model = attrs.model;
                this.markId = this.model.get('markId');
                this.totalClasses = 0;
                this.totalGoods = 0;
            },
            // View Event Handlers
            events: {
                "click input[name=basisLevel]": "buildBasisDetails",
                "change input[name=basisLevel]": "buildBasisDetails",
                'click #continueButton': 'gotoGoodsStatements',
                'click input[name=checkClass]': 'countCheckedByClass',
                'click input[name=checkGood]': 'countCheckedByGood',
                'click #goodChkAll': 'toggleGoodList',
                'click #classChkAll': 'toggleClassList',
                "click #previousPage": "previousPage",
                "click #saveBasis": "saveBasis"
            },
            previousPage: function() {
                Backbone.history.history.back();
            },
            countCheckedByClass: function(e) {
                var isCheckedAll = true;
                var checkBoxes = $('#assignBasisByClass').find('input[name=checkClass]');
                _.each(checkBoxes, function(checkBox) {
                    console.log("aaa");
                    console.log(checkBox.checked);
                    if (!checkBox.checked) {
                        isCheckedAll = false;
                        return false;
                    }
                });
                console.log('isCheckedALl' + isCheckedAll);
                if (isCheckedAll) {
                    $('#classChkAll').prop('checked', true);
                    var label = $('#assignBasisByClass').find('label[for="classChkAll"]')[0];
                    label.className = 'sr-only checked';
                } else {
                    if ($('#classChkAll').is(':checked')) {
                        $('#classChkAll').removeAttr('checked');
                        var label = $('#assignBasisByClass').find('label[for="classChkAll"]')[0];
                        label.className = 'sr-only';
                    }
                }
                self = this;
                self.totalClasses = 0;
                self.totalGoods = 0;
                $('input[name=checkClass]:checked').each(function() {
                    var desc = $(this).closest('tr').find('td:eq(2)').text();
                    var arr = desc.split(',');
                    self.totalClasses = self.totalClasses + 1;
                    self.totalGoods = self.totalGoods + arr.length;
                });
                $("#countGoodsByClass").text(self.totalGoods);
                $("#countClassesByClass").text(self.totalClasses);
            },
            selectedAllGood: function() {
                var isCheckedAll = true;
                var checkBoxes = $('#assignBasisByGood').find('input[name=checkGood]');
                _.each(checkBoxes, function(checkBox) {
                    console.log(checkBox.checked);
                    if (!checkBox.checked) {
                        isCheckedAll = false;
                        return false;
                    }
                });
                if (isCheckedAll) {
                    $('#goodChkAll').prop('checked', true);
                    var label = $('#assignBasisByGood').find('label[for="goodChkAll"]')[0];
                    label.className = 'sr-only checked';

                } else {
                    if ($('#goodChkAll').is(':checked')) {
                        $('#goodChkAll').removeAttr('checked');
                        var label = $('#assignBasisByGood').find('label[for="goodChkAll"]')[0];
                        label.className = 'sr-only';
                    }
                }
            },
            countCheckedByGood: function(e) {
                console.log("countCheckedByGood");
                this.selectedAllGood();
                self = this;
                self.totalClasses = 0;
                self.totalGoods = 0;
                $('input[name=checkGood]:checked').each(function() {
                    self.totalClasses = self.totalClasses + 1;
                    self.totalGoods = self.totalGoods + 1;
                });
                $("#countGoodsByGood").text(self.totalGoods);
                $("#countClassesByGood").text(self.totalClasses);
            },
            // Renders the view's template to the UI
            render: function() {
                var self = this;
                this.collection = new BasisCollection();

                this.template = _.template(template, {
                    basisSelected: this.model.get('basisType')
                });

                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);
                this.basisTypeValueSelected = this.model.get('basisLevel');
                console.log(this.basisTypeValueSelected);
                if (this.basisTypeValueSelected) {
                    this.showBasisDetails();
                }
                //hiding blocks on page load

                //checking if this is admin view
                if (this.adminPage) {
                    this.$('#leftNavContainer').append('Hello')
                }
                // Maintains chainability
                return this;
            },
            saveBasis: function(e) {

                this.model.save(null, {
                    wait: true,
                    url: '/efile/rest/property/baslv',
                    success: function(model, response) {},
                    error: function(model, response) {
                        console.log("error");
                    }
                });
                var self = this;
                this.isSelected = false;
                if (this.basisTypeValueSelected === 'all') {
                    self.isSelected = true;
                    this.collection.each(function(model) {
                        model.set('filingBasisCd', '1(b)')
                    });
                }
                if (this.basisTypeValueSelected === 'class') {
                    this.collection.each(function(model) {
                        model.set('filingBasisCd', 'NOBAS')
                    });
                    $('input[name=checkClass]:checked').each(function() {
                        self.isSelected = true;
                        var id = $(this).closest('tr').find('input:eq(0)').val();
                        var basis = self.collection.get(id);
                        basis.set('filingBasisCd', '1(b)');
                    });
                }
                if (this.basisTypeValueSelected === 'gs') {
                    this.collection.each(function(model) {
                        model.set('filingBasisCd', 'NOBAS')
                    });
                    $('input[name=checkGood]:checked').each(function() {
                        self.isSelected = true;
                        var id = $(this).closest('tr').find('input:eq(0)').val();
                        var basis = self.collection.get(id);
                        basis.set('filingBasisCd', '1(b)');
                    });
                }
                if (!this.isSelected) {
                    $('#basisError').text("You have to select at least one good and service item.")
                } else {
                    this.collection.save();
                }
            },
            toggleGoodList: function(e) {
                var checkBoxes = $('#assignBasisByGood').find('input[name=checkGood]');
                var isChecked = $('#goodChkAll').is(':checked');
                _.each(checkBoxes, function(checkBox) {
                    checkBox.checked = isChecked;
                    var label = $('#assignBasisByGood').find('label[for="' + checkBox.id + '"]')[0];
                    if (isChecked) {
                        label.className = 'sr-only checked';
                    } else {
                        label.className = 'sr-only';
                    }
                });
                this.countCheckedByGood();
            },
            toggleClassList: function(evt) {
                var checkBoxes = $('#assignBasisByClass').find('input[name=checkClass]');
                var isChecked = $('#classChkAll').is(':checked');
                _.each(checkBoxes, function(checkBox) {
                    checkBox.checked = isChecked;
                    var label = $('#assignBasisByClass').find('label[for="' + checkBox.id + '"]')[0];
                    if (isChecked) {
                        label.className = 'sr-only checked';
                    } else {
                        label.className = 'sr-only';
                    }
                });
                this.countCheckedByClass();
            },
            buildBasisDetails: function(evt) {
                this.basisTypeValueSelected = $(evt.currentTarget).val();
                this.model.set('basisLevel', this.basisTypeValueSelected);
                this.showBasisDetails();
            },
            showBasisDetails: function() {
                var pageSize = 15;

                if (this.basisTypeValueSelected === 'all') {
                    this.collection.fetch({
                        data: {
                            markId: this.markId,
                            basisType: this.basisTypeValueSelected,
                            pageSize: pageSize,
                            pageNumber: 1
                        },
                        processData: true,
                        async: false
                    });
                    //next button takes you to next page
                    if (this.basisTypeView == null) {
                        this.basisTypeView = new BasisTypeView({
                            collection: this.collection,
                            markId: this.markId,
                            basisTypeValueSelected: this.basisTypeValueSelected
                        });
                    } else {
                        this.basisTypeView.basisTypeValueSelected = this.basisTypeValueSelected;
                    }
                }
                if (this.basisTypeValueSelected === 'class') {
                    this.collection.fetch({
                        data: {
                            markId: this.markId,
                            basisType: this.basisTypeValueSelected,
                            pageSize: pageSize,
                            pageNumber: 1
                        },
                        processData: true,
                        async: false
                    });
                    this.basisTypeView = new BasisTypeView({
                        collection: this.collection,
                        markId: this.markId,
                        basisTypeValueSelected: this.basisTypeValueSelected
                    });
                }
                if (this.basisTypeValueSelected === 'gs') {
                    this.collection.fetch({
                        data: {
                            markId: this.markId,
                            basisType: this.basisTypeValueSelected,
                            pageSize: pageSize,
                            pageNumber: 1
                        },
                        processData: true,
                        async: false
                    });
                    this.basisTypeView = new BasisTypeView({
                        collection: this.collection,
                        markId: this.markId,
                        basisTypeValueSelected: this.basisTypeValueSelected
                    });
                }
                this.$('#basisTypeContainer').html(this.basisTypeView.render().el);

                var checkboxes;
                if (this.basisTypeValueSelected === 'gs') {
                    checkboxes = $('#assignBasisByGood').find('input[name=checkGood]');
                }
                if (this.basisTypeValueSelected === 'class') {
                    checkboxes = $('#assignBasisByClass').find('input[name=checkClass]');
                }
                console.log(checkboxes);
                _.each(checkboxes, function(checkbox) {

                    Backbone.history.bind("all", function(route, router) {
                        $('input').customInput();
                    });
                    $('input').customInput();
                });
            },
            gotoGoodsStatements: function(e) {
                this.saveBasis();
                console.log(this.isSelected);
                if (this.isSelected) {
                    var navString = '#goodsStatements'
                    if (this.markId != undefined) {
                        navString += '/' + this.markId;
                    }
                    this.pageNavigator(navString, true);
                }
            }
        });
        // Returns the BasisDetailsView class
        return BasisDetailsView;
    }
);