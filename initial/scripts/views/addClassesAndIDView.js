// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone',  'models/GSModel', 'collections/GSCollection', 'text!templates/addClassesAndID.html', 'helpers/jquery.simplePagination','text!locale/en_us/addClassesAndIDDetails.json'],

    function($, jqueryui, Backbone, GSModel, GSCollection, template, simplePagination, content) {
        'use strict';

        //Create AddClassesAndIDView class which extends Backbone.View
        var AddClassesAndIDView = Backbone.View.extend({

            // The DOM Element associated with this view
            //el: 'main-content',
            model: '',
            adminMode:false,
            

            // View constructor
            initialize: function(attrs) {
                this.adminMode = attrs.adminRoute;   
                this.markId = attrs.markId;       
            },

            // View Event Handlers
            events: {
                'click #continueButton': 'gotoNextPage',
                'click #search' : 'search',
                "click #addselectedGS": "addselectedGS",
                "click #removeGS": "removeGS",
                "click #previousPage": "previousPage",
                "click #removeCkAll" : "toggleGS",
                "click #manualEntry" : "gotoManualEntry"
            },
            previousPage:function(){
                Backbone.history.history.back();
            },
            

            // Renders the view's template to the UI
            render: function() {
                
                var self = this;
                this.collections = new GSCollection();

                if(this.markId){
                    this.collections.fetch({data: { id: this.markId }, processData: true, async:false});
                }
                // Setting the view's template property using the Underscore template method
                var template1 = _.template($(template).filter('#addclassandid').html(), {
                    //content: JSON.parse(content)
                   collections: (self.collections)

                });


                // Dynamically updates the UI with the view's template
                this.$el.html(template1);

                $(document).on('keydown','#searchText', function(event) {
                  if (event.keyCode == 13) {
                    console.log('Enter was pressed');
                    self.search();
                  }
                });
                //checking if this is admin view
                if (this.adminMode)
                { 
                    this.$('#leftNavContainer').append('Hello')
                }

                this.$('#addselectedContainer, #searchresult').hide();
                this.$('#noresults').hide();
                    
                $( "select#page-rows" ).change(function() {
                    	this.rows = 15;  
                        var pgSrch = "&pageNum=" + startPg + "&rows=" + rows;
                        var querySrch = this.paramSrch + pgSrch;
                    //}
                    var myURL= "/efile/rest/idmsearch?".concat(querySrch);
                    $.getJSON(myURL)
                        .done(function (data) {
                            $(function() {
                                $('#pagination').pagination({
                                    items: data.numFound,
                                    itemsOnPage: rows,
                                    //cssStyle: 'light-theme',
                                    onPageClick: function(pageNumber, event) {
                                        // Callback triggered when a page is clicked
                                        // Page number is given as an optional parameter;
                                        self.getData(pageNumber);
                                        return false;
                                    },
                                    onInit: function() {
                                    }
                                });
                            });
                            self.rebind(data);
                            self.displayData(data);
                        });
                });
                // Maintains chainability
                _(function(){
                	setupSelectedPagination();
                }).defer();
                return this;

            },
            search: function() {
                this.paramSrch = 'search-term=' + $('#searchText').val();
                var startPg = 1;
                var currentPage = 1;
                var pgSrch = "&pageNum=" + startPg + "&rows=15" ;
                var querySrch = this.paramSrch + pgSrch;
                var myURL= "/efile/rest/idmsearch?".concat(querySrch);
                var self = this;
                $.getJSON(myURL)
                    .done(function (data) {
                        //$.find('.advanced-search').hide();
                        //dtSlashFormat();
                        $(function() {
                            $('#pagination').pagination({
                                items: data.numFound,
                                itemsOnPage: 15,
                                cssStyle: 'light-theme',
                                onPageClick: function(pageNumber, event) {
                                    // Callback triggered when a page is clicked
                                    // Page number is given as an optional parameter;
                                    self.getData(pageNumber);
                                    return false;
                                }
                            });
                        });
                        self.rebind(data);
                        self.displayData(data);
                        updateSearchCheckboxes();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        console.log(textStatus);
                        console.log(jqXHR);
                        $('#summary').html("<div class='alert alert-danger'>An error occurred during search</div>");
                        /*var statusMsg = $.find('.search-confirm-popup').clone();
                        statusMsg.append( $("<span></span>").addClass('center').text("There was an error processing your request, please try again."));
                        statusMsg.append( $("<span></span>").addClass('center')
                            .append($("<button />").addClass('btn-primary').attr('name', 'ok').text("Ok"))
                        );
                        statusMsg.popup({
                            title: 'Server Error',
                            preventCloseOnClick: true,
                            onsubmit: function (evt, result) {
                              if (result.ok) {
                                 pn.popup.close();
                              }
                            }
                         });
                         $('div.popup-bottom').hide();*/
                    });
            },
            getData : function (pageNumb) {
                var currentPage = pageNumb;
                var pgSrch = "&pageNum=" + pageNumb + "&rows=" + 15;

                /*if( sortFld !== 'undefined' && sortFld !== '') {
                    var sortParam = "&sort-field=" + sortFld + "&sort-order=" + sortBy;
                    pgSrch = "&pageNum=" + pageNumb + "&rows=" + 15;
                    querySrch = querySrch + pgSrch + sortParam;
                } else {*/
                pgSrch = "&pageNum=" + pageNumb + "&rows=" + 15;
                var querySrch = this.paramSrch + pgSrch;
                //}
                var myURL= "../efile/rest/idmsearch?".concat(querySrch);
                var self = this;
                $.getJSON(myURL)
                    .done(function (data)  {
                        self.rebind(data);
                        self.displayData(data);
                        updateSearchCheckboxes();
                    })
            },
            displayData : function (dspData){
                var startRow = dspData.start + 1;
                var endRow = dspData.start + 15;

                //if(rows > 100 || endRow > dspData.numFound){
                if(endRow > dspData.numFound){
                    $('#summary').html("<p>Displaying  <b>" + startRow + "</b> to <b>" + dspData.numFound + "</b> of <b>" + dspData.numFound + 
                        "</b> records. (<b>For instructions on how to build the complete goods/services list, click <a href='#'>here</a></b>.)</p>");

                    /*'<p>Found <b>261</b> entries in <b>14</b> page(s) for [<b>books</b>]: (
                                <b>For instructions on how to build the complete goods/services list, click
                        <a href="#">here</a></b>.)</p>'*/
                }
                else {
                    $('#summary').html("<p>Displaying  <b>" + startRow + "</b> to <b>" + 
                        endRow + "<b> of <b>" + dspData.numFound + 
                        "<b> records. (<b>For instructions on how to build the complete goods/services list, click <a href='#'>here</a></b>.)</p>");
                }

                var numF = dspData.numFound.toString();
                if(numF === 0 || numF === '0') {
                    $('#summary').html("<div class='alert alert-danger'>No records found</div>");
                    $('#addselectedContainer, #searchresult, #pagination').hide();
                    $('#noresults').hide();
                } else {
                    $('#summary').html('');
                    $('#addselectedContainer, #searchresult, #pagination').show();
                    $('#noresults').show();                    
                }

                var template1 = _.template($(template).filter('#idsearchdetails').html(), {
                    idmresults: dspData.docs
                });    

                $("#searchresult").html(template1);
            },  
            bind : function (tbldata) {
               var tblRef = $.find("table.docket tbody");

               pn.bindomatic.bind(tbldata.docs, tblRef, decoratorCode);
               var tableSelector = $('table.docket');
               pn.table.refreshCols( tableSelector );
            },
            rebind : function (tbldata) {
                /*var tblRef = $.find("table.docket tbody");

                var binding = pn.bindomatic.findBinding(tblRef);
                $.each(binding.data, function (key, val) {
                    delete binding.data[key];
                });
                $.extend(binding.data, tbldata.docs);

                pn.bindomatic.bind(binding.data, tblRef, decoratorCode);
                var tableSelector = $('table.docket');
                pn.table.refreshCols( tableSelector );*/
            },
            addselectedGS: function(e){
                var selectedGS = $('#searchresult').find('input[name="selected"]:checked');

                var self = this;
                if ( selectedGS.size() === 0) {
                    $('#summary').html("<div class='alert alert-danger'>No records selected. Please select record to add.</div>");
                } else {
                    $('#summary').html('');                    
                }

                //trying to make the selected list appear only when there is items in the list
                    $('#selectIDContainer').show();

                _.each(selectedGS, function(gsToAdd) {
                	$('#removeErrorSummary').html("");
                    var termid = gsToAdd.value;
                    var model = new GSModel();
                    var desc = $('#' + termid).next('label').text();
                	var classId = $('#' + termid + '-class-id').text();
                    model.set('trademarkId', self.markId);
                    model.set('termId', termid);
                    model.set('description', desc);
                    model.set('classId', classId);
                    if(model.isValid(true)){
                    	//does this model already exist
                    	$.ajax({
                    		type: "GET",
                    		url: "/efile/rest/idmsearch/exists?termId=" + termid + "&classId=" + classId + "&trademarkId=" + self.markId,
                    		contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function(data){
                            	if(data == false){
                            		model.save(null, {
                                        wait: true,
                                        success: _.bind(function (model, response) {
                                            console.log("success : " + response);
                                            var addTemplate = _.template($(template).filter('#gsdetails').html(), {
                                                    //content: JSON.parse(content)
                                                model: (model)

                                                });
                                            self.collections.add(model);
                                            
                                            $('#addedGSTable > tbody').append(addTemplate);
                                            setupSelectedPagination(true);
                                            updateSelectCheckBoxes();
                                        },this),
                                        error: function (model, response) {
                                            console.log("error");
                                        }
                                    });
                            	}else{
                            		//TODO: PROPER ALERT
                            		$('#removeErrorSummary').append("<div class='alert alert-danger'>Item already exists: " + desc + " : " + classId + ".</div>");
                            	}
                            },
                            failure: function(errMsg) {
                            	$('#removeErrorSummary').append("<div class='alert alert-danger'>Unable to add: " + desc + " : " + classId + ".</div>");
                            	console.log("error");
                            }
                    	})
                        
                    }

                });
            },
            
            removeGS: function(e){
            	var selectedGS = $('#selectIDContainer').find('input[name="removeCk"]:checked');

                var self = this;
                if ( selectedGS.size() === 0) {
                    $('#removeErrorSummary').html("<div class='alert alert-danger'>No records selected. Please select record to remove.</div>");
                } else {
                    $('#removeErrorSummary').html('');
                }

                _.each(selectedGS, function(gsToRemove) {
                	var id = gsToRemove.value;
                	var model = self.collections.get(id);
                	model.destroy({ 
                        success: function(model, response) {
                            $('#gs' + model.id).remove();
                            setupSelectedPagination(false);
                            if(self.collections.length == 0){
                            	$('#selectIDContainer').hide();
                            }
                        },
                        error: function (model, response) {
                            if ( response.status == 200 ){
                                console.log("fix me. I m in AddClassesAndIDView removeGS");
                                 $('#gs' + model.id).remove();
                            } else {
                                console.log("error");
                            }
                        }
                	});

                });
                
            },
            toggleGS : function(e){
            	var checkBoxes = $('#selectIDContainer').find('input[name="removeCk"]');
            	var selectAllCB = $('#selectIDContainer').find('input[name="removeCkAll"]')[0];
            	_.each(checkBoxes, function(checkBox){
            		checkBox.checked = selectAllCB.checked;
            		var label = $('#selectIDContainer').find('label[for="'+ checkBox.id + '"]')[0];
            		if(selectAllCB.checked){
            			label.className = 'sr-only checked';
            		}else{
            			label.className = 'sr-only';
            		}
            	});
            },
            gotoNextPage: function(e) {
                if(this.collections.length===0){
                    this.pageNavigator('#goodsStatements/'+this.markId, true);
                }else{
                   this.pageNavigator('#addBasisCover/'+this.markId, true);
                }
            },
            gotoManualEntry:function(){
            	this.pageNavigator("#addClassesAndIDManual/" + this.markId, true);
            }
        });

        // Returns the AddClassesAndIDView class
        return AddClassesAndIDView;
    }
);

