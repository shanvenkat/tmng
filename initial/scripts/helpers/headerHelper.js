define(['jquery', 'jpanel', 'bootstrap'],
	function($, jpanel, bootstrap) {
		'use strict';
		
		// If navlist doesn't exist - use left-navs
		var jPMmenu = document.getElementById('left-navs') === null ? '#navList' : '#left-navs > ul';
		
		// jPanelMenu configuration
		var jPM = $.jPanelMenu({
			menu: jPMmenu,
			trigger: 'button.navbar-toggle-main',
			openPosition: '250px',
			afterOn: function() {
			
				// Remove all classes and and panel-group and nav class for collapse functionality
				$('#jPanelMenu-menu').removeClass().addClass('nav panel-group');

				// Add class to direct children for collapse functionality
				$('#jPanelMenu-menu > li').addClass('side-menu');

				// Add collapsed class for toggling bg of the anchor tag
				$('#jPanelMenu-menu > li > a').addClass('collapsed');
				
				// Only add the following if and only if the menu contains submenu
				if ($(jPMmenu).find('> li > ul').length > 0) {
					$('#jPanelMenu-menu > li > a')
						.wrapInner('<span>')
						.append(function () {
							return '<em class="glyphicon glyphicon-chevron-down"><span class="sr-only">Click to expand ' + $(this).text() + ' menu</span></em>'
						})
						.attr('href', 'javascript:void(0)');

					// On upper level link click
					$('#jPanelMenu-menu > li > a').on('click', function () {
						// Collapse all open dropdowns
						$('#jPanelMenu-menu > li > ul.in').collapse('hide');

						// Toggle the one that is directly under the anchor that is being clicked
						$(this).next().collapse('toggle');
					});

					// Catch collapse events
					$('#jPanelMenu-menu > li > ul').on({
						'show.bs.collapse': function () {
							// Remove class collapsed from the anchor if the dropdown is shown
							$(this).prev().removeClass('collapsed');
						},

						'hide.bs.collapse': function () {
							// Add class collapsed from the anchor if the dropdown is hidden
							$(this).prev().addClass('collapsed');
						}
					});

					// Add class to dropdown uls for collapse functionality
					$('#jPanelMenu-menu > li > ul').addClass('panel-collapse collapse sub-menu');
				}
			}
		});



		return jPM;
	});