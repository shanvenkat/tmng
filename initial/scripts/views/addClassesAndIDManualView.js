// AddClassesAndIDMaualView
// -------
define(['jquery', 'jqueryui', 'backbone',  'models/GSModel', 'collections/GSCollection', 'text!templates/addClassesAndIDManual.html', 'helpers/jquery.simplePagination'],

    function($, jqueryui, Backbone, GSModel, GSCollection, template, simplePagination) {
        'use strict';

        //Create AddClassesAndIDMaualView class which extends Backbone.View
        var AddClassesAndIDMaualView = Backbone.View.extend({

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
                "click #previousPage": "previousPage",    
                "click #saveButton" : "save",
                "click #addWithIdButton" : "gotoAddWithId"
                
            },
            previousPage:function(){
                Backbone.history.history.back();
            },

            // Renders the view's template to the UI
            render: function() {
            	this.collections = new GSCollection();

                if(this.markId){
                    this.collections.fetch({data: { id: this.markId }, processData: true, async:false});
                }
                var item = null;
                
	                _.each(this.collections.models, function(model){
	                	if(model.get('classId') == '000' || model.get('classId') == null){
	                		item = model;
	                	}
	                });
	            
                this.template = _.template(template,{
                	collections: (self.collections)
                });

               
                // Dynamically updates the UI with the view's template
                this.$el.html(this.template);
                if(item != null){
                	this.$('#textarea1').val(item.get('description'));
                }

                // Maintains chainability
                return this;

            },      
            
            gotoNextPage: function(e) {
            	//save the data WITH validations
            	if(this.saveData(true)){
            		this.pageNavigator('#goodsStatements/'+this.markId, true);
            	}
            },
            gotoAddWithId: function(e) {
                this.pageNavigator('#addClassesAndID/'+this.markId, true);
            },
            save: function(e) {
            	this.saveData(true);
            },
            saveData: function(validate){
            	var self = this;
            	var model = new GSModel();
            	var description = $('#textarea1').val();
            	var process = true;
            	var wasSuccessful = false;
            	if(validate){
            		if(!description){
            			//TODO: PUT THE PROPER ERROR AREA
            			process = false;
            			alert('No goods or services defined');
            		}
            	}
            	if(process){
	            	model.set('trademarkId', self.markId);
	            	//TODO: CHANGE THE NEXT LINE TO BE THE PROPER CLASSID
	            	model.set('classId', '000');//000 is the proper classid for unknown.
	                model.set('description', description);
	                
	                if(model.isValid(true)){
                        model.save(null, {
                            wait: true,
                            success: _.bind(function (model, response) {
                                console.log("success : " + response);
                                var addTemplate = _.template($(template).filter('#gsdetails').html(), {
                                        //content: JSON.parse(content)
                                    model: (model)

                                    });
                                self.collections.add(model);
                                
                                //TODO: Any additional steps after saving
                                wasSuccessful = true;
                            },this),
                            error: function (model, response) {
                                console.log("error");
                            }
                        });
                        wasSuccessful = true;
                    }
            	}
            	//TODO: return the value of true if model.save completes, else return false. (currently returns before model.save completes
            	return wasSuccessful;
            }
        });

        // Returns the AddClassesAndIDMaualView class
        return AddClassesAndIDMaualView;
    }
);