function setupSelectedPagination(){
	var perPage = 15;
	var items = $('#addedGSTable > tbody > tr');
	if(typeof selectedPageNumber !== 'undefined'){
		var showFrom = items.length - (perPage * selectedPageNumber);
		var showTo = showFrom + perPage;
		items.hide().slice(showFrom, showTo).show();
	}else{
		items.hide().slice(0, perPage).show(); //only show the first page
	}
    $('#selectedPaginationContainer').pagination({
    	
    	items: items.length,
        itemsOnPage: perPage,
        cssStyle: "light-theme",
        onPageClick: function(pageNumber) {
        	var selectedPageNumber = pageNumber;
            // someone changed page, lets hide/show trs appropriately
            var showFrom = perPage * (pageNumber - 1);
            var showTo = showFrom + perPage;

            items.hide().slice(showFrom, showTo).show();
        }
    });
    //ensure checkboxes look correct
    updateSelectCheckBoxes();
}

function updateSelectCheckBoxes(){
	var checkboxes = $('#selectIDContainer').find('input[name="removeCk"]');
    updateCheckBoxes(checkboxes);
}

function updateSearchCheckboxes(){
	var checkboxes = $('#searchresult').find('input[name="selected"]');
    updateCheckBoxes(checkboxes);
}

function updateCheckBoxes(checkboxes){
	_.each(checkboxes, function(checkbox){
    	Backbone.history.bind("all", function(route, router) {
			$('input').customInput();
    	});
    	$('input').customInput();
    });
}