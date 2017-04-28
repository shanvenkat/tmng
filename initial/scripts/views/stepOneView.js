// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/stepOne.html', 'text!locale/en_us/ownerDetails.json'],

	function ($, jqueryui, Backbone, template, content ) {
		'use strict';

		//Create SearchView class which extends Backbone.View
		var StepOneView = Backbone.View.extend({

			// The DOM Element associated with this view
			//el: 'main-content',
			model: '',
			// View constructor
			initialize: function () {

				
			},

			// View Event Handlers
			events: {
				
			},

			// Renders the view's template to the UI
			render: function () {

				// Setting the view's template property using the Underscore template method
				this.template = _.template(template, {
					content: JSON.parse(content)
				})

				// Dynamically updates the UI with the view's template
				this.$el.html(this.template);


				// Maintains chainability
				return this;

			}
			
		});

		// Returns the OwnerDetailsView class
		return StepOneView;




	}
);