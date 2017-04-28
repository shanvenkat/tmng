/**
 * --------------------------------------------------------------------
 * jQuery customInput plugin
 * Author: Maggie Costello Wachs maggie@filamentgroup.com, Scott Jehl, scott@filamentgroup.com
 * Copyright (c) 2009 Filament Group
 * Copyright (c) 2013 Bernd Matzner bernd@matznermatzner.de
 * licensed under MIT (filamentgroup.com/examples/mit-license.txt)
 * --------------------------------------------------------------------
 */

$.fn.customInput = function () {
    'use strict';

    return $(this).each(function () {
        if ($(this).is('[type="checkbox"],[type="radio"]')) {
            var input = $(this), label;

            // get the associated label using the input's id
            var label = $('label[for="' + input.attr('id') + '"]');

            // add in an empty span tag to contain the sprite image
            //label.prepend('<span></span>');

            // wrap the input + label in a div
			if(input.parent('div.custom-radio').length >0)  {
			   return;
			}
            input
                .add(label)
                //.add(input.siblings('input'))
                .wrapAll('<div class="custom-' + input.attr('type') + '"></div>');

            // necessary for browsers that don't support the :hover pseudo class on labels
            label.on('mouseenter', function () {
                $(this).addClass('hover');
                if (input.is(':checked')) {
                    $(this).addClass('checkedHover');
                }
            });

            // necessary for browsers that don't support the :hover pseudo class on labels
            label.on('mouseleave', function () {
                $(this).removeClass('hover checkedHover');
            });

            // bind custom event, trigger it, bind click,focus,blur events
            input.on('updateState', function () {
                if (input.is(':checked')) {
                    label.addClass('checked');
                } else {
                    label.removeClass('checked checkedHover checkedFocus');
                }

                // attach disabled class to disabled input
                label.toggleClass('disabled', this.disabled);
            });

            label.on('click', function () {
                if (input.attr('type') === 'radio') {
                    input
                        .removeAttr('checked')
                        .filter('[value="' + input.val() + '"]')
                        .prop('checked', true)
                        .trigger('updateState');
                } else {
                    input.trigger('updateState');
                }
            });

            input.on('click', function () {
                if (input.attr('type') === 'radio') {
                    $('input[name="' + input.attr('name') + '"]').trigger('updateState');
                } else {
                    input.trigger('updateState');
                }
            });

            input.on('focus', function () {
                label.addClass('focus');

                if (input.is(':checked')) {
                    $(this).addClass('checkedFocus');
                }
            });

            input.on('blur', function () {
                label.removeClass('focus checkedFocus');
            });

            input.trigger('updateState');
        }
    });
};