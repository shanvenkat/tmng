// Main application 
require(['config/config'], function() {
    'use strict';

    require(['jquery', 'backbone', 'jqueryui', 'respond', 'bootstrap', 'routers/router', 'views/HeaderView', 'views/FooterView', 'helpers/headerHelper', "backboneModelBinder", "backboneValidation", "helpers/validationHelper", "backboneValidateAll", 'helpers/backboneHelper', 'equalize', 'customInput', 'textEditor'],
        function($, Backbone, jqueryui, respond, bootstrap, Router, HeaderView, FooterView, jPM, ModelBinder, BBValidation, ValidationHelper, BBValidateAll, backboneHelper, equalize, customInput, textEditor) {

            // initilize application when document is ready
            $(document).ready(function() {
                // variables for the header and footer views
                var headerView, footerView;

                // initialize header and footer views
                headerView = new HeaderView();
                footerView = new FooterView();

                // initilize router
                new Router();

				Backbone.history.bind("all", function(route, router) {
					$('input').customInput();
                });
				
               // Resolve conflict between bootstrap and jquery ui by renaming jq ui tooltip name
                $.widget.bridge('uitooltip', $.ui.tooltip);

                $(document).uitooltip();

                $('input').customInput();
				
            });


            // Tab into css media queries
            function accessMediaQueries() {
                var indicator = document.createElement('div');
                indicator.id = 'screen-indicator';
                document.body.appendChild(indicator);
            }

            // Create a method which returns device state
            function getScreenWidth() {
                if (window.getComputedStyle) {
                    var index = parseInt(window.getComputedStyle(document.getElementById('screen-indicator')).getPropertyValue('z-index'), 10);
                } else {
                    // Use .getCompStyle instead of .getComputedStyle
                    window.getCompStyle = function(el, pseudo) {
                        this.el = el;
                        this.getPropertyValue = function(prop) {
                            var re = /(\-([a-z]){1})/g;
                            if (prop == 'float') prop = 'styleFloat';
                            if (re.test(prop)) {
                                prop = prop.replace(re, function() {
                                    return arguments[2].toUpperCase();
                                });
                            }
                            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
                        }
                        return this;
                    }
                    var index = parseInt(window.getCompStyle(document.getElementById('screen-indicator')).getPropertyValue("z-index"), 10);
                }

                var states = {
                    2: 'screen-lg-min',
                    3: 'screen-md-min',
                    4: 'screen-sm-min',
                    5: 'screen-xs-min',
                    6: 'screen-xs-max',
                    7: 'screen-sm-max',
                    8: 'screen-md-max'
                };

                return states[index] || 'desktop';
            }

            accessMediaQueries();

            function debounce(func, wait, immediate) {
                var timeout;
                return function() {
                    var context = this,
                        args = arguments;
                    var later = function() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            };

            $(function() {
                var lastDeviceState = getScreenWidth();
                $(window).resize(debounce(function() {
                    var state = getScreenWidth();
                    if (state != lastDeviceState) {
                        // Save the new state as current
                        lastDeviceState = state;

                        performMediaQueries(state);
                    }
                }, 20));
            });

            function performMediaQueries(state) {
                if (state == 'screen-sm-max' || state == 'screen-sm-min' || state == 'screen-xs-max' || state == 'screen-xs-min') {
                    // Turn on jPanel if not already turned on
                    if ($('.jPanelMenu-panel').length < 1) jPM.on();

                    removeResultsTabs();

                    // mobile view instructions
                    tabsToAccordions();
                } else {
                    if ($('.jPanelMenu-panel').length > 0) {
                        jPM.close(true);
                        jPM.off();
                    }

                    if ($("#search-results-section").hasClass("map-view")) addResultsTabs();

                    // desktop view instructions
                    accordionsToTabs();
                }

                if (state == 'screen-xs-max' || state == 'screen-xs-min') {
                    initializeAccordion('.panel-collapse-mobile:not(.ui-accordion)');

                    mobileFooterMenu();
                } else {
                    $('.panel-collapse-mobile.ui-accordion').accordion("destroy");
                    killMobileFooterMenu();
                }

                $(".table-striped > thead.gradient").equalize({
                    equalize: 'outerHeight',
                    children: 'a.h3 + address',
                    reset: true
                });
                $(".row").equalize({
                    equalize: 'outerHeight',
                    children: '.panel-equal-height',
                    reset: true
                });
                $('table thead').equalize({
                    equalize: 'outerHeight',
                    children: '.equal-height',
                    reset: true
                });
            }

            $(function() {
                performMediaQueries(getScreenWidth());
                initializeAccordion('.tab-accordion:not(.ui-accordion), .static-accordion', 'h3');
            });
			
			

            //functions to control mobile menu
            function mobileFooterMenu() {
                $(".push-down h3").attr("data-toggle", "collapse");
                $('.push-down ul').addClass("collapse");
                $('.col-pull .push-down:first-child ul').removeClass("collapse");
                $('.push-down .email-form').addClass("collapse");
            }

            function killMobileFooterMenu() {
                $(".push-down h3").attr("data-toggle", "");
                $('.push-down ul').removeClass("collapse").removeAttr("style");
                $('.push-down .email-form').removeClass("collapse").removeAttr("style");
            }

            function removeResultsTabs() {
                $("#search-results-section #results-side-column #results-tabs").children().unwrap();
                $("#search-results-section #results-side-column div .panel-collapse-mobile").unwrap();
                $("#search-results-section #tab-results-list").remove();
                $("#search-results-section #results-side-column ul").remove();

                $("#search-results-section #results-tabs").tabs("destroy");
            }

            function addResultsTabs() {
                if ($("#search-results-section.map-view #results-side-column .ui-tabs").length < 1) {
                    $("#search-results-section.map-view #results-side-column .panel").wrapAll("<div id='results-tabs'>");
                    $("#search-results-section.map-view #results-side-column .panel-collapse-mobile").wrapAll("<div id='tab-modify-results'></div>");
                    $("<div id='tab-results-list'></div>").insertBefore(".map-view #results-side-column #tab-modify-results");
                    $("<ul><li><a href='#tab-results-list'>Results List</a></li><li><a href='#tab-modify-results'>Modify Your Results</a></li></ul>").insertBefore('#search-results-section.map-view #results-side-column #tab-results-list');

                    var clone = $('#results-column .table-responsive').clone();

                    $(clone).removeClass('hidden-col').appendTo('#search-results-section.map-view #tab-results-list');

                    $("#search-results-section.map-view #results-tabs").tabs({
                        active: 0
                    });
                }
            }

            $("#navList:not(.ui-menu)").menu({
                position: {
                    my: "left top+5",
                    at: "left bottom"
                },
                icons: {
                    submenu: ""
                },
                focus: function(event, ui) {
                    $(this).find("li:has(a.ui-state-focus)").addClass('ui-item-focus');
                },
                blur: function(event, ui) {
                    $(this).find("li.ui-item-focus").removeClass('ui-item-focus');
                },
                create: function(event, ui) {
                    $("<div class='submenu-separator-container'><div class='submenu-separator'></div></div>").insertBefore("#navList > li > ul");
                }
            });

            // Function to add class to li if there is a submenu
            function hasSubmenu() {
                $("#navList > li").each(function() {
                    if ($(this).find("ul").length > 0)
                        $(this).addClass('has-submenu');
                });
            }

            hasSubmenu();

            $(".btn-toggle-view").on('click', function() {
                $("#search-results-section").toggleClass("map-view");
                $("#search-results-section:not(.map-view) #results-side-column .btn-toggle-view").html($(this).html().replace("List", "Map"));
                $("#search-results-section:not(.map-view) #results-side-column .btn-toggle-view .fa").switchClass("fa-list-ul", "fa-map-marker", 300);

                $("#search-results-section.map-view #results-side-column .btn-toggle-view").html($(this).html().replace("Map", "List"));
                $("#search-results-section.map-view #results-side-column .btn-toggle-view .fa").switchClass("fa-map-marker", "fa-list-ul", 300);

                if ($("#search-results-section").hasClass("map-view")) {
                    addResultsTabs();
                } else {
                    removeResultsTabs();
                }
            });

            // DFC
            // Make 3 panels below the search the same height
            $(".table-striped > thead.gradient").equalize({
                equalize: 'outerHeight',
                children: 'a.h3 + address',
                reset: true
            });
            $(".row").equalize({
                equalize: 'outerHeight',
                children: '.panel-equal-height',
                reset: true
            });
            $('table thead').equalize({
                equalize: 'outerHeight',
                children: '.equal-height',
                reset: true
            });

            //toggle up or down arrow on click or keyboard strike for collapsible menus
            $(".push-down h3").on("click keyup", function(event) {
                $(this).find(".glyphicon").toggleClass("glyphicon-chevron-up").toggleClass("glyphicon-chevron-down");
            });

            // Close navbars on click anywhere if they are open
            $(document).on("click", function() {
                $(".navbar-collapse.in").collapse("hide");
            });

            function initializeAccordion(selector, accordionheader) {
                accordionheader = (typeof accordionheader === "undefined") ? "h2" : accordionheader;
                $(selector).accordion({
                    icons: {
                        "header": "glyphicon glyphicon-chevron-right",
                        "activeHeader": "glyphicon glyphicon-chevron-down"
                    },
                    header: accordionheader,
                    "collapsible": true,
                    active: 'none',
                    heightStyle: 'content',
                    activate: function(event, ui) {
                        $('table thead').equalize({
                            equalize: 'outerHeight',
                            children: '.equal-height',
                            reset: true
                        });
                    }
                });
            }

            // changes tabs to accordions (jquery ui)
            function tabsToAccordions() {
                $('.accordions-tabs.ui-tabs').each(function() {
                    var $this = $(this);
                    var n = 0;
                    $this.find('> ul > li').each(function() {
                        $('<h3>' + $(this).text() + '</h3>').insertBefore($this.find('> .ui-tabs-panel').eq(n));
                        n++;
                    });

                    $this.find('> ul').remove();

                    $(this).tabs('destroy');
                });

                initializeAccordion('.accordions-tabs', '> h3');
            }

            // changes accordions to tabs (jquery ui)
            function accordionsToTabs() {
                $('.accordions-tabs.ui-accordion').each(function() {
                    var $this = $(this);
                    var t = 0;
                    $this.prepend('<ul></ul>');
                    $(this).find("> .ui-accordion-header").each(function() {
                        t++;
                        $this.find('ul').append('<li><a href="#tabs-' + t + '">' + $(this).text() + "</a></li>");
                    });

                    $(this).find("> .ui-accordion-header").remove();

                    $(this).accordion("destroy");
                    $(this).tabs();
                });
            }
			
	
			
        });
});