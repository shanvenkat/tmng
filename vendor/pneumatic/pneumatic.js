/**
The pn global object stores all API modules.
*/

(function ($) {
    "use strict";
    var pn = window.pn || {};

    var module = function (container, name, definition) {
        if (container[name]) {
            console.warn('Double module import: ' + name);
            return;
        }
        var module = {};
        container[name] = definition(module, jQuery) || module;
    };

    /**
    A normal assert function. Can take additional arguments, which it will log as errors. Browsers
    have a built-in `console.assert`, but it actually asserts nothing, that is, in Chrome, at least,
    it only logs an error but allows the program to continue.
    */
    pn.assert = function (condition, message) {
        if (!condition) {
            var additional = Array.prototype.slice.call(arguments, 2);
            if (additional.length) {
                if (console.error.apply) {
                    console.error.apply(console, additional);
                } else {
                    // In IE, console.error is not a Function, that is, it has no apply method
                    $.each(additional, function (i, arg) {
                        console.error(arg);
                    });
                }
            }
            throw new Error(message || 'Assertion error');
        }
    };

    (function () {
        var apps = {};
        /**
        Create or retrieve a Pneumatic application object by name; the name must match the
        application's directory, that is, the last segment of the application's URL.

        If omitted, finds the current default application. Application-specific functions will
        usually call this only once, to create the application. Traditionally, they should assign
        the result to a short object that they then use as their namespace. The test application,
        for example, creates itself as `ts = pn.application('test')`.

        Ideally, the application name should match the last section of the URL used to load the
        application, that is, the directory name of the application. This enables then allows
        instantiating multiple applications within one page.
        */
        pn.application = function (name) {
            var defaultName = window.location.pathname.match(/([^\/]*)(?:\/[^\/]*(?:\.[^\/]*)?)?$/)[1];
            if (!name) {
                if (apps[defaultName]) {
                    return apps[defaultName];
                } else {
                    var appsArray = $.map(apps, function (v) { return v });
                    if (appsArray.length === 1) {
                        return appsArray[0];
                    } else if (appsArray.length === 0) {
                        name = defaultName;
                    } else {
                        throw 'Cannot locate the default application';
                    }
                }
            }
            if (apps[name]) {
                return apps[name];
            }
            var notify = function (method, info) {
                var app = this;
                var send = function (sub, info) {
                    if (app[method][sub]) {
                        app[method][sub](info);
                    } else {
                        var consoleFn = console[method]
                        if (consoleFn.call) {
                            console[method].call(console, info);
                        } else {
                            // In IE < 9 console methods are not callable like normal functions
                            console[method](info);
                        }
                    }
                };
                if (typeof info === 'string') {
                    // DO NOT ALLOW HTML STRINGS. It would be very easy to accidentally create XSS
                    // vulnerabilities by doing so, for example, the innocuous-looking:
                    // app.warn(snip.d.message)
                    send('str', info);
                } else if (info.readyState) {
                    send('ajax', info);
                } else {
                    send('html', $(info));
                }
            };
            var startSpinner, endSpinner;
            (function () {
                var spinners = []; // Sparse array
                var findSpinner = function (node) {
                    // TODO: avoid leaking memory if client code errors and never calls back
                    for (var i = 0; i < spinners.length; i++) {
                        // TODO: intelligently handle collections of multiple nodes that partly overlap
                        if (spinners[i] && spinners[i][0][0] === node[0]) {
                            return i;
                        }
                    }
                    return -1;
                };
                startSpinner = function (node) {
                    var spinning = spinners[findSpinner(node)];
                    if (!spinning) {
                        spinners.push([node, 1]);
                    } else {
                        ++spinning[1];
                    }
                };
                endSpinner = function (node) {
                    var i = findSpinner(node);
                    if (!spinners[i]) {
                        throw 'Tried to stop spinner too many times';
                    }
                    if (!--spinners[i][1]) {
                        spinners[i] = undefined;
                        return true;
                    }
                };
            })();
            apps[name] = apps[name] || {};
            var app = apps[name];

            var patsyBind = function (method) {
                return function () {
                    var patsyApp = pn.patsy.app(name);
                    return patsyApp[method].apply(patsyApp, arguments);
                };
            };
            var jaxBind = function (method) {
                return function () {
                    return pn.jax[method].apply(apps[name], arguments);
                };
            };

            /**
            Application object methods
            --------------------------

            These methods are available on the object returned by `pn.application(name)`, which
            should also be the application's namespace object for its JavaScript modules.
            */
            

                /**
                ### Notification methods

                The application should normally override these to customize how notifications appear
                to the user. Pneumatic APIs and application-specific code may call these to display
                notifications.

                Each method takes one argument, the notification, which can be any of:

                - A string
                - A jQuery collection or document nodes
                - An XHR object, usually a merged xhr and response context delivered by the 
                  application ajax methods

                Depending on the object's type, these dispatch to type specific implementations,
                which most applications should override. These are the `str`, `ajax`, and `html`
                properties attached to the method. The default implementation simply logs to the
                console.

                > Authors note: In retrospect, I don't like this API at all. It's confusing and
                > harder for the application to implement than it should be. Needs rethink, but
                > works OK in the meantime.
                */

                    /***/
                    app.info = function (notification) {
                        return notify.call(app, 'info', notification);
                    };
                    /***/
                    app.warn = function (notification) {
                        return notify.call(app, 'warn', notification);
                    };
                    /***/
                    app.error = function (notification) {
                        return notify.call(app, 'error', notification);
                    };

                /**
                Each application should set this to a function with the signature `function (context, callback)`.
                Given a navigation context name, that function must call the callback with a layout
                suitable for passing to the application's `layout.load`. See [layouts](#api/layouts)
                for what to pass depending on the layout your application uses.

                Finally, this can provide an URL as a string. The layout handler will consider that
                a redirect to the given URL.
                */
                app.provideLayout = function (context, callback) {
                    callback();
                };

                /**
                Each application should create a layout object, using, if desired, one of the
                [pre-defined layouts](#api/layouts). This implements the business of loading
                snippets into the page and serializing or deserializing the page state.
                */
                app.layout = {
                    loadLayout: $.noop,
                    loadSnippets: $.noop,
                    snippets: $.noop,
                    serialize: $.noop,
                    restore: $.noop
                }

                /**
                Works exactly the same as `pn.module`, but attaches the new module to the
                application object.
                */
                app.module = function (name, definition) {
                    module(app, name, definition);
                };

                /**
                Given a node or bag of nodes containing content to be populated asynchronously,
                alter the the nodes with standardized spinner markers. The nodes immediately receive
                a class `pn-loading`; default style rules hide the content except for a child of
                class `pn-spinner`. If the node has no `pn-spinner` child, this appends a default
                spinner. In addition to the `pn-spinner` node, this also creates, if necessary, a
                `pn-error` node. To use loading and error messages other than the default, simply
                create the `pn-spinner` and `pn-error` nodes explicitly.

                Spinner markup structure looks like this:

                    container
                        content (hidden while loading)
                        .pn-spinner
                            span (loading text)
                        .pn-error
                            span (error text)

                Applications normally do not need to call this method directly, rather, they will
                typically use the [Pneumatic ajax](#api/jax) convenience `spinner` method.

                To toggle the node to either loaded or failed state, call `done` or `fail` on the
                object returned by this method. Success removes the `pn-loading` class and failure
                replaces it with `pn-failed`.

                    !!!
                    <button>Spin</button>
                    <div class="content"><p>Some content</p></div>
                    ---
                    <script>
                    example.find('button').on('click', function () {
                        var spinner = ts.spinner(example.find('.content'));
                        setTimeout(function () {
                            if (Math.random() > 0.5) {
                                spinner.done();
                            } else {
                                spinner.fail();
                            }
                        }, 500)
                    })
                    </script>

                If not provided, the element defaults to document body.

                If multiple spinners start at once, this marks the element "loading" until either
                all succeed or any fails.

                > TODO: a way for the application to change the default spinner

                > TODO: this mechanism does not work well with pane banner/body structure if you
                > want to spin the entire pane. Might be repairable with CSS change.
                */
                app.spinner = function (element) {
                    // TODO: multiple spinners started at once
                    element = element || $('body');
                    element = $(element);
                    element.addClass('pn-loading').removeClass('pn-failed')
                        .attr('aria-busy', 'true');
                    element.each(function () {
                        var node = $(this);
                        var head = $(this.ownerDocument)
                                         .find('head'); // document.head does not exist in IE < 9
                        if (!head.find('style.pn-spinner').length) {
                            // Check the node's document in case node lives in an iframe
                            var style = $('<style class="pn-spinner">\n'
                                + '/* Injected by pn.application().spinner */\n'
                                + '.pn-spinner, .pn-error { display: none !important; }\n'
                                + '.pn-failed > * { display: none !important; }\n'
                                + '.pn-failed > .pn-error { display: block !important; }\n'
                                + '.pn-loading > * { display: none !important; }\n'
                                + '.pn-loading > .pn-spinner { display: block !important; }\n'
                            + '</style>');
                            var firstExisting = head.find('style').first();
                            if (firstExisting.length) {
                                style.insertBefore(firstExisting);
                            } else {
                                style.appendTo(head);
                            }
                        }
                        if (!node.children('.pn-spinner').length) {
                            pn.newLegalChild(node)
                                .addClass('pn-spinner')
                                .append($('<span></span>').text(pn.s.loading))
                                .appendTo(node);
                        }
                        if (!node.children('.pn-error').length) {
                            pn.newLegalChild(node)
                                .addClass('pn-error')
                                .append($('<span></span>').text(pn.s.error))
                                .appendTo(node);
                        }
                    });
                    startSpinner(element);
                    return {
                        done: function () {
                            if (endSpinner(element)) {
                                element.removeClass('pn-loading').removeAttr('aria-busy');
                            }
                        },
                        fail: function () {
                            endSpinner(element);
                            element.addClass('pn-failed').removeClass('pn-loading')
                                .removeAttr('aria-busy');
                        }
                    };
                };

                /**
                ### Ajax methods

                These methods map onto HTTP verbs:

                - `get`
                - `put`
                - `post`
                - `del`

                Described in [Ajax documentation](#api/jax), each takes as parameters

                - A Patsy-style url pattern
                - URL parameters
                */

                app.get = jaxBind('get');
                app.put = jaxBind('put');
                app.post = jaxBind('post');
                app.del = jaxBind('del');
                
                /**
                    **app.when** is a nicer replacement for $.when. Pass it an array
                    of callbacks (or bare strings, which are interpreted as GET requests)
                    and it will wait until all succeed or fail and then call the appropriate
                    callback.
                    
                    The list will be overwritten with return values and then passed
                    to the callback, along with failures in the case of the failCallback
                    
                    TODO: make it chainable (return a jQuery promise perhaps?)
                */
                app.when = function( ajaxRequestList, doneCallback, failCallback ){
                    var leftToDo = ajaxRequestList.length,
                        failures = [];
                    
                    function done(){
                        if( leftToDo === 0 ){
                            if( failures.length ){
                                (failCallback || $.noop)( ajaxRequestList, failures );
                                console.warn( 'when had failures', ajaxRequestList, failures );
                            } else {
                                doneCallback( ajaxRequestList );
                            }
                        }
                    }
                    
                    $.each( ajaxRequestList, function( idx ){
                        var request = this;
                        if( typeof request === 'string' ){
                            if( request.match(/(html|css|js|less|xsml)$/) ){
                                request = $.get(request);
                            } else {                            
                                request = app.get(request);
                            }
                        }
                        // does it quack like a request?
                        if( typeof request === 'object' && typeof request.done === 'function' && typeof request.fail === 'function' ){
                            request.done(function(data){
                                ajaxRequestList[idx] = data;
                                leftToDo -= 1;
                                done();
                            }).fail(function(err){
                                ajaxRequestList[idx] = null;
                                failures.push(err);
                                leftToDo -= 1;
                                done();
                            });
                        } else {
                            leftToDo -= 1;
                        }
                    });
                };

                /**
                ### Patsy methods

                The application object also contains methods of a Patsy app object, described in
                [Patsy documentation](#api/patsy).

                - `patsy`: create a patsy
                - `patsyPart`: create a partial patsy
                - `url`: construct an application-relative url
                */

                app.patsy = patsyBind('patsy');
                app.patsyPart = patsyBind('patsyPart');
                app.url = patsyBind('url');

            return app;
        };
    })();

    /**
    Call this to add a module to the pn namespace. The definition argument should be a function that
    sets up the module. That function will be invoked with these parameters:

    - a module object that will be attached to pn after the definition completes
    - jQuery

    If the definition function returns a truthy value, that value will be attached to pn instead of
    the object passed to the function.

        !!!
        ---
        <script>
            pn.module('foo', function (foo, $) {
                pn.assert($ === jQuery);
                foo.bar = function (message) {
                    $('<p></p>').text(message).appendTo(example);
                }
            });
            pn.foo.bar('Module pn.foo is defined');
        </script>
        ---
        <script>
            delete pn.foo;
        </script>

    */
    pn.module = function (name, definition) {
        module(pn, name, definition);
    };

    /**
    Externalized strings.

        !!!
        <dl></dl>
        ---
        <script>
            $.each(pn.s, function (k, v) {
                var definitions = example.find('dl');
                $('<dt></dt>').text(k).appendTo(definitions);
                $('<dd></dd>').text(v).appendTo(definitions);
            });
        </script>
    */
    pn.s = {
        cancel: 'Cancel',
        close: 'Close',
        warning: 'Warning',
        error: 'Error',
        loading: 'Loading',
        remove: 'Remove',
        ok: 'OK',
        pin: 'Pin',
        untitled: 'Untitled'
    };

    /**
    Like [Array.prototype.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort),
    but returns a new array rather than sorting in place and is stable.
    */
    pn.sorted = function (array, comparator) {
        comparator = comparator || function (a, b) {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            } else {
                return 0;
            }
        };
        var mapped = $.map(array, function (v, i) {
            return {
                v: v,
                i: i
            };
        });
        var sorted = mapped.sort(function (a, b) {
            return comparator(a.v, b.v) || a.i - b.i;
        });
        return $.map(sorted, function (v) {
            return v.v;
        });
    };

    /**
    Stable sort the given elements in place. Behavior when 
    */
    pn.sortNodes = function (nodes, comparator) {
        // We may in the future want to make behavior well-defined when not given a comparator, by
        // text value, for example, but till then, make it required.
        pn.assert(comparator, 'Comparator function required for sorting elements');
        var sorted = pn.sorted(nodes, comparator);
        var anchor = nodes[0];
        $.each(sorted, function (i, node) {
            if (i === 0) {
                anchor = $(node).insertBefore(anchor);
            } else {
                anchor = $(node).insertAfter(anchor);
            }
        });
    };

    /**
    Generate a type 4 universally unique identifier. This implementation relies on browser-supplied
    randomness, so in some environments will **not** be usable as [persistent unique identifier](http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript).
    */
    pn.uuid = function () {
        // From http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    /**
    Create an element, returned as a jQuery collection, that is a valid child of the given element.
    This matters, for example, when creating a placeholder node in an element of arbitrary type.
    If the element is a list, for example, this returns an `<li>`, but if it is a `<div>`, this 
    returns a `<span>`.
    */
    pn.newLegalChild = function (element) {
        element = $(element);
        pn.assert(element.length <= 1, 'container must contain at most one element');
        // TODO: do we care about the distinction between flow and phrasing content?
        // TODO: look up the restrictions that didn't come to me off the top of my head
        switch (element[0].nodeName.toLowerCase()) {
            case 'table':
            case 'tbody':
            case 'thead':
                return $('<tr></tr>');
            case 'tr':
                return element.parent().is('thead') ? $('<th></th>') : $('<td></td>');
            case 'ol':
            case 'ul':
                return $('<li></li>');
            case 'dl':
                return $('<dt></dt>');
            case 'script':
            case 'style':
            case 'option':
                throw 'No children allowed in ' + element[0].nodeName;
            default:
                return $('<span></span>');
        }
    };

    /**
    Special Events
    --------------

    See [jQuery special events](http://benalman.com/news/2010/03/jquery-special-events/).
    */

    /**
    Fires when a dom element or a jQuery object gets destroyed. Calling $(...).remove() on an
    element destroys it, even if it has not been inserted into the document. Simply going out of
    scope does not. Destroy handlers do not, at present, receive an event object as an argument, but
    "this" within the handler refers to the destroyed element.

    This event may be unreliable. Avoid using it if possible.
    */
    $.event.special.destroy = {
        // TODO: does not fire when attached to an element inside an iframe
        // TODO: fires spuriously when it is removed from an element
        remove: function (handle) {
            if (handle.handler) {
                handle.handler.call(this);
            }
        }
    };

    /**
    Fires when focus moves from any element within the node to an element outside the node, or to
    nothing.

        !!!
        <div class="blue" style="width: 200px; height: 100px; background-color: lightblue">
            <button>Foo</button>
            <button>Bar</button>
            <p>Click here does not trigger focusleave</p>
        </div>
        <button>Baz</button>
        <p>Click here triggers focusleave</p>
        ---
        <script>
            example.find('div.blue')
            .on('focusleave', function () {
                alert('Focus left the blue div')
            })
        </script>

    An element can lose focus three ways. These two can trigger focusleave:

    - Focus moved to a different element in page by click or tab key, generally. This normally
      fires focusout, then focusin. This fires focusleave only if the next focused element
      is outside the container listening for focusleave. The focusleave handler gets a focusin
      event.
    - Focus moved off the element, but onto nothing by clicking on something non-focusable. This
      fires focusleave unless the click happened within the container. The focusleave handler gets
      a mousedown event.

    The third way an element can lose focus is when the entire window loses focus.

    If focus moves into an iframe, focusleave fires on elements in the outer window, but (TODO),
    focusleave does not yet fire on elements in an iframe when focus leaves the iframe.

        !!!
        <p>The focusleave event with iframes</p>
        <button>Setup handlers</button>
        <iframe src="blank.html"></iframe>
        ---
        <script>
        example.find('button').on('click', function () {
            var win = example.find('iframe')[0].contentWindow
            $('<button>Focusable</button>')
                .appendTo(win.document.body)
                .on('focusleave', function () {
                    alert('focus left the button in the iframe')
                })
        })
        </script>
    */
    $.event.special.focusleave = {
        add: function (handlerOptions) {
            var container = $(this);
            var focused = container.any(':focus').length;
            
            function update(updatedFocused, eventTarget, eventArgs) {
                if (focused && !updatedFocused) {
                    handlerOptions.handler.apply(eventTarget, eventArgs);
                }
                focused = updatedFocused;
            }

            // Use the element's document so this works on elements in iframes
            var doc = this.ownerDocument;
            var win = doc.defaultView || doc.parentWindow;

            $(doc).on('focusin mousedown', function (event) {
                if (event.target === doc) {
                    // Firefox: after moving focus back from iframe to main window, it
                    // fires a mousedown, and then fires a focus (or focusin) on the
                    // document node (NOT document.body), in this order.
                    // This pair of events wrongly registers as a focusleave, because
                    // the mousedown updates `var focused` as true and focus as false.
                    return;
                }
                // Notice that a click inside the element sets it to "focused" state event if no
                // element actually has focus. I think that is the least surprising behavior.
                update(!! container.any(event.target).length, this, arguments);
            });
            
            $(win).on('blur', function (event) {
                var eventTarget = this,
                    eventArgs = arguments;
                // firefox has activeElement set to body (seems to be always body) at this point, 
                // hence setTimeout. Chrome and IE are fine without it.
                setTimeout(function() {
                    // If focusing a diff tab/window, activeElement is <body>.
                    // Could a valid destination that counts as focusleave be something besides an iframe?
                    var didLeaveFocus = $(doc.activeElement).is('iframe');
                    if (didLeaveFocus) {
                        update(false, eventTarget, eventArgs);
                    }
                }, 0);
            });
        }
    };
    /**
    Special Selectors
    -----------------

    In addition to the ordinary jQuery selectors, Pneumatic includes the
    [:focusable](http://api.jqueryui.com/focusable-selector/) selector from jQuery UI.
    */

    // Modified from jQuery UI 1.10.4:
    function focusable( element, isTabIndexNotNaN ) {
        var map, mapName, img,
            nodeName = element.nodeName.toLowerCase();
        if ( "area" === nodeName ) {
            map = element.parentNode;
            mapName = map.name;
            if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
                return false;
            }
            img = $( "img[usemap=#" + mapName + "]" )[0];
            return !!img && visible( img );
        }
        function visible( element ) {
            return $.expr.filters.visible( element ) &&
                !$( element ).parents().addBack().filter(function() {
                    return $.css( this, "visibility" ) === "hidden";
                }).length;
        }
        return ( /input|select|textarea|button|object/.test( nodeName ) ?
            !element.disabled :
            "a" === nodeName ?
                element.href || isTabIndexNotNaN :
                isTabIndexNotNaN) &&
            // the element and all of its ancestors must be visible
            visible( element );
    }
    $.expr[':'].focusable = function( element ) {
        return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
    };

    window.pn = pn;
}(jQuery));
/*global pn*/
/**
Multiple Window Handling
========================

This automatically joins new windows opened from an Pneumatic application to the first in a
"window family," allowing communication between snippets in the separate windows. Applications
rarely need to use anything in this module directly as inter-snippet communication automatically
crosses window boundaries.

> There are some todos for this. See the consolidated list in [nav](#api/nav).

Concurrency and Internet Explorer
---------------------------------

In Chrome and Firefox, JavaScript executing in the same window family appears to run synchronously;
execution in one window appears to suspend execution in the other, but **in Internet Explorer
JavaScript in separate windows can execute in parallel**, potentially introducing synchronization
bugs.

Given windows, `X` and `Y`, say that:

- `X.b` and `Y.b` are booleans, originally set to false
- `X.f()` and `Y.f()` are long-running functions
- `X.g()` and `Y.g()` are functions that swap `X.b` and `Y.b` to true, respectively

Execution happens in this order:

1. `X` starts `X.f()` on a timer
2. `Y` starts `Y.f()` on a timer, while `X.f()` is still running
3. `X.f()` finishes its busy wait and calls `Y.g()`
4. `Y.f()` finishes its busy wait and calls `X.g()`
   _Notice that `Y.g()` has not yet returned, so you might expect this to deadlock. Actually..._
5. `X.g()` returns
6. `Y.g()` returns
7. `Y.f()` finishes, reporting that `Y.b` is true
8. `X.f()` finishes, reporting that `X.b` is true

This still looks like cooperative multitasking, though different from most in JavaScript since
calling code in another window appears to allow the calling code to yield and continue only after
execution of other code executing in the callee's window code, but does not guarantee it a yield as
does `setTimeout`. A slight variation, where `X.f()` and `Y.f()` report their `b` values before
calling the other window shows, for example, that `Y.b` does not change until `Y.f()` calls `X.g()`.
*/

pn.module('wins', function (wins, $) {
    'use strict';

    /*                            _                  |\_ 
                                  \  _                \ \_ 
       HC SVNT DRACONES            \_ \_______         |  \__ 
                                     \_              _/      -_______ 
                                       \          __/               /| 
                                       _|      __/               /   | 
                         /|          _/      /                /       \ 
                        /  \       _/       /++++++---- - - -          \ 
               ________/    \     /         \      \_____               \ 
              /*           /      \          \            -  --   -- -  -\ 
             |***         |        \          |                     ___ +        /| 
   ^---\      |*          |         \_         \            ______++           _/  \_ 
   |    ------             \          \         |          /                 _/      \_ 
   \                        \          \        |       __/                =            = 
    |   -                  /    /\_  _/\  /\   /   __/                      \_       _/ 
    ===+ +_______         /   _/   \/   \/  \ /   / \       |                 \     / 
    / _|/         \       \_--  -- -  -  -  --   / - \____/ |                  \   / 
       ||          \                                  --  - |                  /   \ 
       \|           \                                        \      ^         /     | 
        +            \                                        \   /  \        \     | 
                      \                                         \     \      _/     | 
                        \                                        - - - -----        / 
                          \                                                        / 
                            \         -------------                              / 
                              \ ____/                     /_                    / 
                                \_____                  \/  ===________________/ 
                               _/                        \ 
                             /    _________________________\ 
                              \/_/
    */

    var fam = []; // sparse array since closed windows leave gaps

    /**
    Open a window using the given URL. Child windows can open using any normal mechanism, such as
    `window.open` or `target="_blank"`; this just calls `window.open` with some sensible default
    parameters.
    */
    wins.open = function (href) {
        var left = window.screenLeft || window.screenX;
        var top = window.screenTop || window.screenY;
        var width = window.outerWidth || $(window).width();
        var height = window.outerHeight || $(window).height();
        return window.open(
            href,
            // TODO: menu, tabs, tools, etc. should still appear
            "_blank",'left='
                + (left + width * 0.2)  + ",top=" + (top + height * 0.2)
                + ",width=" + (width * 0.8) + ",height=" + (height * 0.8)
        );
    };

    /**
    Given a Node, not a jQuery object, return the owning window if the owner is not this window,
    undefined otherwise.

    > TODO: Why did I think that returning undefined was a good idea if the node is in the current
    >       window? That's just surprising.
    */
    wins.owner = function (node) {
        var owner = node.ownerDocument.defaultView || node.ownerDocument.parentWindow;
        // IE 8 does not consider ownerDocument.parentWindow strictly equal to the window
        // See http://stackoverflow.com/questions/4850978/ie-bug-window-top-false. The rules when
        // windows may strictly equal each other seem totally unpredictable but == seems fine,
        // so this module uses it throughout
        return owner == window ? undefined : owner; // No, I do not mean to use triple-equals
    };

    /**
    Retrieve a jQuery collection of nodes in any window in the family, ordered in the same way as
    the window family.
    */
    wins.anywhere = function (selector) {
        if (typeof selector !== 'string') {
            // Probably a jQuery object, maybe a bare node. Can't do anything sensible but wrap it
            return $(selector);
        }
        var result = $();
        $.each(wins.family(), function (i, w) {
            if (!w.closed) {
                result = result.add($(w.document).find(selector));
            }
        });
        return result;
    };

    /**
    Retrieve an array of windows in the family.
    */
    wins.family = function () {
        return $.grep(fam, function (w) {
            // In IE, the window can be partly unloaded, that is, it is invalid, but its unload
            // has not yet called pn.wins.disconnect.
            return w && !w.closed;
        });
    };

    // monkeyApply exists only for IE 8 - can remove if we drop IE 8 support
    var monkeyApply;
    (function () {
        var monkey;
        monkeyApply = function (needMonkey) {
            if (monkey != null) {
                return monkey;
            }
            if (needMonkey === true) {
                monkey = true;
                var apply = Function.prototype.apply;
                Function.prototype.apply = function (thisArg, argsArray) {
                    // Internet Explorer 8 does not allow calling apply on a function from another window with
                    // an args array created in this window, so monkey patch it.
                    var args = argsArray;
                    if (argsArray != null && !(argsArray instanceof Array)) {
                        // Do NOT use `new Array()`. IE 8 does not allow "newing" an Array from another
                        // window. For example, `new window.opener.Array()` throws error, but
                        // `window.opener.Array()` does not.
                        args = Array(); // ignore jshint
                        for (var i = 0; i < argsArray.length; i++) {
                            args.push(argsArray[i]);
                        }
                    }
                    if (args === undefined) {
                        // You might think this wouldn't matter, but it does. In IE 8,
                        // Array.prototype.slice.apply([], undefined) blows chunks
                        return apply.call(this, thisArg);
                    } else {
                        return apply.call(this, thisArg, args);
                    }
                };
            }
            if (needMonkey === false) {
                monkey = false;
            }
            return monkey;
        };
    })();

    /**
    Join a window to the family. Client code should usually have no reason to call this since it
    happens automatically. If called without an argument, joins the current window to its opener's
    family. Returns the window family array.
    */
    wins.connect = function (win) {
        win = win || window;
        if (win == window) {
            pn.assert(fam.length === 0, 'Already in a window family');
            if (window.opener && window.opener.pn) {
                pn.monkeyApply = function (arr) {
                    var monkey = false;
                    try {
                        $.noop.apply(null, arr);
                    } catch (e) {
                        monkey = true;
                    }
                    delete pn.monkeyApply;
                    return monkeyApply(monkey);
                };
                var others = window.opener.pn.wins.connect(win);
                for (var i = 0; i < others.length; i++) {
                    // In IE 8, copying the array via [].concat(others) or Array.prototype.slice.call(others) 
                    // copies the array but destroys the windows it contains.
                    fam.push(others[i]);
                }
                $.each(fam, function (i, w) {
                    if (w != window && w != window.opener) {
                        w.pn.wins.connect(window);
                    }
                });
            } else {
                fam = [win];
            }
        } else {
            monkeyApply((win.pn.monkeyApply || $.noop)([]));
            fam.push(win);
        }
        return wins.family();
    };

    /**
    Remove a window from the family. Client code should usually not call this since it happens
    automatically on close. If called without an argument, disconnects the current window from its
    family.
    */
    wins.disconnect = function (win) {
        win = win || window;
        if (win == window) {
            $.each(wins.family(), function (i, w) {
                if (w != win) {
                    w.pn.wins.disconnect(win);
                }
            });
            fam = [];
        } else {
            $.each(fam, function (i, w) {
                if (w == win) {
                    delete fam[i];
                }
            });
        }
    };

    $(document).on('click', function (event) {
        // Allow ctrl+click on links, etc. to link back to this window. Quite experimental. I think
        // it can work reasonably well, but may never exactly replicate native behavior. We'll have
        // see how it goes in practice.
        var anchor = $(event.target).closest('a');
        if (!anchor.length) {
            return;
        }
        // TODO: ignore external links (kinda for security) should not see us as their opener
        //      see https://bugzilla.mozilla.org/show_bug.cgi?id=203158
        //      and http://my.opera.com/hallvors/blog/2007/03/14/window-opener-and-security-an-unfixable-problem
        if (event.ctrlKey) {
            // TODO: Ctrl+click normally opens a new tab in the background, this does foreground
            //      like ctrl+shift+click
            // Ctrl+click/middle-click does not give the child a window.opener, so it cannot link
            // back up to the parent. <a target="_blank">, however, does.
            // TODO: middle-click
            var restored = anchor.attr('target') || null;
            event.preventDefault();
            anchor.attr('target', '_blank');
            setTimeout(function () {
                // Need timeout or FF does not recognize the target change
                // TODO: sometimes in Chrome this opens in a new window instead, why?
                anchor[0].click();
                setTimeout(function () {
                    anchor.attr('target', restored);
                }, 0);
            }, 500);
        } else if (event.shiftKey) {
            // Shift+click normally opens a new window
            event.preventDefault();
            wins.open(anchor.attr('href'));
        }
    });

});

// TODO: reconnect on refresh
setTimeout(function () {
    // setTimeout allows other js modules to load
    pn.wins.connect();
    $(window).on('unload', function () {
        // TODO: should be on unload, so we know it is not going to be cancelled
        pn.wins.disconnect();
    });
}, 0);
/**
Ajax
====

*/

pn.module('jax', function (jax, $) {
    'use strict';

    /**
    Ajax wrappers
    -------------

    These wrap jQuery's normal ajax calls with somewhat friendlier interfaces. In particular, they
    always request or post json, allow use of [patsy style URL patterns](#api/patsy), and provide
    application-customizable "loading" spinners. All four share the same signature:

        pn.jax.[get|put|post|del](urlPattern, params)

    These functions expect to be applied to an object that provides some of the application objects
    methods, specifically:

    - `url`
    - `spinner`
    - `error`
    - `warn`

    So callers should normally not invoke these on their application objects, rather than directly.
    This test application provides a preferences patsy, for example:

        !!!
        <button>Get</button>
        <p></p>
        <pre></pre>
        ---
        <script>
        example.find('button').on('click', function () {
            ts.get('preferences?doesnotmatter={}', 'ignored')
            .done(function (prefs) {
                example.find('p').text(this.url)
                example.find('pre').text(JSON.stringify(prefs))
            })
        })
        </script>

    Put and post require a data object before they send the request. If not already a string, it
    gets JSON-stringified as necessary.

        !!!
        <button>Put</button>
        <p></p>
        ---
        <script>
        example.find('button').on('click', function () {
            ts.put('preferences')
            .send({theme: 'css/aqua'})
        })
        </script>

    Unless you attach an error handler, all use the application's user notification methods to
    report errors.

    > **SURPRISE**: If you attach a fail handler, the default error reporter will not run.
    >
    > TODO: This is unintuitive and should change in the future so you explicitly silence the
    >       default error handler

        !!!
        <button>Get a default error</button>
        <button>Get a custom error</button>
        ---
        <script>
        example.find('button').first().on('click', function () {
            ts.get('something/nonexistent')
        })
        example.find('button').last().on('click', function () {
            ts.clearNotifications()
            ts.get('something/nonexistent').fail(function () {
                example.append('<p>Custom error handler ran</p>')
            })
        })
        </script>
    */

        jax.get = function () {
            var xhr = $.getJSON(this.url.apply(this, arguments));
            return decorate(this, xhr);
        };

        var prepSend = function (app, type, urlArgs) {
            return {
                send: function (data) {
                    var xhr = $.ajax({
                        type: type,
                        url: app.url.apply(app, urlArgs),
                        data: typeof data === 'string' ? data : JSON.stringify(data),
                        contentType: 'application/json'
                    });
                    return decorate(app, xhr);
                }
            };
        };

        jax.put = function () {
            return prepSend(this, 'put', arguments);
        };

        jax.post = function () {
            return prepSend(this, 'post', arguments);
        };

        jax.del = function () {
            var xhr = $.ajax({type: 'delete', url: this.url.apply(this, arguments)});
            return decorate(this, xhr);
        };

        /**
        ### Methods of Pneumatic ajax objects

        Pneumatic ajax objects extend jQuery's ajax object with convenience methods for customizing
        application behavior to the request and sensible default error handling.
        */

        var decorate = function (app, xhr) {
            var notifier = app.error;
            var on = {
                // TODO: add jQuery's deprecated methods
                fail: xhr.fail,
                done: xhr.done,
                always: xhr.always
            };
            xhr.fail(function (errXhr, jqStatus) {
                if (errXhr.status >= 200 && errXhr.status < 300) {
                    // When response parsing fails, for example, you get a confusing error "200 OK"
                    errXhr.statusText += ' (jQuery message: ' + jqStatus + ')';
                }
                notifier.call(app, $.extend({}, this, errXhr));
            });
            var handlerCount = 1;
            var maybeEndSpin;
            var wrapHandler = function (method, req, args) {
                var result = method.apply(req, args);
                if (maybeEndSpin) {
                    ++handlerCount;
                    on.always.call(req, maybeEndSpin);
                }
                return result;
            };
            return $.extend(xhr, {
                /**
                A convenience wrapper for the [application spinner method](#api), this marks the
                given node as "loading" until the request returns, and "failed" if the request
                fails. Silencing the default error handlers, either by creating a custom error
                handler, or using the `quiet` or `silent` methods, causes this to not mark the node
                failed.

                    !!!
                    <button>Get with spinner</button>
                    <!-- Example uses "preferences.json" instead of the patsy because the patsy,
                        when stored locally, returns synchronously and therefore does not allow
                        the spinner to show -->
                    ---
                    <script>
                    example.find('button').on('click', function () {
                        ts.get('delayed?delay=1000')
                        .spinner(example)
                    })
                    </script>

                Regardless of handler attachment order, the spinner removal always runs after all
                other handlers on the request.
                */
                spinner: function (element) {
                    var spinner = app.spinner(element);
                    maybeEndSpin = function (reply, s, xhr) {
                        if (!--handlerCount) {
                            xhr = xhr.readyState ? xhr : reply;
                            if (notifier !== app.error || jax.success(xhr)) {
                                spinner.done();
                            } else {
                                spinner.fail();
                            }
                            // Set to null because handler attachers can be invoked after the 
                            // request returns, causing this to attempt to remove the spinner too
                            // often.
                            // TODO: jQuery itself does this, using its always method to attach
                            //      status-dependent handlers after the request returns, implying
                            //      that those handlers would run after removing the spinner, which
                            //      is incorrect behavior. Note that this may be a quirk of using
                            //      a locally-stored patsy, thus returning synchronously from a
                            //      normally async call.
                            maybeEndSpin = undefined;
                        }
                    };
                    on.always.call(this, maybeEndSpin);
                    return this;
                },

                /**
                Pneumatic ajax requests normally call the applications `error` notification method if
                they fail. Calling `quiet()`, however, causes the request to call `warn` instead.

                Note that setting any error handler on the request disables default error handling.

                    !!!
                    <button>Get with warning on error</button>
                    ---
                    <script>
                    example.find('button').on('click', function () {
                        ts.get('something/nonexistent')
                        .quiet()
                    })
                    </script>
                */
                quiet: function () {
                    notifier = app.warn;
                    return this;
                },

                /**
                No default failure notification.
                */
                silent: function () {
                    notifier = $.noop;
                    return this;
                },

                done: function () {
                    return wrapHandler(on.done, this, arguments);
                },
                fail: function () {
                    notifier = $.noop;
                    return wrapHandler(on.fail, this, arguments);
                },
                always: function () {
                    return wrapHandler(on.always, this, arguments);
                }
            });
        };

    /**
    Data URI transport
    ------------------

    jQuery ajax transport `datauri` allows getting a resource as a [data URI](https://developer.mozilla.org/en-US/docs/data_URIs).

    Does not currently support any verb except `GET`.

        !!!
        <div class="data-uri-example">
            <form>
                <label>
                    <span>Url</span>
                    <input name="url" value="api/test-media/Penguins.jpg">
                </label>
                <button>Convert</button>
            </form>
            <img class="data-uri-example"></img>
            <a>As data link</a>
            <pre></pre>
        </div>
        ---
        <script>
        var link = function (reply) {
            example.find('a').attr('href', reply)
            example.find('img').attr('src', reply)
            example.find('pre').text(reply)
        };
        pn.form.onsubmit(example.find('form'), function (e, form) {
            $.ajax({url: form.url, dataType: 'datauri'})
            .done(function (reply) {
                link(reply)
            })
        })
        </script>

    ### Data protocol limitations

    For downloads, `window.saveAs`, provided by the [FileSaver shim](https://github.com/eligrey/FileSaver.js/),
    is usually a better choice than data URIs thanks to browser bugs and features. It is unavailable,
    however, in Internet Explorer 9 and below.

    Internet Explorer makes data URIs [mostly useless](http://msdn.microsoft.com/en-us/library/cc848897%28v=vs.85%29.aspx)
    for "security reasons;" they mostly only allow image embedding.

    [Chromium 69227](https://code.google.com/p/chromium/issues/detail?id=69227) causes Chrome
    crashes for even smallish downloads using data URIs.
    */

    $.ajaxTransport('datauri', function (options, originalOptions, xhr) {
        return {
            send: function (headers, done) {
                $.get(options.url, null, null, 'blob')
                .done(function (blob, s, xhr) {
                    if (window.FileReader) {
                        jax.dataUri(blob, function (uri) {
                            done(xhr.status, xhr.statusText, {datauri: uri},
                                xhr.getAllResponseHeaders());
                        });
                    } else {
                        var b64 = window.btoa(blob);
                        var type = (xhr.getResponseHeader('content-type') || 'text/plain').split(';')[0];
                        done(req.status, req.statusText, {datauri: 'data:' + type + ';base64,' + b64},
                            req.getAllResponseHeaders());
                    }
                })
                .fail(function (xhr) {
                    done(xhr.status, xhr.statusText, {text: xhr.responseText},
                        xhr.getAllResponseHeaders());
                });
            }
        };
    });

    /**
    Blob transport
    --------------

    Use `dataType: blob` in a jQuery ajax request to get the resource as a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob?redirectlocale=en-US&redirectslug=DOM%2FBlob),
    in browsers that support 'blob' as an ajax response type.

    In Internet Explorer 9 and below, response falls back to a string of bytes.
    */

    var ieBinaryStr = function (a) {
        // Adapted from comments on http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
        return pnVbsCStr(a).replace(/[\s\S]/g, function(t){
            var v= t.charCodeAt(0);
            if (v>>8 > 0xff) {
                console.log(v);
            }
            return String.fromCharCode(v&0xff, v>>8);
        }) + pnVbsLastByte(a);
    };

    $.ajaxTransport('blob', function (options, originalOptions, xhr) {
        if (options.type !== 'GET') {
            throw 'Unsupported http verb for blob transport: ' + options.type;
        }
        return {
            send: function (headers, done) {
                var req = new XMLHttpRequest();
                req.open('GET', options.url, true);
                if (window.FileReader) {
                    req.responseType = 'blob';
                    req.onload = function (e) {
                        done(req.status, req.statusText,
                            {blob: req.response
                                || new Blob([], {type: req.getResponseHeader('content-type')})
                            },
                            req.getAllResponseHeaders());
                    };
                } else {
                    req.onreadystatechange = function () {
                        if (req.readyState === 4) {
                            var binStr = ieBinaryStr(req.responseBody);
                            for (var i = 0; i < binStr.length; i++) {
                                if (binStr.charCodeAt(i) > 0xff) {
                                    // TODO: remove after finding bug where last char sometimes > 0xff in IE
                                    console.log('greater at ', i, ' of ', binStr.length);
                                }
                            }
                            done(req.status, req.statusText, {blob: ieBinaryStr(req.responseBody)},
                            req.getAllResponseHeaders());
                        }
                    };
                }
                req.send();
            }
        };
    });

    var folderRoot = function (files) {
        var splits = $.map(files, function (url) {
            // Remember that $.map flattens arrays one level
            return [pn.urlUtils.normalize(url).split('/')];
        });
        var common = '';
        for (var len = (splits[0] || []).length; len > 0; len--) {
            common = splits[0].slice(0, len).join('/');
            var matched = true;
            for (var i = 0; i < splits.length; i++) {
                matched = matched && splits[i].slice(0, len).join('/') === common;
            }
            if (matched) {
                break;
            }
        }
        return common;
    };

    /**
    Given a set of URLs, create a zip file and provide a Blob of the zip. The callback receives
    three arguments, `zipped`, `success` and `failure`. Zip is the zip Blob. Success and failure are
    lists of the URLs which were successfully zipped or failed, respectively. The urls in the
    failure list also include a `reason` property describing the error.

    The `urls` argument can either be several urls passed separately, as shown below, an array of
    URLs, or a plain object. If a plain object, the keys should be the URLs to download and the
    values should be the target path in the zip.

    The created zip's root folder becomes the deepest part of the target path that all the target
    paths share; thus, zipping 'foo/bar/baz' and 'foo/bar/foo' makes the root folder 'bar'.

        !!!
        <button>Create zip</button>
        <h5>Successful</h5>
        <ul class="success"></ul>
        <h5>Failed</h5>
        <ul class="failed"></ul>
        ---
        <script>
            example.find('button').on('click', function () {
                pn.jax.zip( 'api/test-media/Penguins.jpg',
                            'api/test-media/sintel.mp4',
                            'api/test-media/does not exist',
                    function (zipped, success, failure) {
                        $.each(success, function () {
                            $('<li></li>').text(this)
                                .appendTo(example.find('.success'))
                        })
                        $.each(failure, function () {
                            $('<li></li>').text(this + ' (' + this.reason + ')')
                                .appendTo(example.find('.failed'))
                        })
                        window.saveAs(zipped, 'client-generated.zip');
                    })
            })
        </script>

    Not available in Internet Explorer 9 or lower; test for availability by `if (pn.jax.zip) {...}`.
    */
    jax.zip = function (urls, complete) {
        var files = {};
        var mapFiles = function (urls) {
            $.each(urls, function (i, url) {
                files[url] = url;
            });
        };
        if (typeof urls === 'string') {
            mapFiles(Array.prototype.slice.call(arguments, 0, -1));
        } else if (urls.length) {
            mapFiles(urls);
        } else {
            files = urls;
        }
        complete = arguments[arguments.length - 1];
        var root = folderRoot(files).split('/').slice(0, -1).join('/') + '/';
        var success = [];
        var failure = [];
        var paths = {};
        zip.createWriter(new zip.BlobWriter('application/zip'), function (writer) {
            var countdown = 0;
            var maybeDone = function () {
                if (!countdown) {
                    writer.close(function (zipped) {
                        complete(zipped, success, failure);
                    });
                }
            };
            var ready = [];
            var locked = false;
            $.each(files, function (url, target) {
                ++countdown;
                var fail = function (xhr) {
                    --countdown;
                    failure.push($.extend(new String(url), {reason: xhr.status}));
                    maybeDone();
                };
                $.get(url, null, null, 'blob')
                .done(function (blob, s, xhr) {
                    if (!blob) {
                        // Empty reply, e.g. 204
                        blob = new Blob();
                    }
                    var add = function () {
                        locked = true;
                        // Synchronize additions to the zip since the writer hangs sometimes when
                        // adding entries in parallel
                        var path = target.replace(root, '');
                        writer.add(path, new zip.BlobReader(blob), function () {
                            success.push(url);
                            --countdown;
                            locked = false;
                            (ready.shift() || maybeDone)();
                        });
                    };
                    if (locked) {
                        ready.push(add);
                    } else {
                        add();
                    }
                })
                .fail(fail);
            });
            maybeDone();
        }, function (error) {
            console.error('Error creating zip writer', error);
        });
    };
    if (!window.zip) {
        delete jax.zip;
    }

    /**
    Convert a blob to a data URI and pass it to the given callback when complete.
    */
    jax.dataUri = function (blob, callback) {
        var reader = new FileReader();
        reader.onload = function () {
            callback(reader.result);
        };
        reader.readAsDataURL(blob);
    };

    /**
    Return true if the given http status code represents a success response. Also accepts any object
    with a "status" property.
    */
    jax.success = function (status) {
        status = status.status ? status.status : status;
        return status >= 200 && status < 300 || status === 304;
    };
});/*global pn */

/**
Snippet Loader
==============

The snippet loader handles loading chunks of HTML and executing scripts in a special snippet context
that integrates with other Pneumatic application layout functionality. Most snippets will be
complete views rendered as [tabs](#api/pane), but if flexibly designed, they can also often
function in other context, such as popups.

Applications can load snippets by one of three mechanisms:

- Call `pn.snip.load` (most flexible)
- Embed an anchor tag with class `pn-snip` (useful for embedding snippets within other snippets)
- Use a specially-formatted href in an anchor, (**preferred**)

Say a fragment of HTML exists at `echo.html`. A Pneumatic app can create a link that opens that
snippet in the layout's default position, provided by [flex](#api/flex) by making the href's hash
part the snippet URL:

    !!!
    <a href="#api/test-snips/echo.html">Open</a>

Once loaded, elements from snippets gain a `pn-src-...` class useful for targetting the snippet for
styling or inter-snippet communication, as described below.

The link can also contain query-style parameters that pass to the snippet; parameter format matches
the format produced by [pn.nav.params()](#api/nav), so typical href construction looks like so:

    !!!
    ---
    <a>Open with message</a>
    <script>
    this.attr('href', '#api/test-snips/echo.html?'
        + pn.nav.params({message: 'Hello, world'}))
    </script>
    ---
    <script>
    $('<pre></pre>').text(example.find('a').attr('href')).appendTo(example)
    </script>

Like the echo snippet, almost all snippets have some dynamic component, produced by its embedded 
script tags, "**snippet scripts**."

Snippet scripts
---------------

Script tags within snippets, "snippet scripts," execute after the snippet insertion handler;
generally this means that the snippet has been inserted into the document by the time its scripts
execute. Scripts must be inline; the snippet loader disallows script tags with `src` references.

Snippet scripts execute in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode).
The loader wraps each script in an anoynmous function, so variables may be declared without
polluting global namespace.

Snippet scripts should use `snip`, an augmented jQuery object to locate their own content:

> **Bad:** `$('.something-in-my-snippet')`
>
> **Good:** `snip.find('.something-in-my-snippet')`

While the first node selection example above will usually appear to work, it causes surprising
global effects should the same snippet load more than once, or another snippet use the
"something-in-my-snippet" class.

By default, the snippet-global variable, `snip` (aliased as `this`),
in a snippet script refers to the newly created nodes, but snippet scripts should expect that `snip`
may also be wrapper around the original markup as the insertion handler can modify the snippet's
context.

In addition to snippet content selection, the `snip` variable exposes two special properties:

- `snip.d`: data the snippet recieves from its loader
- `snip.fn`: functions the snippet exposes

### snip.d

Many snippets require parameters from the outside world. These parameters come either from
application-global [context settings](#api/nav), URL parameters from the current page URL, URL
parameters in a snippet link, or the "data" object provided to `pn.snip.load`. To snippet scripts,
all appear equivalent.

> The deprecated snippet-global `data` is equivalent to `snip.d`.

Snippet scripts usually do not need to change their data object, but can semi-preserve their state
by doing so. Snippet scripts should use this mechanism when the changes to the snippet state should
survive a refresh but not a new user session. If you toggle tests off in this page's Test Summary
snippet, for example, they remain off using this mechanism.

To preserve its modifications, a snippet should call [pn.nav.flushLayout()](#api/nav) after
modifying its data object; if not called immediately, the changes flush at some indeterminate future
time or never.

    !!!
    <a href="#api/test-snips/memory.html">Open memory example</a>
    ---
    ---
    <script>
    $.get('api/test-snips/memory.html', null, null, 'text')
    .done(function (html) {
        example.parent().find('code').text($(html).filter('script')[0].text
            .replace(/^\s/, '// api/test-snips/memory.html\n'))
    })
    </script>

Code outside the snippet can interrogate the snippet's data object using the `env` method of snippet
collections, described below.

#### Practical limits on snippet data length

The application's layout serialization mechanism includes serialized snippet data for snippets
loaded into the main flex. Large objects may run afoul of URL length limitations, such as
[IE 8's 2083 characters](http://support.microsoft.com/kb/208427). To avoid errors, design snippets
to construct their state from relatively little data.

If different snippets want to share a large amount of data, expose functions in each snippet to
allow the other to retrieve the data.

### snip.fn

Snippets should attach functions to the `snip.fn` object to expose those functions outside
themselves. This provides the primary mechanism for inter-snippet communication, described below.

### Snippet script debugging

Because snippet scripts create anonymous functions at runtime, debugging can be somewhat more
difficult than usual; in Internet Explorer and Firefox/Firebug, "debugger" statements are the
only available mechanism for setting a breakpoint, but the snippet loader does include two
features that help locate script errors but may nonetheless be surprising:

* Appends a magic comment to the snippet script source that allows Chrome debugger to see show
  the source.
* Redirects to the snippet URL on syntax errors in a snippet script. Use the back button once
  you fix the syntax error.

Nested snippets
---------------

The snippet loader replaces `pn-snip` anchor tags with the targetted snippet content; note that
snippets loaded this way cannot pass data in the URL. Nested snippets included by snippet anchor
tags share the same data object as their parent snippet.

    !!!
    <script>
        pn.snip.load('api/test-snips/parent.html',
            function (elements) {
                example.append(elements);
            });
        $.get('api/test-snips/parent.html', null, null, 'text')
        .done(function (parent) {
            $.get('api/test-snips/child.html', null, null, 'text')
            .done(function (child) {
                example.parent().find('code').text(parent + '\n' + child);
            });
        });
    </script>

Parent scripts execute before child scripts, but after the child markup has replace the `pn-snip`
link. Parents can therefore modify the data object to make changes visible to the children. Children
should not, however, try to communicate with their siblings by data object modification because
sibling scripts execute in unspecified order.

> **Warning**: Current design makes child snippets have no identity of their own. You cannot, for
> example, invoke functions on them. This turns out to be confusing and inconsistent. In the next
> snippet loader design revision, child snippets should recieve a copy of the parent data object and
> otherwise behave just like ordinary snippets.

*/

pn.module('snip', function (snip, $) {
    'use strict';

    var loading;
    // Randomize to (sort of) hide snippet data from prying code
    var datakey = pn.uuid();
    var pathkey = pn.uuid();
    var idkey = pn.uuid();
    var fnkey = pn.uuid();

    var throwLater = function (e) {
        setTimeout(function () {
            throw e.stack || e.toString();
        }, 0);
    };

    /**
    Inter-snippet communication
    ---------------------------

    Any code on the page can target snippet elements, generally by their `pn-src-...` class, since
    it is guaranteed to match the snippet's filename. Snippets will usually want to filter those
    other snippets to those that share some of their data parameters, which allows, for example,
    refreshing other snippets that display related data.

        !!!
        <button>Highlight all the snippets</button>
        <button>Highlight the snippet with a hello message</button>
        <script>
        pn.snip.load('api/test-snips/echo.html?message=Hello', function (snip) {
            example.append(snip)
        })
        pn.snip.load('api/test-snips/echo.html', function (snip) {
            example.append(snip)
        })
        </script>
        ---
        <script>
        example.find('button').first().on('click', function () {
            pn.snip('.pn-src-api-test-snips-echo')
                .css({border: 'thick solid red'})
        })
        example.find('button').last().on('click', function () {
            pn.snip('.pn-src-api-test-snips-echo', {
                message: 'Hello'
            }).css({border: 'thick solid blue'})
        })
        </script>

    The `snip.fn` API provides a flexible mechanism for invoking functions on snippets, so
    external code should usually not modify the snippet elements directly. The echo snippet
    exposes its "echo" function, for example:

        !!!
        <script>
        $.get('api/test-snips/echo.html', null, null, 'text')
        .done(function (html) {
            example.parent().find('code').text($(html).filter('script')[0].text
                .replace(/^\s/, '// api/test-snips/echo.html\n'))
        })
        pn.snip.load('api/test-snips/echo.html?message=Match%20this%20message', function (snip) {
            example.append(snip)
        })
        </script>
        ---

    Elsewhere, something can find the echo snippet and invoke its echo function:

        !!!
        <form>
            <label><span>Matcher</span>
                <input name="matcher" value="Match this message">
            </label>
            <label><span>New message</span>
                <input name="newMessage" value="Hello">
            </label>
            <button>Change</button>
        </form>
        ---
        <script>
        pn.form.onsubmit(example.find('form'), function (e, form) {
            var snips = pn.snip('.pn-src-api-test-snips-echo', {
                message: form.matcher
            })
            snips.css({border: 'thick solid orange'})
            var echoed = snips.fn('echo')(form.newMessage)
            example.find('[name=matcher]').val(echoed[0])
        })
        </script>

    Snippet functions cross window boundaries. This generally works transparently, but **beware that
    `instanceof` may not give expected results**, since when an argument crosses a window boundary,
    it is an instance of the creator's constructor, which is a strictly different object when in
    another window.

    */
        /**
        In the given jQuery bag of nodes or selector, filter to snippets whose environment matches
        the given filter object. This deems the filter a match when each key in the filter matches a
        key in the snippet's environment, using strict, `===`, comparison. The filter searches all
        windows in the application.
        */
        snip = function (selector, filter) {
            var collection = $();
            pn.wins.anywhere(selector).each(function (i, node) {
                altWindow(node,
                    function () {
                        var data = $(node).data(datakey);
                        if (!data) {
                            return;
                        }
                        for (var k in filter || {}) {
                            if (data[k] !== filter[k]) {
                                return;
                            }
                        }
                        collection = collection.add(node);
                    },
                    function (other) {
                        collection = collection.add(other(node, filter));
                    });
            });
            return $.extend(collection, collectionMethods);
        };

        /* Not intended for public use, but required for inter-window operation */
        snip._sameSource = function (a, b) {
            return a.data(idkey) && a.data(idkey) === b.data(idkey);
        };

        var altWindow = function (node, here, there) {
            // TODO: this whole mechanism will have trouble if you ever move a node from one window
            //      to another
            var owner;
            try {
                owner = pn.wins.owner(node);
            } catch (e) {
                // IE has probably seen fit to close the window since we last accessed the node
                return;
            }
            if (!owner) {
                return here();
            } else {
                try {
                    return there(owner.pn.snip);
                } catch (e) {
                    // In Internet Explorer, the window can begin to close between invoking a 
                    // function in it and using the function's result, causing an error, so check to
                    // see if that's probably the cause.
                    try {
                        $(owner.document);
                        throw e;
                    } catch (e) {
                        // The other window became invalid. Ignore.
                    }
                }
            }
        };
        var eachUnique = function (collection, here, there) {
            var uniq = [];
            $.each(collection, function (i, node) {
                node = $(node);
                var applicator = function (fn) {
                    return function (other) {
                        for (var j = 0; j < uniq.length; j++) {
                            if ((other || snip)._sameSource(node, uniq[j])) {
                                return;
                            }
                        }
                        uniq.push(node);
                        return fn(node, other);
                    };
                };
                altWindow(node[0], applicator(here), applicator(there));
            });
        };

        /**
        ### Methods of snippet collections
        */

        var collectionMethods = {
            /**
            Retrieve a JSON-serializable representation of the snippet's environment data. The
            result is a copy of the snippet's `snip.d` environment, so the caller cannot modify
            the data. When the collection contains more than one snippet, this returns the first
            snippet's environment.
            */
            env: function () {
                var node = this[0];
                if (node) {
                    return altWindow(node,
                        function () {
                            return JSON.parse(JSON.stringify($(node).data(datakey) || {}));
                        },
                        function (other) {
                            return other(node).env();
                        });
                }
                return {};
            },

            /**
            Returns a list of URLs suitable for rebuilding the snippets in the collection; 
            if the collection contains multiple nodes from the same snippet, this represents
            them as a single URL. Callers will usually want to pass this result to
            [`pn.nav.snipsUrl`](#api/nav).

            Unlike the other snippet collection methods, this ignores nodes in other windows.
            */
            urls: function () {
                var result = [];
                eachUnique(this, function (node) {
                    var path = node.data(pathkey);
                    var params = pn.nav.params(node.data(datakey));
                    if (params.length > 512) {
                        console.warn('Snippet from ' + path
                            + ' serialized an unreasonable amount of data');
                    }
                    // TODO: need robust relativizer
                    result.push(path.replace(pn.urlUtils.normalize('.'), '')
                        + (params ? '?' + params : ''));
                }, $.noop);
                return result;
            },

            /**
            This returns a function that invokes the corresponding function exposed by each
            snippet in the snippet collection. Snippets can expose functions by attaching them
            to their `snip.fn` objects.

            An invocation like `pn.snip('.pn-src-stuff').fn('doit')()` returns an array holding
            the return values of the function invocation for each snippet in the collection. On
            empty snippet collections, the array will be empty.

            Every snippet in the collection must provide the named method. If any does not, none
            of the functions run. This does not trap errors thrown by the snippet functions, so
            if any throws an error, that error propagates and some of the functions may not
            execute.

            Like the `snip.d` object, parent and child snippets share `snip.fn`.
            */
            fn: function (name) {
                var callees = [];
                eachUnique(this, 
                    function (node) {
                        var fn = $(node).data(fnkey)[name];
                        if (!fn) {
                            throw $(node).data(pathkey) + ' does not provide function "' + name + '"';
                        }
                        callees.push(fn);
                    },
                    function (node, other) {
                        callees.push(other(node).fn(name));
                    });
                return function () {
                    var results = [];
                    var args = arguments;
                    $.each(callees, function (i, callee) {
                        results.push(callee.apply(null, args));
                    });
                    return results;
                };
            },

            /**
            Filters the snippet collection to only those that provide a given function.

            > Not yet implemented.
            */
            provides: function (name) {
                throw 'TODO: snip().provides';
            }
        };

    (function () {
        var empty = function (mark) {
            for (var k in mark.snips) {
                if (mark.snips.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        };
        var marks = [];
        var marking = [];
        var snipCount = 0;
        var done = function (handle, wrapper) {
            var doneQueue = [];
            $.each(marks, function (i, mark) {
                delete mark.snips[handle];
                if (empty(mark)) {
                    doneQueue.push(function () {
                        try {
                            mark.fn();
                        } catch (e) {
                            throwLater(e);
                        }
                    });
                }
            });
            wrapper(function () {
                while (doneQueue.length) {
                    doneQueue.pop()();
                }
            });
            marks = $.grep(marks, function (v) {
                return !empty(v);
            });
        };
        loading = {
            mark: function (fn) {
                if (fn) {
                    marks.push({
                        fn: fn,
                        snips: {}
                    });
                    marking.push(marks.length - 1);
                } else {
                    marking.pop();
                    done(null, function (run) {
                        // setTimeout makes snip.after behave the same, that is, async regardless of
                        // whether any snippets got loaded
                        setTimeout(run, 0);
                    });
                }
            },
            start: function () {
                snipCount += 1;
                $.each(marking, function () {
                    marks[this].snips[snipCount] = true;
                });
                return snipCount;
            },
            done: function (handle) {
                done(handle, function (run) {
                    run();
                });
            }
        };
    })();

    var loadAnchors = function (parent, ready) {
        // TODO: child urls should be relative to parent location?
        // TODO: preserve classes from the original link
        var countdown = 1;
        var children = [];
        var maybeDone = function () {
            if (!--countdown && ready) {
                ready(children);
            }
        };
        parent.children().any('a.snippet, a.pn-snip').each(function (i, anchor) {
            // TODO: deprecate "snippet" class
            pn.assert(anchor.href, 'snippet link has no url', anchor);
            // TODO: allow data to be loaded from anchor url?
            ++countdown;
            var url = anchor.href;
            process(url, function (child, scripts, childDone) {
                var snippet = child.children().addClass(snip.urlToClass(url)).replaceAll(anchor);
                $.each(scripts, function (i, script) {
                    children.push(function () {
                        script.apply(snippet, arguments);
                    });
                });
                if (ready) {
                    // This is a child snippet, so mark it loaded for snip.after purposes before
                    // completing
                    childDone();
                    maybeDone();
                } else {
                    // No callback, so not a child, so treat as a top-level snippet
                    var data = {};
                    var methods = prep(url, snippet, data);
                    try {
                        applicator(url)(run, snippet, [scripts, data, methods]);
                    } catch (e) {
                        // This snippet failed, but since we're treating it as a top-level snippet,
                        // log the error and continue
                        console.error(e.message || e.toString());
                    }
                    childDone();
                }
            });
        });
        maybeDone();
    };

    var process = function (url, ready) {
        // We might want to add some sort of caching here if this becomes a bottleneck
        var handle = loading.start();
        // Force request as always plain text to avoid relying on server configuration. Also, no
        // need to pass url params to the server, so dump them to allow caching.
        $.get(url.split('?')[0], null, null, 'text')
        .done(function (html) {
            html = $(html);
            var urlPath = url.split('?');
            if (html.any('[id]').length) {
                console.warn('Snippet from ' + urlPath + ' uses hard-coded IDs');
            }
            var scriptNodes = html.any('script').remove(); // Remove drops nested scripts only
            // When you insert a jQuery object into the dom, jQuery removes script tags and executes
            // them. It does not give you the ability to change their execution contexts though.
            // TODO: this will fail if the script is nested inside another node
            var snippet = $(document.createDocumentFragment()).append(html.not('script'));
            var scripts = $.map(scriptNodes, function (script) {
                pn.assert(!script.src, 'src attributes not allowed in snippet scripts (' + url + ')');
                // Magic comment allows the script to appear named in the debugger, but urls could
                // potentially come from untrusted input, so limit allowed characters to avoid
                // code injection
                var source = '"use strict";' + script.text
                    + '\n//# sourceURL=' + urlPath[0].replace(/[^\w.\/\-:]/gm, '+');
                try {
                    /*jshint evil:true*/
                    // TODO: always use strict
                    // the use of Function here is vital (it provides control over execution scope)
                    var scriptFn = new Function(['snip', 'data'], source);
                } catch (e) {
                    // Syntax error. The message is useless when using the function constructor, so
                    // direct the browser directly to the snippet, where its console will then
                    // reparse the script and give a more helpful message.
                    window.location = url;
                    throw e;
                }
                return function (data, methods) {
                    // In IE 8, extension must start with a jQuery object, otherwise something like
                    // context.filter('stuff') returns something without normal jQuery methods
                    var context = $.extend($(), {
                            d: data,
                            fn: methods
                        }, this);
                    scriptFn.call(context, context, data);
                };
            });
            loadAnchors(snippet, function (children) {
                ready(snippet, scripts.concat(children), function () {
                    loading.done(handle);
                });
            });
        });
    };

    var applicator = function (url) {
        return function (fn, context, args) {
            try {
                return fn.apply(context, args);
            } catch (e) {
                throw new Error('Error loading snippet from [' + url + ']\n'
                    + (e.stack ? e.stack : e.toString()));
            }
        };
    };

    var prep = function (url, snippet, data) {
        snippet.data(datakey, data);
        snippet.data(pathkey, pn.urlUtils.normalize(url));
        snippet.data(idkey, pn.uuid());
        snippet.addClass(snip.urlToClass(url));
        var methods = {};
        snippet.data(fnkey, methods);
        return methods;
    };

    var run = function (scripts, data, methods) {
        var context = this;
        $.each(scripts, function (i, script) {
            script.call(context, data, methods);
        });
    };

    /**
    Load a snippet from the given url. This calls the given callback with a jQuery object produced
    after parsing the snippet markup. The callback should usually insert the snippet into the DOM.

        !!!
        <script>
            pn.snip.load('api/test-snips/snippet-example.html',
                function (elements) {
                    example.append(elements);
                });
        </script>

    The optional `data` argument passes to snippet scripts so that it is in scope as `snip.d`.

    ### Postponing script execution

    The inserter callback can postpone snippet script execution, such as for when you want to insert
    a list of snippets in a specific order that depends on the content of those snippets, by calling
    `this.defer`. The defer method returns a function that the inserter should call, optionally
    passing a jQuery bag, analogous to returning a modified script context.
    */
    snip.load = function (url, callback, data) {
        // data order allows proper linking to multiple snippets since the pane link handler
        // passes global context as data because window.location at the time no longer contains it;
        // url parameters therefore must take higher preference than the data object
        data = $.extend(true, pn.nav.params(), data, pn.nav.params(url));
        process(url, function (snippet, scripts, complete) {
            var nodes = snippet.children();
            var exec = function (modded) {
                modded = modded || nodes;
                var methods = prep(url, modded, data);
                try {
                    applicator(url)(run, modded, [scripts, data, methods]);
                } finally {
                    complete();
                }
                return modded;
            };
            var context = {
                defer: function () {
                    var go = exec;
                    exec = $.noop;
                    return go;
                }
            };
            var altered;
            try {
                altered = applicator(url)(callback, context, [nodes]);
            } catch (e) {
                complete();
                throw e;
            }
            exec(altered);
        });
    };

    /**
    Run a callback once after some number of snippet loads. Both parameters should be functions; the
    first may start any number of snippet loads. Once all snippet loads it starts completes, the
    callback will execute. Execution context for both is undefined and neither receives any
    arguments.

    The callback executes regardless of whether the load function or any snippet script throws an
    error.
    */
    snip.after = function (load, callback) {
        loading.mark(callback);
        try {
            load();
        } catch (e) {
            throwLater(e);
        }
        loading.mark();
    };

    /**
    Exposes the algorithm used to link a snippet's url to a class in the DOM so it can be readily
    found later. It's important to expose this so another module can use it to identify snippets
    once loaded.

    Legal characters in a class name are a-z, A-Z, 0-9, -, and _ class name may not begin with a
    number, and can only begin with a hyphen if followed by a letter or underscore

    - strip leading http: and trailing .html
    - replace anything other than alpha-numeric characters with hyphens
    - replace runs of hyphens with a single hyphen
    - eliminate leading hyphens

    TODO: consider dropping this function, instead returning the relevant value from `pn.snip.load`.
    */
    snip.urlToClass = function(url) {
        // IE does not have window.location.origin
        // TODO: need a robust relativizer
        var origin = window.location.protocol + '//' + window.location.host;
        var root = origin + window.location.pathname.replace(/[^\/]*\.[^\/]*$/, '');
        return "pn-src-" + url.split('?')[0].replace(root, '')
            .replace(/[^a-zA-Z0-9\_]/g, '-') // replace all non alphanumeric chars with -
            .replace(/(\-)+/g, '-') // reduce strings of hyphens to single hyphens
            .replace(/(^\-|\-html$)/g, ''); // eliminate leading hyphen or trailing -html
    };

    /**
    Look for anchor tags with class snippet and replace them with rendered snippets from their href
    attribute. This module queues the init method to be called on document ready when included in a
    page. Fires automatically on document ready.

    The optional context parameter restricts the scope to be searched for snippet anchors. It can be
    any selector valid for jQuery's find method.
    */
    snip.init = function (context) {
        loadAnchors($(context || document));
    };
    $(function () { snip.init(); });

    return snip;
});

/*jslint browser: true, white: true */
/*global console, pn */

/**
Flexible Layout
===============

Flexible layout manages non-overlapping view layouts.

    layout = {
        minimum_pane_width:0.1,
        minimum_pane_height:0.1,
        columns: [
            {
                left:0.0,
                right:1.0,
                rows:[
                    {
                        top:0,
                        bottom:1,
                        pane: [serialized pane],
                        content: [html or jQuery bag - mutually exclusive with "pane"]
                    }
                ]
            }
        ]
    }

> Content should nearly always use the pane/snippet mechanism. Content not loaded this way currently
> does not support drag & drop.

Where there's more than one column or row the right (bottom) of column (row) n should
agree with the left (top) of column (row) n+1. If not they soon will.

Example
-------

Here's a very simple sidebar / content layout. You can add more tabs/panes by dragging (assuming drag5 is present).

    !!!
    <div id="flex-test"></div>
    <script>
        example.append(this);
        var target = example.find('#flex-test')
            .css({
                "position": "relative",
                width: 400,
                height: 300,
                border: "1px dashed gray"
            })
        pn.flexLayout( target, {
            columns: [
                {
                    left: 0.0,
                    right: 0.33,
                    rows: [
                        {
                            top: 0,
                            bottom: 1,
                            content: $('<p>sidebar</p>')
                        }
                    ]
                },
                {
                    left: 0.33,
                    right: 1,
                    rows: [
                        {
                            top: 0,
                            bottom: 1,
                            pane: {
                                active: 0,
                                snips: ['api/test-snips/snippet-example.html',
                                        'api/test-snips/snippet-example.html']
                            }
                        }
                    ]
                }
            ]
        });
    </script>

Usage
-----

pn.flexLayout( <selector>[, <layout>] ); // returns a handle to the flex object

flexLayout internally tracks every flex created (so you don't have to). If you call
it on a selector which already has a flex it will find the pre-existing flex and
return it. If you set a new layout it will automatically clear the existing layout
and build out the new layout.

Sending the window a resize event will force flexLayout to update itself, including
removing empty panes.

Everything lives in a (x:[0,1],y:[0,1]) coordinate system.

Attributes
----------

data-browser-snippet -- designates snippet to be used to handle urls dragged into the flex

Pane Lifecycle
--------------

A pane is generally created by using make_pane which inserts the appropriate 
entity in the layout structure and then fires a reset.

When first created, a pane will have been passed content, which could be:

 * html (this is a legacy feature -- don't use it!)
 * a "bag of nodes" (i.e. stuff built using jQuery, e.g. $('<p/>').text("hello")
 * a custom object of the form {url: <url>} or {content: <html>}

The key cases to consider are (a) actual content (e.g. bag of nodes or HTML)
and (b) a url, which is going to be loaded by snip.

In the case of actual content, the content is inserted into the new pane. In the
case of a url, the url is attached to the layout entity.

Then an update is fired.

The __update event__ maintains pane metrics and also checks for panes that need
to be loaded (i.e. have a url) and panes that are empty (i.e. no longer have
content).

1. If a pane has a url, it loads it and places a "promise of future content"
   into the pane so it won't be removed while content is loading.

2. If the pane has a "promise of future content" then it's treated as though it
   has content and left alone.

3. If the pane has content it's left alone.

4. If the pane has no content and no promise of future content it's stripped
   out and a new update event if fired.

A pane created from a url will generally pass from 1 -> 2 -> 3, and then
if closed will transition to 4.

A pane created from actual content will pass straight to 3, and then if closed
will transition to 4.

Ideas for further development
-----------------------------

* Better size negotiation options
  * implement collapsible pane bodies
  * implement tabs and accordions
  * fix width and height on insertion based on min_width/height (i.e. rescale the portion beyond minimum rather than entire size)
  * implement spanning regions (e.g. toolbar) and fixed dimension regions
* remove any need for external CSS (questionable)
* maximum number of columns
* maximum number of rows
* do not generate regions for columns/rows once relevant max has been reached
* default can be based on minimum width/height  
*/

pn.module('flexLayout', function(flexLayout, $){
    "use strict";

    var flex_list = [];
    var ignoreResizeEvents = false;

    function clamp(value, min, max){
        return value < min ? min : ( value > max ? max : value );
    }

    function randomColor(){
        return 'rgba(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',0.25)';
    }

    function Flex(target, layout){
        var self = this;
        this.target = $(target);

        this.fix_size();
        this.handle_drag('.flex-handle[data-action=hsize]', this.hsize);
        this.handle_drag('.flex-handle[data-action=vsize]', this.vsize);

        $(window).on('resize', function () {
            self.resize();
        });

        // handle sidebar resizing
        $(this.target).on('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function(evt){
            if(evt.target == self.target.get(0)){
                self.resize();
            }
        });

        this.setLayout( layout );

        return this;
    }

    /**
     * target -- CSS selector: find associated flex
     * layout -- set flex associated with target to new layout, or create new flex
     * returns -- reference to the flex associated with target (if any)
     */
    flexLayout = function(target, layout){
        target = $(target);
        var flex;

        $.each( flex_list, function( idx, possible ){
            if( possible.target[0] === target[0] ){
                flex = possible;
                return false;
            }
        });

        if( layout !== undefined ){
            if (typeof layout === 'string') {
                layout = Flex.prototype.fromURL(layout);
            }
            layout = $.extend( {}, layout );
            if( !flex ){
                flex = new Flex( target, layout );
                flex_list.push( flex );
            } else {
                flex.setLayout( layout );
            }
        }
        
        return flex;
    };
    
    // brute force performance hack to allow flex resizing to be globally disabled
    // while we mess with the DOM
    flexLayout.ignoreResizeEvents = function(){
        // console.log('ignoring resize events');
        ignoreResizeEvents = true;
    };
    
    flexLayout.attendResizeEvents = function(){
        // console.log('attending resize events');
        ignoreResizeEvents = false;
        $('body').trigger('resize');
    };
    
    // brute force performance hack TODO remove if webkit somehow gets less broken
    // hides non-hidden content of all panes before a resize is handled to prevent
    // webkit from brokenly recalculating metrics of complex tables
    Flex.prototype.hideContent = function(){
        if( !this.temporarilyHidden ){
            this.temporarilyHidden = this.target.children('.pane')
                          .children('.view')
                          .children('.body')
                          .children()
                          .filter(function(){ 
                              return $(this).css('display') !== 'none';
                          })
                          .css('display', 'none');
        }
    };
    
    Flex.prototype.showContent = function(){
        if( this.temporarilyHidden ){
            this.temporarilyHidden.css('display','');
            this.temporarilyHidden = false;
        }
    };
    
    /**
     * Transparently replace position:fixed with absolute and then replicate position:fixed behavior
     */
    Flex.prototype.fix_size = function(){
        if( !this.fauxFixed && this.target.css('position') === 'fixed' ){
            this.fauxFixed = {
                left: this.target.css('left'),
                top: this.target.css('top'),
                bottom: this.target.css('bottom'),
                right: this.target.css('right')
            };
        }
    
        if( this.fauxFixed ){
            var w = $(window);
        
            this.target.css({
                position: 'absolute',
                height: w.width() - this.fauxFixed.bottom - this.fauxFixed.top,
                width: w.height() - this.fauxFixed.right - this.fauxFixed.left
            });
        }
        
        return this;
    };

    Flex.prototype.handle_drag = function( filter, moveHandler ){
        var flex = this;
        flex.target
            .on('mousedown', {flex: flex}, function(evt){
                if( $(evt.target).is(filter) ){
                    $('html').on('selectstart', false);
                    $('iframe').hide();
                    flex.hideContent();
                    evt.stopPropagation();
                    flex.target
                        .on('mousemove', {src: evt.target}, function(evt){ 
                            evt.stopPropagation();
                            moveHandler.call(flex, evt);
                        })
                        .on('mouseup', {src: evt.target}, function(evt){ 
                            evt.stopPropagation();
                            flex.target.off('mousemove');
                            flex.target.off('mouseup');
                            $('html').off('selectstart', false);
                            $('iframe').show();
                            flex.showContent();
                            pn.nav.flushLayout();
                        });
                }
            })
            .on('keydown', {src: false}, function(evt){
                evt.stopPropagation();
                if( $(evt.target).is(filter) ){
                    moveHandler.call(flex, evt);
                    $(evt.target).focus();
                    pn.nav.flushLayout();
                }
            });
    };

    /**
     * Set the layout of a flex
     * layout
     * returns the flex object
     * 
     * > Layout is a public property of flex. It should either be private or allow setting via
     * > flex.layout = {...}
     */
    Flex.prototype.setLayout = function( layout ){
        this.target.empty();
        this.layout = $.extend({
            debug: false,
            handle_size: 8,
            minimum_pane_width: 0.1,
            minimum_pane_height: 0.1,
            max_columns: 3,
            max_rows: 3,
            columns: []
        }, layout);

        if( this.layout.columns ){
            $.each( this.layout.columns, function( idx, col ){
                $.each( col.rows, function( idx, pane ){
                    delete pane.element;
                });
            });
        }

        this.debug = this.layout.debug;
        
        this.update();

        return this;
    };

    /**
     * return JSON representation of the layout
     *
     * essentially we're stripping out the temporary data that gets tucked into the structure
     * at runtime for convenience, including backreferences to the DOM which would block serialization
     */
    Flex.prototype.toJSON = function(){
        var layout = this.layout;

        function rows( column ){
            var i, the_rows = [];

            for( i = 0; i < column.rows.length; i++ ){
                var pane = {
                    top: column.rows[i].top,
                    bottom: column.rows[i].bottom
                };

                if( column.rows[i].url !== undefined ){
                    pane.url = column.rows[i].url;
                } else if( column.rows[i].content !== undefined ){
                    pane.content = column.rows[i].content;
                }

                the_rows.push(pane);
            }

            return the_rows;
        }

        function columns(){
            var i, column, the_cols = [];

            for( i = 0; i < layout.columns.length; i++ ){
                column = layout.columns[i];
                the_cols.push({
                    left: column.left,
                    right: column.right,
                    rows: rows( column )
                });
            }

            return the_cols;
        }

        return {
            minimum_pane_width: layout.minimum_pane_width,
            minimum_pane_height: layout.minimum_pane_height,
            max_columns: layout.max_columns,
            max_rows: layout.max_rows,
            columns: columns()
        };
    };

    /**
    Return an URL-safe representation of the flex.
    */
    Flex.prototype.toURL = function(){
        var result = $.map(this.layout.columns, function (col) {
            return {
                L: Math.round(col.left * 100),
                R: Math.round(col.right * 100),
                C: $.map(col.rows, function (row) {
                    var pane = pn.pane.serialize(row.element);
                    if (row.pane) {
                        // Use row.pane if this function gets fed a layout that's not been rendered.
                        // Do not always fall back to it, however, because row.pane may be missing
                        // if the flex was constructed from arbitrary nodes rather than serialized
                        // panes. In that case, leave it alone so it just drops the content, creating
                        // an empty pane.
                        pane = pane.snips.length ? pane : row.pane;
                    }
                    return {
                        T: row.top,
                        B: row.bottom,
                        C: pane
                    };
                })
            };
        });
        return encodeURIComponent(JSON.stringify(result));
    };

    /**
    Return a layout object from an URL representation as created by `Flex.toURL`.
    */
    Flex.prototype.fromURL = function(url) {
        // TODO: min-width, max-width?
        var minified_layout = JSON.parse( decodeURIComponent(url) );
        return {
            columns: $.map(minified_layout, function (col) {
                return {
                    left: col.L * 0.01,
                    right: col.R * 0.01,
                    rows: $.map(col.C, function (row) {
                        return {
                            top: row.T,
                            bottom: row.B,
                            pane: row.C
                        };
                    })
                };
            })
        };
    };

    // return stringified JSON representation suitable for localStorage
    Flex.prototype.toString = function(){
        return JSON.stringify( this.toJSON() );
    };

    // reuturn css/dimensions struct for column or specific pane
    Flex.prototype.dimensions = function(c, r){
        var layout = this.layout,
            target = this.target,
            top = 0,
            height = target.height(),
            width = target.width();
        c = layout.columns[c];
        if( r >= 0 ){ // note -- false if r is undefined!
            r = c.rows[r];
            top = r.top * height;
            height *= (r.bottom - r.top);
        }
        return {
            left: Math.round(c.left * width),
            top: Math.round(top),
            width: Math.round((c.right - c.left) * width),
            height: Math.round(height)
        };
    };

    // abstracts out mouse and keyboard manipulation of column sizers
    Flex.prototype.synthesize_x = function(event){
        var elt = $(event.target),
            x,
            offset = this.target.offset();

        if( event.type === 'mousemove'){
            x = ( event.pageX - offset.left );
        } else {
            x = elt.offset().left - offset.left + elt.width() * 0.5;
            switch(event.which){
                case 37:
                    x -= event.shiftKey ? 1 : 20;
                    break;
                case 39:
                    x += event.shiftKey ? 1 : 20;
                    break;
            }
        }
        return x / this.target.width();
    };

    Flex.prototype.hsize = function(event){
        var layout = this.layout,
            src = $(event.data.src || event.target),
            col = parseInt(src.attr('data-col'), 10),
            left = layout.columns[col - 1],
            right = layout.columns[col],
            x = clamp(this.synthesize_x(event), left.left + layout.minimum_pane_width, right.right - layout.minimum_pane_width);

        left.right = x;
        right.left = x;
        this.update_column(col - 1);
        this.update_column(col);
    };

    // abstracts out mouse and keyboard manipulation of row sizers
    Flex.prototype.synthesize_y = function(event){
        var elt = $(event.target),
            y;

        if( event.type === 'mousemove'){
            y = ( event.pageY - this.target.offset().top );
        } else {
            y = elt.offset().top - this.target.offset().top + elt.height() * 0.5;
            switch(event.which){
                case 38:
                    y -= event.shiftKey ? 1 : 20;
                    break;
                case 40:
                    y += event.shiftKey ? 1 : 20;
                    break;
            }
        }
        return y / this.target.height();
    };

    Flex.prototype.vsize = function(event){
        var layout = this.layout,
            src = $(event.data.src || event.target),
            col = parseInt(src.attr('data-col'), 10),
            row = parseInt(src.attr('data-row'), 10),
            upper = layout.columns[col].rows[row - 1],
            lower = layout.columns[col].rows[row],
            y = clamp(this.synthesize_y(event), upper.top + layout.minimum_pane_height, lower.bottom - layout.minimum_pane_height);

        upper.bottom = y;
        lower.top = y;
        this.update_column(col);
    };

    /*
        creates/updates resize handles and drop targets for panes
    */
    Flex.prototype.handle = function(container, name, x, y, w, h, action, dropType, col, row){
        var cursor = '',
            elt = container[name],
            flex = this;

        if( x === false ){
            if(elt) { 
                elt.detach(); 
            }
        } else {
            switch( action ){
                case 'hsize':
                    cursor = 'col-resize';
                    break;
                case 'vsize':
                    cursor = "row-resize";
                    break;
            }

            if( !elt ){
                elt = $('<div>')
                        .addClass('flex-handle')
                        .addClass('flex-drop-' + dropType)
                        .css({
                            // "background-color": randomColor(),
                            position: "absolute"
                        })
                        .drop5('url', function(e){
                            e.preventDefault(); // Or Firefox propagates up to window.location
                            var dataTransfer = e.originalEvent.dataTransfer,
                                url = dataTransfer.getData('url') || "",
                                col = $(e.target).attr('data-col'),
                                row = $(e.target).attr('data-row'),
                                snippet,
                                id = dataTransfer.getData('id'),
                                srcElt = $('[data-drag-id=' + id + ']').closest('.tab'),
                                browserSnippet = flex.target.attr('data-browser-snippet');

                            if( srcElt.length && srcElt.is('.tab') ){
                                // TODO: office action needs to save itself locally on destroy and this will work perfectly
                                // TODO: find srcElt in other windows and kill it
                                pn.pane.remove(srcElt);
                            }
                            if (pn.nav.parts(url).snips) {
                                snippet = {
                                    pane: {
                                        snips: pn.nav.parts(url).snips
                                    }
                                };
                            } else if( browserSnippet ){
                                // TODO: Wouldn't leaving default behavior be fine? That is, the 
                                //      specific application can handle external URL drops if it
                                //      likes, or just ignore them and allow the browser to do what
                                //      it will
                                snippet = {
                                    pane: {
                                        snips: [browserSnippet + '?url=' + encodeURIComponent(url)]
                                    }
                                };
                                e.originalEvent.preventDefault();
                            } else {
                                return;
                            }

                            switch( dropType ){
                                case "tab":
                                    flex.add_tab(col, row, snippet);
                                    break;
                                case "column":
                                    flex.insert_column(col, snippet);
                                    break;
                                case "pane":
                                    flex.insert_pane(col, row, snippet);
                                    break;
                            }
                        });
                container[name] = elt;
            }

            elt
                .css({
                    top: y,
                    left: x,
                    width: w,
                    height: h,
                    cursor: cursor
                })
                .attr({
                    'data-col': col,
                    'data-row': row
                });

            if( action ){
                elt.attr('data-action', action);
            }

            if( action === 'hsize' || action === 'vsize' ){
                elt.attr('tabindex', 0);
            }
            elt.appendTo(this.target);
        }
    };

    (function () {
        var suspend = false;
        Flex.prototype.update = function(byResize) {
            if( ignoreResizeEvents ){
                return;
            }
            // console.log('flex resizing', byResize);
            this.hideContent();
            if (suspend) {
                // Pane movements trigger resizes, which call flex.update. Ignore those calls.
                if (!byResize) {
                    // circular logic somewhere
                    console.warn('Tried to force a parallel flex update');
                }
                return;
            }
            suspend = true;
            var flex = this;
            flex.fix_size();
            $.each(flex.layout.columns, function(col, column){
                $.each( column.rows, function(row, pane){
                    var element = pane.element ? pane.element : $('<div />').appendTo(flex.target);
                    element.attr({
                        'data-flex-col': col,
                        'data-flex-row': row
                    });
                    if (pane.element) {
                        return;
                    }
                    pane.element = element;
                    pn.assert(!(pane.content && pane.pane), 'Flex layout cannot contain both "content" and "pane"');
                    if (pane.data) {
                        console.warn('Removed feature: attached snippet data to a layout. Now does not pass to snippet.');
                    }
                    if (pane.url) {
                        console.warn('Removed feature: url property on layout. Now does not load as snippet.');
                    }
                    if (pane.pane) {
                        pn.pane.restore(pane.pane, pane.element);
                        if (pane.element.children().length) {
                            // pane.restore puts in "loading" views, so this can size the pane before the
                            // snippets actually load. Check that the pane has some content though,
                            // because a serialized layout can contain an empty pane
                            flex.update_pane(col, row);
                        }
                    } else {
                        pn.pane.move(pane.content, element);
                    }
                });
            });

            // strip empty panes from layout
            (function () {
                for (var i = 0; i < flex.layout.columns.length; i++) {
                    for (var j = 0; j < flex.layout.columns[i].rows.length; j++) {
                        var element = flex.layout.columns[i].rows[j].element;
                        if (!element
                            || element.find('.view, .flexElt').length) {
                            continue;
                        }
                        var colCount = flex.layout.columns.length;
                        remove_pane(flex, i, j);
                        ++j;
                        if (flex.layout.columns.length < colCount) {
                            ++i;
                            break;
                        }
                    }
                }
            }());

            if( flex.layout.columns.length ){
                $.each(flex.layout.columns, function(col){
                    flex.update_column(col);
                });
            } else {
                this.handle({}, "handle_flex", 0, 0, flex.target.width(), flex.target.height(), false, 'column', 0, 0);
            }

            this.target.find('.tab').each(function(){
                var tab = $(this);
                if(tab.hasClass('pn-nodrag')){
                    // TODO: implement nodrag in pane.js
                    tab.on('dragstart', function(e){ e.preventDefault(); e.stopPropagation(); });
                }
            });

            suspend = false;
            this.showContent();
        };
    })();

    Flex.prototype.resize = function(){
        this.update(true);
    };

    Flex.prototype.update_column = function(col){
        var handle_size = this.layout.handle_size,
            column = this.layout.columns[col],
            r = this.dimensions(col),
            flex = this;
        
        this.handle(column, "handle_left", col === 0 ? 0 : false, 0, handle_size, r.height, false, 'column', 0, false);
        $.each(column.rows, function (row /*, container */) {
            flex.update_pane(col, row);
        });
        if( col < this.layout.columns.length - 1 ){
            this.handle(column, "handle_right", r.left + r.width - handle_size/2, 0, handle_size, r.height, 'hsize', 'column', col + 1, false);
        } else {
            this.handle(column, "handle_right", r.left + r.width - handle_size, 0, handle_size, r.height, false, 'column', col + 1, false);
        }
    };

    Flex.prototype.update_pane = function(col, row){
        var handle_size = this.layout.handle_size,
            r = this.dimensions(col, row),
            column = this.layout.columns[col],
            container = column.rows[row],
            handle_left = col === 0 ? r.left + handle_size : r.left + handle_size/2,
            last_col = col === this.layout.columns.length - 1,
            handle_width = r.width - handle_size - (col === 0 ? handle_size/2 : 0) - (last_col ? handle_size/2 : 0),
            tabs = container.element.children('.tabs').children('.tab'),
            lastTabOffset = tabs.last().offset(), // minor optimization
            targetOffset = this.target.offset(),
            tab_left = lastTabOffset.left - targetOffset.left + tabs.last().outerWidth(),
            tab_top = lastTabOffset.top - targetOffset.top,
            tab_width = handle_width - (tab_left - handle_left),
            tab_height = tabs.length ? tabs.first().outerHeight() : handle_size;

        this.handle(container, "handle_top", row === 0 ? handle_left : false, 0,
            handle_width, handle_size, false, 'pane', col, 0);
        this.handle(container, "handle_tab", handle_left, tab_top,
            r.width - handle_size, r.height - tab_height, false, 'tab', col, row);
        this.position_pane(container.element, col, row);
        if(row < column.rows.length - 1){
            this.handle(container, "handle_bottom", handle_left, r.top + r.height - handle_size/2,
                handle_width, handle_size, 'vsize', 'pane', col, row + 1);
        } else {
            this.handle(container, "handle_bottom", handle_left, r.top + r.height - handle_size,
                handle_width, handle_size, false, 'pane', col, row + 1);
        }
    };

    // positions a pane, resizes its contained view
    Flex.prototype.position_pane = function (pane, col, row) {
        var flex = this,
            r = flex.dimensions(col, row),
            margin = this.layout.handle_size;
        pane.css(flex.default_div_css()).css({
            left: r.left + (col === 0 ? margin : margin / 2),
            top: r.top + (row === 0 ? margin : margin / 2),
            width: r.width - margin * 1.5,
            height: r.height - (this.layout.columns[col].rows.length === 1
                ? margin * 2
                : margin * 1.5)
        });
        pane.children('.view').children('.body').each(function() {
            var body = $(this),
                view = body.closest('.view'),
                padding = body.outerHeight() - body.height(),
                height = pane.height() + pane.offset().top - body.offset().top,
                bottom = view.css('bottom') === 'auto'
                         ? 0
                         : parseInt(view.css('bottom'), 10);
            body.height(height - padding - bottom);
        });
    };

    Flex.prototype.default_div_css = function(){
        var css = {
            position: "absolute"
        };

        if(this.debug){
            css['background-color'] = randomColor();
            css.opacity = 0.75;
        }

        return css;
    };

    Flex.prototype.make_pane = function(content){
        var new_pane = {
            top: 0,
            bottom: 1
        };

        switch( typeof content ){
            case 'object':
                if (content.content || content.pane) {
                    $.extend(new_pane, content);
                } else {
                    // we have a bag of nodes
                    new_pane.content = content;
                }
                break;
            case 'function':
                new_pane.content = content();
                break;
            case 'string':
                new_pane.content = content;
                break;
            default:
                break;
        }

        return new_pane;
    };

    /**
     * insert_column( before_column, contentOrColumn ) creates a column of default width
     * in the layout, stealing width proportionately from existing columns.
     * returns the pane created.
     */
    Flex.prototype.insert_column = function(before_column, contentOrColumn){
        before_column = parseInt(before_column, 10);
        var layout = this.layout,
            column_width,
            column_rescale = this.layout.columns.length / (this.layout.columns.length + 1),
            col,
            new_column;

        // for -1 or undefined we put it on the end
        if( typeof before_column === 'undefined' || before_column === -1 ){
            before_column = layout.columns.length;
        }

        if (contentOrColumn.rows) {
            new_column = contentOrColumn;
        } else {
            new_column = {
                left: 0.0,
                right: 1.0,
                rows: [ this.make_pane(contentOrColumn) ]
            };
        }

        column_width = (new_column.right - new_column.left) / (this.layout.columns.length + 1);

        layout.columns.splice(before_column, 0, new_column);

        for(col = 0; col < layout.columns.length; col++){
            var column = layout.columns[col];
            column.left = col === 0 ? 0 : layout.columns[col - 1].right;
            if(col === layout.columns.length - 1){
                column.right = 1;
            } else {
                if(col < before_column){
                    column.right *= column_rescale;
                } else if(col === before_column){
                    column.right = column.left + column_width;
                } else {
                    column.right = 1 - (1 - column.right) * column_rescale;
                }
            }
        }

        this.update();

        return this.pane(before_column, 0);
    };


    Flex.prototype.pane = function(col, row){
        var column = this.layout.columns[col];
        row = column ? column.rows[row] : {};
        return row.element || false;
    };

    var remove_pane = function (flex, col, row, detach) {
        var layout = flex.layout,
            column = layout.columns[col],
            pane = column.rows[row],
            recovered,
            offset;

        if( pane.handle_top ) { 
            pane.handle_top.remove(); 
        }
        if( pane.handle_bottom ) { 
            pane.handle_bottom.remove(); 
        }
        if( pane.handle_tab ) { 
            pane.handle_tab.remove(); 
        }
        if( column.rows.length === 1 ){
            remove_column( flex, col , detach );
        } else {
            recovered = column.rows[row].bottom - column.rows[row].top;
            if (!detach) {
                pane.element.remove();
            } else {
                pane.element.detach();
            }
            column.rows.splice(row, 1);
            for(row = 0; row < column.rows.length; row++){
                column.rows[row].bottom += (column.rows[row].bottom - column.rows[row].top) / ( 1.0 - recovered ) * recovered;
                offset = row > 0 ? column.rows[row].top - column.rows[row-1].bottom : column.rows[row].top;
                column.rows[row].top -= offset;
                column.rows[row].bottom -= offset;
            }
            column.rows[column.rows.length-1].bottom = 1;
        }
    };

    Flex.prototype.remove_pane = function(col, row, detach){
        remove_pane(this, col, row, detach);
        this.update();
    };

    var remove_column = function (flex, col, detach) {
        var layout = flex.layout,
            column = layout.columns[col],
            i,
            width_to_redistribute = column.right - column.left;

        if ( column.handle_left ) { 
            column.handle_left.remove(); 
        }
        if ( column.handle_right ) { 
            column.handle_right.remove(); 
        }
        for ( i = 0; i < column.rows.length; i++ ){
            var pane = column.rows[i];
            if (!detach) {
                pane.element.remove();
            } else {
                pane.element.detach();
            }
        }
        
        if( layout.columns.length === 1  && col === 0 ){
            layout.columns = [];
        } else {
            layout.columns.splice( col, 1 );
            for( i = 0; i < layout.columns.length; i++ ){
                column = layout.columns[i];
                // adjust every column after the first to deal with its being resized
                if( i === 0 ){
                    if( column.left > 0 ){
                        column.right -= column.left;
                        column.left = 0;
                    }
                } else {
                    column.right += layout.columns[i-1].right - column.left;
                    column.left = layout.columns[i-1].right;
                }
                column.right += width_to_redistribute * (column.right - column.left)/(1 - width_to_redistribute);
            }
        }
    };

    /**
     * remove_column(col) removes the specified column from the layout
     * (scrupulously removing any panes inside it first)
     * It also redistributes the deleted column's width among the 
     * remaining columns proportionately, so it should be the exact
     * inverse of inserting a column in terms of its impact on metrics.
     * Note: it does not scrupulously remove all views inside the panes
     * so for now those events will not be fired.
     */
    Flex.prototype.remove_column = function(col, detach){
        remove_column(this, col, detach);
        this.update();
    };

    Flex.prototype.clear = function(){
        this.target.empty();
        this.setLayout({});
    };

    /**
    Load the snippet from the given URL or array of urls into default locations. Snippets load
    asynchronously, but this returns immediately, having put placeholders in the flex and showing
    the first one. To do something after all snippets have loaded, wrap the call in a
    `pn.snip.after` invocation.

    The default location will be:

    1. If a pinnable, unpinned snippet from the same location exists anywhere in the window, replace
       it
    2. Otherwise, find the biggest pane in the layout and add the snippet to it

    > TODO: multi-window support
    */
    Flex.prototype.load = function (urls) {
        var flex = this;
        var biggest = {size: 0, pane: false, col: 0, row: 0};
        $.each(flex.layout.columns, function (c, column) {
            $.each(column.rows, function (r, row) {
                var size = (column.right - column.left) * (row.bottom - row.top);
                if( size > biggest.size ) {
                    biggest = {
                        size: size,
                        pane: row.element,
                        col: c,
                        row: r
                    };
                }
            });
        });
        var first;
        var toBiggest = [];
        for (var i = urls.length - 1; i > -1; i--) {
            // Reverse order so the first ends up showing
            var unpinned = flex.target
                .children('.pane')
                .children('.pn-pinnable.' + pn.snip.urlToClass(urls[i])).not('.pn-pinnable-pinned');
            if (unpinned.length) {
                var placeholder = pn.pane.replace(pn.pane.load(urls[i], $('<div></div>')), unpinned.first());
                if (i === 0) {
                    first = placeholder;
                }
                pn.pane.show(placeholder);
            } else {
                toBiggest.unshift(urls[i]);
            }
        }
        if (toBiggest.length) {
            flex.add_tab(biggest.col, biggest.row, {pane: {snips: toBiggest}});
        }
        // In case the urls were a mix of pinnable and non-pinnable that end up in the same pane.
        // flex.add_tab will show the first of the unpinnables, which would be incorrect if a
        // pinnable preceeded them.
        pn.pane.show(first);
    };

    /**
     * Add a new pane with the specified content to the layout
     *
     * content: (string) then this is inserted into the new container (as its innerHTML)
     * content: (function) then the value returned by the function is inserted into the new container
     * content: (object) then content.url / content.content are added to the new pane spec
     */
    Flex.prototype.insert_pane = function(in_column, before_row, content){
        in_column = parseInt(in_column, 10);
        before_row = parseInt(before_row, 10);
        var layout = this.layout,
            column = layout.columns[in_column],
            pane_height = 1.0 / (column.rows.length + 1),
            pane_rescale = column.rows.length / (column.rows.length + 1),
            row;

        column.rows.splice(before_row, 0, this.make_pane(content));

        for(row = 0; row < column.rows.length; row++){
            var pane = column.rows[row];
            pane.top = row === 0 ? 0 : column.rows[row - 1].bottom;
            if(row === column.rows.length - 1){
                pane.bottom = 1;
            } else {
                if(row < before_row){
                    pane.bottom *= pane_rescale;
                } else if(row === before_row){
                    pane.bottom = pane.top + pane_height;
                } else {
                    pane.bottom = 1 - (1 - pane.bottom) * pane_rescale;
                }
            }
        }

        this.update();
    };

    /**
     * Add a view (tab) to an existing pane
     * col, row -- specify the pane to add the tab to
     * content -- typically either some html or { pane: [pane-spec] }
     */
    Flex.prototype.add_tab = function( col, row, content ){
        if (!this.layout.columns[col]) {
            return this.insert_column(col, content);
        }
        
        var result,
            pane = this.layout.columns[col].rows[row];
            
        if (content.pane) {
            result = pn.pane.restore(content.pane, pane.element);
        } else {
            result = pn.pane.move(content, pane.element);
        }
        this.update();
        return result;
    };

    return flexLayout;
});
/**
Panes and Tabs
==============

Panes contain tabbed content and provide functions for managing the tabs. The pane module renders a
simple source structure into a more complex HTML structure with tab like behavior.

From the source on the left, panes renders a structure like that on the right:

    .view title="tab title"         .pane
        .banner (optional)              .tabs
            "banner content"                h3.tab
        "body content"                          a "tab title"
                                                button.pn-close
                                            h3.tab.pn-inactive (hidden by css)
                                                a "tab title"
                                                button.pn-close
                                        .view
                                            .banner (optional)
                                                "banner content"
                                            .body
                                                "body content"
                                        .view.pn-inactive
                                            ... (hidden by css)

Panes functions generally accept any HTML element and find the tab associated with the element
to perform the requested operation. The element can be the view, the tab or any of their
children. To insert nodes into a pane, generally use `pn.pane.move` function.

Magic classes
-------------

Special HTML classes, which should be put on the `view` element, can give views extra behavior.

The `pn-pinnable` class adds a button to the view's tab that toggles a `pn-pinnable-pinned` class on
and off on both the tab and the view when clicked.

The `pn-noclose` class should prevent the tab from being closable.

The `pn-nodrag` class should prevent the tab from being dragged around (no implemented here -- see flexible-layout.js)
*/

/*global pn */

pn.module('pane', function (pane, $) {
    "use strict";

    var move = function (element, target, background, flush) {
        pn.assert(element && target, 'element and target required');
        target = $(target);
        var view = viewify(element);
        view.content.addClass('pn-inactive');
        if (!view.tab.length) {
            // Tab was not found in view, so assume it has not been set up and add its tab behavior.
            // The alternative would be that the pane is moving from another location, where its
            // behavior was already set up.
            view.content.each(function (i, content) {
                var title = content.title;
                content = $(content);
                // Mouseover pane should not show tooltip
                content.removeAttr('title');
                var tab = newtab(title, content);
                view.tab = view.tab.add(tab);
                if (!content.children('.body').length) {
                    $('<div class="body"></div>').appendTo(content);
                }
                content.children().not('.body').not('.banner')
                    .appendTo(content.children('.body'));
                if (content.hasClass('pn-pinnable')) {
                    tab.addClass('pn-pinnable');
                    if (!content.hasClass('pn-hide-pin')) {
                        $('<button class="pin"></button>')
                            .append($('<span></span>').text(pn.s.pin))
                            .on('click', function (e) {
                                e.preventDefault();
                                tab.toggleClass('pn-pinnable-pinned');
                                content.toggleClass('pn-pinnable-pinned');
                            }).insertBefore(tab.find('button'));
                    }
                }
                // copy classes from content to tab if necessary
                $.each(['pn-nodrag'], function(i,c){
                    if( content.hasClass(c) ){
                        tab.addClass(c);
                    }
                });
            });
        } else if (view.tab.parent().eq('.pane')) {
            showNext(view.tab);
        }
        if (target.closest('.tab').length) {
            var targetView = findView(target);
            targetView.tab.before(view.tab);
            targetView.content.before(view.content);
        } else {
            if (!target.hasClass('pane')) {
                // Assume target is not yet set up with pane behavior
                target.addClass('pane');
                target.prepend('<div class="tabs" role="tablist"></div>');
            }
            target.children('.tabs').append(view.tab);
            target.append(view.content);
        }
        if (!background) {
            show(view.tab.first());
        }
        if (flush) {
            pn.nav.flushLayout();
        }
        return view.content;
    };

    var nametab = function (tab, title) {
        title = title || pn.s.untitled;
        // TODO: localization
        tab.children('a').text(title);
        return tab;
    };

    var newtab = function (title, content) {
        var tab = $('<h3 class="tab pn-inactive" role="tab"><a href="#"></a></h3>')
            .on('click', function () {
                tab.find('a').trigger('click');
            })
            .on('keydown', pn.onkey(['escape'], function () {
                if( !tab.hasClass('pn-noclose') ){
                    pane.remove(this);
                }
            }))
            .on('keydown', pn.onkey(['left', 'up'], function () {
                showPrev($(this)).find('a').focus();
                pn.nav.flushLayout();
            }))
            .on('keydown', pn.onkey(['right', 'down'], function () {
                showNext($(this)).find('a').focus();
                pn.nav.flushLayout();
            }))
            .on('destroy', function () {
                if (!tab.hasClass('pn-inactive')) {
                    var next = tab.next().length ? tab.next() : tab.siblings().last();
                    var offset = next[0] === tab.next()[0] ? 1 : 0;
                    show(next, offset);
                }
                pn.nav.flushLayout();
            });
        tab.children('a')
            .on('mouseenter focusin focus', function () {
                // Prepare to be clicked. In IE, focusin works, but focus does not. Vice versa in
                // Chrome and FF. Rebuild so that the tab href picks up any snippet data changes the
                // snippet made.
                var href = pn.snip(content).urls()[0];
                if (href) {
                    $(this).attr('href', '#' + href);
                }
            })
            .on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                show(tab);
                this.focus();
                pn.nav.flushLayout();
            })
            .on('dragstart', function () {
                // TODO: This is a hackish way of highlighting drop targets when this is a tab in
                // the top-level flex. I don't like that this knows so much about page structure,
                // also, that the symmetrical operation at drag end lives in drag5.js, but until we
                // have a nice way to generalize the target highlighting approach, just go with it.
                var topFlex = $('.flex').first();
                if (topFlex.length && topFlex[0] === $(this).parent().parent().parent().parent()[0]) {
                    setTimeout(function () {
                        // Without setTimeout, the drop target that covers this tab becomes visible
                        // before the drag start is complete, thus immediately ending the drag.
                        pn.wins.anywhere('body').addClass('pn-dragging-tab');
                    }, 0);
                }
            })
            // TODO: aria-flowto may be a more appropriate attribute than labelling
            .aria().labelFor(content);
        if (!content.hasClass('pn-noclose')) {
            tab.append($('<button class="pn-close"></button>')
                .append($('<span></span>').text(pn.s.close))
                .on('click', function (event) {
                    event.stopPropagation();
                    pane.remove(this);
                })
            );
        }
        return nametab(tab, title);
    };

    var show = function (tab, offset) {
        tab = $(tab);
        var view = findView(tab, offset);
        // TODO: newly opened tabs should often, but not always receive keyboard focus. Sort this.
        var focus = tab.siblings().not('.pn-inactive')[0] === $(document.activeElement).closest('.tab')[0];
        tab.removeClass('pn-inactive');
        tab.siblings().addClass('pn-inactive')
            // take focusable children out of tab order so tab focuses view content next
            .children().attr('tabindex', '-1');
        tab.parent().siblings().addClass('pn-inactive');
        view.content.removeClass('pn-inactive');
        // put focusable children in regular tab order
        tab.children().removeAttr('tabindex');
        if (focus) {
            tab.focus();
        }
        $(window).trigger('resize');
        
        // call show method of snippet
        // TODO: utilize snip.provides when it's available
        try {
            pn.snip(view.content).fn('show')();
        } catch(e){
            // don't really care!
        }
        
        return tab;
    };

    var showNext = function (tab) {
        return show(tab.next().length ? tab.next() : tab.siblings().first());
    };

    var showPrev = function (tab) {
        return show(tab.prev().length ? tab.prev() : tab.siblings().last());
    };

    var findView = function (element, offset) {
        // TODO: climb out of iframes?
        element = $(element);
        var content = element.closest('.view'),
            tab = element.closest('.tab');
        if (tab.length) {
            // During tab removal cleanup, that is, when the tab's destroy event fires, its content
            // has already been removed, so indexes do not quite match up, hence the offset, which
            // should always be either 1 or 0
            content = $(tab.parent().siblings('.view')[tab.index() - (offset || 0)]);
        } else if (content.length) {
            tab = $(content.siblings('.tabs').children()[content.index() - 1]);
        }
        return {
            content: content,
            tab: tab
        };
    };

    var findViews = function (elements) {
        return $.map($(elements), function (element) {
            return findView(element);
        });
    };

    var viewify = function (element) {
        element = $(element);
        var result = findView(element);
        if (result.tab.length || result.content.length) {
            return result;
        }
        result.content = $('<div class="view"></div>').append(element);
        return result;
    };

    /**
    Move the tab and view associated with the given element to the target pane, returning a jQuery
    object containing the view element, that is, the wrapper that holds pane body and banner. This
    modifies the target with additional pane-related elements and classes, if necessary.

    The target can either be an existing tabbed pane or a tab in an existing pane. If it is a pane,
    the new view gets appended to the existing views by default.

    The target can also be an existing tab. If so, this inserts the new view before that tab.

    The element can be an almost arbitrary collection of HTML. If not in the normal tab structure,
    this attempts to create the structure. In typical use, the source can be a minimal structure:

        !!!
        <div class="view" title="Example">
            <button>Remove tab</button>
            <p>Lorem ipsum...</p>
        </div>
        <script>
            pn.pane.move(this, example);
            this.find('button').on('click', function () {
                pn.pane.remove(this);
            });
        </script>

    If the source content is already in a fully constructed view structure, that is, it includes the
    tabs, view, and body elements, this will assume it already has desired behavior and not add tab
    behavior.
     */
    pane.move = function (element, target) {
        return move(element, target, false, true);
    };

    /**
    Just like `pn.pane.move` except that it does not show the newly inserted tab immediately after
    insertion.
    */
    pane.moveBehind = function (element, target) {
        return move(element, target, true, true);
    };

    /**
    Remove the tab associated with the given element from its pane.
     */
    pane.remove = function (element) {
        if ($(element).closest('.pn-flex-col').length === 1) {
            $.each(element, function (i, component) {
                pn.reflex.tab(element).close();
            });
        } else {
            $.each(findViews(element), function (i, view) {
                // Since tab cleans up on its destroy event and flushes the layout, important to remove
                // the content first, otherwise the layout flush includes removed content.
                if( pn.flexLayout ){
                    pn.flexLayout.ignoreResizeEvents();
                }
                view.content.remove();
                view.tab.remove();
                if( pn.flexLayout ){
                    pn.flexLayout.attendResizeEvents();
                }
            });
        }
    };

    (function () {
        var mapElements = function (selector, key) {
            var result = $();
            $.each(findViews(selector), function (i, v) {
                result = result.add(v[key]);
            });
            return result;
        };
        /**
        Return the tab corresponding to the given element, where the element can either be a child of
        the view or of its tab as a jQuery object. The returned object may be empty if this finds no
        tab for the element.
         */
        pane.tab = function (element) {
            return mapElements(element, 'tab');
        };

        /**
        Finds a view by an element in either its tab or itself, returning an empty jQuery object if no
        view found.
         */
        pane.view = function (element) {
            return mapElements(element, 'content');
        };
    })();

    /**
    Replace the one view with another. The target element can be the child of a view body or tab.
    This morphs the new element into a pane structure, the same way as `pn.pane.move`, if necessary.
    If the target is not an element in an existing view, becomes equivalent to `pn.pane.move`.
     */
    pane.replace = function(element, target){
        var view = findView(target);
        var result = move(element, view.tab, true);
        if (!view.tab.hasClass('pn-inactive')) {
            show(findView(result).tab);
        }
        pane.remove(view.tab);
        return result;
    };

    /**
    Change the title of the tab associated with the given element.

        pn.pane.tab(element).find('a').text('New tab text');

     */
    pane.rename = function (element, title) {
        var tab = viewify(element).tab;
        if (!tab.length) {
            pn.reflex.tab(element).name(title);
            // TODO: put back deprecation warning when reflex is ready
            //console.warn('Deprecated: pn.pane.rename, use pn.reflex.tab().name');
        } else {
            nametab(tab, title);
            $('body').trigger('resize'); // the name changes the tab metrics
        }
    };

    /**
    Activate any containing panes for the given element. Use `pn.pane.show` to activate only the
    view immediately containing an element.
    */
    pane.raise = function (element) {
        // TODO: suggest that raise ought to be the default behavior of show, and passing an additional
        // parameter (e.g. pane.show(foo, false)) produces the show behavior.
        var tab = findView(element).tab;
        show(tab);
        var container = findView(tab.closest('.view'));
        if (container.tab.length) {
            pn.pane.raise(container.tab);
        }
        pn.nav.flushLayout();
    };

    /**
    Activate the tab associated with the given element.

    When a snippet is about to be shown (i.e. its corresponding pane is brought to the
    front) its show method (i.e. snip.fn.show) will be called if it exists.
    */
    pane.show = function (element) {
        show(findView(element).tab);
        pn.nav.flushLayout();
    };

    /**
    Return a representation of the pane that surrounds the given element suitable for JSON
    serialization. This currently only allows serialization of views loaded via the
    [snippet loader](#api/snip).

        !!!
        <div></div>
        ---
        <script>
        pn.snip.after(function () {
            pn.snip.load('api/test-snips/simple.html', function (snip) {
                return pn.pane.move(snip, example.children())
            })
            pn.snip.load('api/test-snips/parent.html', function (snip) {
                return pn.pane.moveBehind(snip, example.children())
            })
        }, function () {
            $('<pre></pre>').text(jsyaml.dump(pn.pane.serialize(example.find('.pane'))))
                .appendTo(example.children())
        })
        </script>
    */
    pane.serialize = function (element) {
        // TODO: persist pinned state
        var views = pn.snip($(element).closest('.pane').children('.view'));
        return {
            active: views.index(views.not('.pn-inactive')),
            snips: views.urls()
        };
    };

    /**
    Hook up a resize handler to allow for scroll bars on inner panes nested within outer panes in
    a flex. The container given should have exactly one level of nested tabs, and its styling will
    also need to set overflow hidden on outer elements that would ordinarily scroll.
    */
    pane.sizeNestedBodies = function (container) {
        var namespace = pn.uuid();
        var sizeBodies = function () {
            var tabs = container.find('.body .tabs:visible');
            var outer;
            if (tabs.length) {
                // Walk up the dom for when this is nested in supervisor view
                outer = tabs.parents('.body').last();
            }
            var nested = container.find('.body .body');
            outer = container.find('.body').first();
            nested.each(function () {
                var inner = $(this);
                if (inner.offset()) {
                    inner.css({
                        height: outer.innerHeight() - (inner.offset().top - outer.offset().top)
                    });
                }
            });
        };
        $(window).on('resize.' + namespace, sizeBodies);
        container.on('destroy', function () {
            $(window).off('resize.' + namespace);
        });
        setTimeout(sizeBodies, 0); // Ugh. Don't know why setTimeout seems necessary, but it does
    };

    (function () {
        var load = function (url, target, done, data) {
            var placeholder = pn.pane.move(
                    $('<div class="view"></div>')
                        .attr('title', pn.s.loading)
                        .attr('data-pn-loading', url),
                    target);
            pn.snip.load(url, function (snip) {
                return (done || $.noop)(pn.pane.replace(snip, placeholder));
            }, data);
            return placeholder;
        };
        /**
        Load a snippet from the given URL into the target pane, optionally passing a data object. This
        inserts a default "loading" pane until the snippet loads and returns that to the caller. Once
        the snippet loads, this calls the `done` callback, passing the snippet body after insertion into
        the pane.
        */
        pane.load = function (url, target, done, data) {
            // TODO: don't think we need the "done" or "data" arguments
            var result;
            pn.snip.after(function () {
                result = load(url, target, done, data);
            }, function () {
                pn.nav.flushLayout();
            });
            return result;
        };

        /**
        Load snippets into the target element, building a pane from the serialized representation, as
        created by `pn.pane.serialize`.

        Calls the optional done callback when complete with no arguments.
        */
        pane.restore = function (serialized, target, done) {
            // TODO: don't think we need the "done" callback
            pn.snip.after(function () {
                var placeholder;
                $.each(serialized.snips, function (i, url) {
                    var p = load(url, target);
                    placeholder = (i === serialized.active && p) || placeholder || p;
                });
                show(findView(placeholder).tab);
            }, function () {
                pn.nav.flushLayout();
                setTimeout(function () {
                    $(window).trigger('resize'); // Make flex resize stuff
                }, 0);
                // TODO: when one snippet contains more than one view, this activates the wrong tab
                //      (see navigation.html in the test project)
                (done || $.noop)();
            });
        };
        
    })();

});
/**
Reflex
======

Proof of concept layout using flexbox instead of JavaScript to calculate pane sizes.

Reflex provides a mechanism for wrapping content in containers that are optionally resizable by the
user with drag operations and optionally contain tabs. The structure is an arbitrarily nested set of
nodes making a row-major grid like so:

    .pn-flex-row (has pn-flex-grid class if it is the root row in a grid)
        .pn-flex-gutter (drop target, spacer, resize handle)
        .pn-flex-col
            .pn-flex-gutter (drop target, spacer, resize handle)
            [role=tablist] (tabs container - optional)
                [role=tab] (one or more tabs)
            .pn-flex-view (content container - shown or hidden by tabs, if tabs are present)
                .pn-flex-banner (non-scroll content - optional)
                .pn-flex-body (scrolling content)
            .pn-flex-gutter
        .pn-flex-gutter

Use the [Reflex editor](#reflex-editor.html) to create layouts.

Essential todo list:
--------------------
- Implement pn-noclose
- Implement pn-nodrag
- IE <= 9 resize on window, fit-content, banner and gutter resize
- Layout should not reload snippets unless necessary
- Tab navigation keyboard behavior
- Resize keyboard behavior
- Tab drag & drop keyboard behavior
- Drag in IE <= 9
- Dropping content from arbitrary url
- Dropping an active tab in the same pane deactivates it
- Dropping the last tab from a pane into an adjacent gutter destroys it
- Tab link rewriting on focus and hover
- Horizontal overflow does not scroll in Firefox 19 (e.g. nav panel in test project, when zoomed)

*/

/*global pn*/
pn.module('reflex', function (reflex, $) {
    'use strict';

    var flexResize = function (grow, shrink) {
        return [
            // 2009 spec
            ['-webkit-box-flex', grow],
            // No 2009 equivalent
            // 2013 spec and tweener -ms- spec
            ['-webkit-flex-grow', grow],
            ['-moz-box-flex', grow * 1000], // Old Firefox, e.g. 19, does not like decimal values
            ['-ms-flex-positive', grow],
            ['-ms-flex-negative', shrink],
            ['flex-grow', grow],
            ['flex-shrink', shrink]
        ];
    };

    var features = { // Feature detection
        // Internet Explorer 10 flexbox computes the size of boxes proportional to -ms-flex-positive
        // after subtracting min-width. That is, if a box has styles:
        //
        //   min-width: 10px
        //   -ms-flex-positive: 1
        //
        // With a neighbor of the same -ms-flex-positive, but no min-width, the first box will be
        // larger, that is, in available space 20px, the first box takes 15px, that is, consumes
        // half the leftover space after deducting min-widths.
        subtractMinSize: 'msFlexPositive' in document.createElement('div').style,

        // Mostly, "noFlexbox" is for IE < 10 support
        noFlexbox: (function () {
            var jsKeys = {};
            $.each(flexResize(), function (i, css) {
                jsKeys[css[0].replace(/-/g, '')] = true;
            });
            var div = document.createElement('div');
            var detected = false;
            for (var k in div.style) {
                detected = detected || (k.toLowerCase() in jsKeys);
            }
            return !detected;
        })()
    };

    var sizeFn = function (panel) {
        var direction = panel.is('.pn-flex-col') ? 'Width': 'Height';
        var jqOuterSize = $.fn['outer' + direction];
        var jqInnerSize = $.fn[direction.toLowerCase()];
        return {
            minSize: function (resizable) {
                var cssMin = resizable.css('min-' + direction);
                if (/\dpx$/.test(cssMin)) {
                    return parseFloat(cssMin);
                } else {
                    // Only using this for IE 10, for now, which reports min-width in pixels
                    // regardless of the units used to set it, so do not handle non-px units
                    console.warn('Min size reported in non-pixel units');
                    return 0;
                }
            },
            outerSize: function (resizable) {
                return jqOuterSize.call(resizable);
            },
            innerSize: function (resizable) {
                return jqInnerSize.call(resizable);
            },
            direction: direction.toLowerCase(), // Lowercase matters for IE 9
            selector: panel.is('.pn-flex-col') ? '.pn-flex-col' : '.pn-flex-row'
        };
    };

    var flexibles = function (panel) {
        return panel.parent().children('.pn-flex-col, .pn-flex-row')
            .not('.pn-flex-fit-content');
    };

    var fitViewToPane = function (view) {
        if (!features.noFlexbox) {
            return;
        }
        if (view.closest('.pn-flex-row').is('.pn-flex-fit-content')) {
            return;
        }
        var gutterSpace = 0;
        view.siblings('.pn-flex-gutter').each(function () {
            gutterSpace += $(this).outerHeight();
        });
        var tabSpace = view.siblings('[role=tablist]').outerHeight() || 0;
        var padSpace = view.outerHeight() - view.height();
        var bannerSpace = view.children('.pn-flex-banner').outerHeight() || 0;
        // TODO: what about view margins and padding?
        view.children('.pn-flex-body')
            .css('height', view.parent().height()
                - gutterSpace - tabSpace - padSpace - bannerSpace
                + 'px');
    };
    var fitPanesToGrid = function (panel) {
        if (!features.noFlexbox) {
            return;
        }
        var calc = sizeFn(panel);
        var oldFlexSpace = 0;
        var cssSize = function (flexible) {
            return parseFloat(flexible.style[calc.direction]);
        };
        var resizables = flexibles(panel);
        resizables
            .each(function () {
                oldFlexSpace += cssSize(this);
            })
            .each(function () {
                var flexible = $(this);
                flexGrow(flexible, cssSize(this) / (oldFlexSpace / resizables.length));
                var nested = flexible.is('.pn-flex-row')
                    ? '> .pn-flex-col > .pn-flex-row'
                    : '> .pn-flex-row > .pn-flex-col';
                flexible.find(nested).each(function () {
                    fitPanesToGrid($(this));
                });
                flexible.find('> .pn-flex-col > .pn-flex-view').each(function () {
                    fitViewToPane($(this));
                });
            });
    };
    var fitOnResize = function (element) {
        // TODO: put back
        return;
        // TODO: call this when banners or the entire grid resize
        if (!features.noFlexbox) {
            return;
        }
        // IE <= 9 does not implement flexbox, but happily fires a resize on Elements, not just the
        // window, so it's possible to know when to recalculate pane sizes
        pn.assert(element.length === 1, 'Attach to element resize one at a time');
        pn.assert('onresize' in element[0], 'TODO: Fallback for non-IE browsers that do not implement flexbox');
        var onresize = element[0].onresize || $.noop;
        element[0].onresize = function () {
            // Need to attach it this way, rather than $.fn.on('resize') because when IE 9 renders
            // a document in "standards" mode, the resize event follows w3c standards, that is,
            // mostly useless because it fires only on window, unless attached by setting the
            // element attribute
            var prev = onresize.apply(this, arguments);
            fitPanesToGrid(element.closest('.pn-flex-row, .pn-flex-col'));
            return prev;
        };
    };
    
    var flexSpace = function (panel) {
        var calc = sizeFn(panel);
        // TODO: documentation that styling should not pad rows and columns, lest it throw this off,
        //      or deal with that problem
        var space = calc.innerSize(panel.parent());
        panel.parent().children('.pn-flex-fit-content, .pn-flex-gutter').each(function () {
            space -= calc.outerSize($(this));
        });
        return space;
    };
    var unitSpace = function (panel) {
        return flexSpace(panel) / flexibles(panel).length;
    };
    var flexGrow = function (panel, factor) {
        pn.assert(!panel.is('.pn-flex-fit-content'), 'Cannot grow a content-fitting pane');
        var calc = sizeFn(panel);
        if (features.noFlexbox) {
            panel.css(calc.direction, unitSpace(panel) * factor + 'px');
            panel.children('.pn-flex-view')
                .each(function () {
                    fitViewToPane($(this));
                });
            return;
        }
        var browserFactor = factor;
        if (features.subtractMinSize && flexibles(panel).length > 1) {
            var mins = 0;
            flexibles(panel).each(function () {
                mins += calc.minSize($(this));
            });
            var space = flexSpace(panel);
            browserFactor = (space * factor - calc.minSize(panel) * flexibles(panel).length) / (space - mins);
            if (browserFactor !== browserFactor) {
                // NaN when the grid isn't positioned, can't determine correct IE adjustment
                browserFactor = factor;
                console.warn('Cannot determine IE pane size adjustment for non-positioned grid');
            }
        }
        $.each(flexResize(browserFactor, null), function (i, declaration) {
            // Internet explorer (10) ignores the style value unless converted to string
            if (declaration[1] != null) {
                panel.css(declaration[0], '' + declaration[1]);
            }
        });
    };

    (function () { // Inject the stylesheet that gives essential positioning
        var displayFlex = $.map([
            '-webkit-box',
            '-moz-box',
            '-ms-box',
            '-o-box',
            'box',
            // tweener -ms- spec
            '-ms-flexbox',
            // 2013 spec
            '-webkit-flex',
            '-moz-flex',
            '-ms-flex',
            '-o-flex',
            'flex'
        ], function (v) {
            return [['display', v]];
        });
        var flexDirection = function (direction) {
            var vh = /column/i.test(direction) ? 'vertical' : 'horizontal';
            return [
                ['-moz-box-orient', vh],
                ['-webkit-box-orient', vh],
                ['-webkit-flex-flow', direction],
                ['-ms-flex-flow', direction],
                ['flex-flow', direction]
            ];
        };
        // TODO: use flex-basis for height and width?
        var flexHeight = function (height) {
            return [
                ['height', height],
                ['-ms-flex-preferred-size', height]
            ];
        };
        var flexWidth = function (width) {
            return [
                ['width', width],
                ['-ms-flex-preferred-size', width]
            ];
        };
        var zeroBorder = [
            ['margin', 0],
            ['padding', 0],
            ['border', 'none']
        ];
        var gutterSize = function (direction, size) {
            return [
                [direction, size],
                ['min-' + direction, size],
                ['margin', 0]
            ];
        };

        var style = [
            [['.pn-flex-row', '.pn-flex-col',
              '.pn-flex-gutter', '.pn-flex-view',
              '.pn-flex-banner', '.pn-flex-body'],
                  ['-moz-box-sizing', 'border-box'],
                  ['-webkit-box-sizing', 'border-box'],
                  ['box-sizing', 'border-box']
            ],
            ['.pn-flex-dragging-gutter iframe',
                ['visibility', 'hidden !important'] // Because iframes eat mouse events
            ],
            ['.pn-flex-row',
                flexHeight(0),
                ['min-height', '20px'],
                // TODO: overflow: auto would be sometimes useful, but makes spurious scroll bars in IE 10
                zeroBorder,
                displayFlex,
                flexResize(1, 1)
            ],
            ['.pn-flex-col',
                flexWidth(0),
                ['min-width', '20px'],
                // TODO: overflow: auto would be sometimes useful, but makes spurious scroll bars in IE 10
                zeroBorder,
                displayFlex,
                flexDirection('column'),
                flexResize(1, 1)
            ],
            ['.pn-flex-grid',
                ['height', '100%'], // Grid is also a row, so this style must come after row height
                ['width', '100%']
            ],
            ['.pn-flex-row.pn-flex-fit-content',
                flexHeight('auto'),
                flexResize(0, 0)
            ],
            ['.pn-flex-col.pn-flex-fit-content',
                flexWidth('auto'),
                flexResize(0, 0)
            ],
            [['.pn-flex-fit-content > .pn-flex-view',
              '.pn-flex-fit-content > .pn-flex-col > .pn-flex-view',
              '.pn-flex-fit-content > .pn-flex-view > .pn-flex-body',
              '.pn-flex-fit-content > .pn-flex-col > .pn-flex-view > .pn-flex-body'],
                flexHeight('auto')
            ],
            ['.pn-flex-view',
                flexHeight(0),
                displayFlex,
                flexDirection('column'),
                flexResize(1, 1)
            ],
            ['.pn-flex-body',
                ['overflow', 'auto'],
                ['position', 'relative'],
                flexHeight(0), // Required in old Chrome, e.g. v22, and FF, e.g. 19
                flexResize(1, 1)
            ],
            [['.pn-flex-banner'],
                ['overflow', 'auto'],
                flexResize(0, 0)
            ],

            ['.pn-flex-col > [role=tablist]',
                // Transform fixes a glitch in IE 10 where the first tab in the test project gets
                // partially covered by a rendering artifact
                ['-ms-transform', 'translateY(0px)'],
                ['white-space', 'nowrap'],
                ['overflow', 'auto'],
                flexResize(0, 0)
            ],

            ['.pn-flex-col > [role=tablist] [role=tab]',
                // These styles are not strictly necessary, but nearly every look would want them
                ['display', 'inline-block'],
                ['margin', 0]
            ],

            ['.pn-flex-row > .pn-flex-gutter',
                gutterSize('width', '0')
            ],
            ['.pn-flex-col > .pn-flex-gutter',
                gutterSize('height', '0')
            ],
            ['.pn-flex-row > .pn-flex-gutter[aria-dropeffect]',
                gutterSize('width', '10px')
            ],
            ['.pn-flex-col > .pn-flex-gutter[aria-dropeffect]',
                gutterSize('height', '10px')
            ],
            ['.pn-flex-row > .pn-flex-gutter[draggable=true]',
                ['cursor', 'ew-resize'],
                ['margin', 0]
            ],
            ['.pn-flex-col > .pn-flex-gutter[draggable=true]',
                ['cursor', 'ns-resize'],
                ['margin', 0]
            ]
        ];
        if (features.noFlexbox) {
            style.push(
                ['.pn-flex-row, .pn-flex-col',
                    ['position', 'relative'],
                    ['vertical-align', 'top'] // For IE 9
                ],

                [['.pn-flex-col', '.pn-flex-row > .pn-flex-gutter'],
                    ['display', 'inline-block'],
                    ['height', '100%']
                ],
                [['.pn-flex-row', '.pn-flex-col > .pn-flex-gutter'],
                    ['display', 'block'], // Redundant, but allows debuggging in a newer browser
                    ['width', 'auto']
                ],
                [['.pn-flex-view', '.pn-flex-body'],
                    ['display', 'block'], // Redundant, but allows debugging in a newer browser
                    ['height', 'auto']
                ],
                ['.pn-flex-grid',
                    ['width', '100%'] // And this again because styling above overwrote row width
                ]
            );
        }

        var ruleCat = function (rule) {
            return '  ' + rule[0] + ': ' + rule[1] + ';';
        };
        var cssLines = $.map(style, function (block) {
            var selector = block[0] instanceof Array ? block[0].join(', ') : block[0];
            var rules = $.map(block.slice(1), function (rule) {
                return typeof rule[0] === 'string'
                    ? ruleCat(rule)
                    : $.map(rule, function (r) {
                        return ruleCat(r);
                    });
            });
            return selector + ' {\n' + rules.join('\n') + '\n}';
        });
        $('<style>/* Injected by pn.reflex */\n' + cssLines.join('\n') + '\n</style>')
            .insertAfter('head title');
    })();

    $(document).on('dragstart', function (drag) {
        // TODO: drag resize unit tests
        var dragged = $(drag.target);
        if (dragged.is('.pn-flex-gutter')) {
            var transfer = drag.originalEvent.dataTransfer;
            transfer.effectAllowed = 'move';
            transfer.setData('text/plain', ''); // Required for Firefox to fire dragover and end
            // Practically invisible drag image node simulates no drag image at all
            var ghost = $('<div style="position: fixed; left: -999px"></div>').appendTo(dragged);
            if (transfer.setDragImage) {
                // IE (<= 11?) does not support setDragImage
                transfer.setDragImage(ghost[0], 0, 0);
            }

            var axis = dragged.parent().is('.pn-flex-row') ? 'X' : 'Y';
            var panel = axis === 'X'
                ? dragged.prev('.pn-flex-col')
                : dragged.prev('.pn-flex-row').children('.pn-flex-col').first();
            var grow = axis === 'X' ? paneMethods.widenTo : paneMethods.heightenTo;
            pn.assert(panel.length, 'Drag handle with no adjacent pane');

            var container = dragged.parents().not('html').last() // Usually <body>
                .addClass('pn-flex-dragging-gutter');
            
            var initPos = drag.originalEvent['client' + axis];
            var initSize = axis === 'X' ? panel.outerWidth() : panel.outerHeight();
            var ns = '.' + pn.uuid();
            $(window).on('dragover' + ns, function (dragover) {
                dragover.preventDefault();
                var distance = dragover.originalEvent['client' + axis] - initPos;
                grow.call(panel, initSize + distance);
            });
            // TODO: this selectstart necessary? test in IE
            //.on('selectstart' + ns, false) // Block selection in IE < 10
            dragged.one('dragend', function () {
                $(window).off(ns);
                container.removeClass('pn-flex-dragging-gutter');
                ghost.remove();
                pn.nav.flushLayout();
            });
        }
    });

    var bodify = function (content) {
        content = _tab(content).length ? _tab(content).detachView() : $(content);
        // TODO: should allow collections of nodes, but the combinations require consideration
        pn.assert(content.length === 1,
            'Content wrapped in a reflex pane must contain exactly one root element');
        pn.assert(content.children('.pn-flex-banner').length <= 1,
            'At most one banner allowed in pane content');
        pn.assert(content.children('.pn-flex-banner').length <= 1,
            'At most one explicit pane body allowed');

        // TODO: deprecate old plain "banner" and "body"
        content.children('.banner').addClass('pn-flex-banner');
        content.children('.body').addClass('pn-flex-body');

        if (content.children('.pn-flex-body').length) {
            var unwrapped = content.contents()
                .not('.pn-flex-body')
                .not('.pn-flex-banner')
                .filter(function () {
                    return !!$(this).text().replace(/\s/g, '');
                });
            pn.assert(!unwrapped.length,
                'No content allowed outside an explicit pane body and banner structure');
        }
        content.addClass('pn-flex-view');
        if (!content.children('.pn-flex-body').length) {
            $('<div class="pn-flex-body"></div>')
                .append(content.contents().filter(function () {
                        return !$(this).is('.pn-flex-banner');
                    }))
                .appendTo(content);
        }
        return content;
    };

    var anyInGrid = function (element, selector) {
        var grid = reflex.grid(element);
        var collect = function (subGrid) {
            var children = subGrid
                .children('.pn-flex-row, .pn-flex-col, .pn-flex-gutter, .pn-flex-view, '
                    + '[role=tablist], [role=tab]');
            return subGrid.length
                ? subGrid.filter(selector).add(collect(children))
                : $();
        };
        return collect(grid);
    };

    var tabify = function (content) {
        var title = content.attr('title') || pn.s.untitled;
        if (content.is('.pn-noclose')) {
            console.warn('TODO: No close not yet implemented in reflex');
        }
        if (content.is('.pn-nodrag')) {
            console.warn('TODO: No drag not yet implemented in reflex');
        }
        // TODO: use existing ID if present
        content.attr({
                id: pn.uuid(),
                role: 'tabpanel'
            })
            .removeAttr('title');
        // Tabs are headings because this helps a screen reader user to scan the page. Even if you
        // wanted the controls to visually come before the tab, that would be unwise since it buries
        // the lead for screen reader users.
        // TODO: figure out how to nest headings sensibly, that is, don't always be <h3>
        var tabs = $('<div role="tablist" aria-dropeffect="none">'
                    + '<h3 role="tab" aria-selected="true" aria-dropeffect="none">'
                      + '<a href="#"><span></span></a>'
                      + '<button class="pn-close"><span></span></button>'
                    + '</h3></div>');
        var tab = tabs.find('[role=tab]')
            .attr('aria-controls', content.attr('id'))
            // TODO: keyboard behaviors
            .on('click', function (click) {
                click.preventDefault();
                reflex.tab(this).activate();
                if ($(click.target).is(':focusable')) {
                    click.target.focus();
                }
            })
            .on('dragstart', function (drag) {
                var transfer = drag.originalEvent.dataTransfer;
                transfer.effectAllowed = 'move';
                // TODO: dragging from an arbitrary url
                // TODO: setting drag image like so might be a nice thing to do, but shows nothing
                //      when tab is inactive
                // transfer.setDragImage(content[0], 50, 50);
                var dragged = $(drag.target).closest('[role=tab]');
                if (dragged.length
                    && dragged.closest('[role=tablist]').parent().is('.pn-flex-col')) {
                    var container = dragged.parents().not('html').last() // usually <body>
                        .addClass('pn-flex-dragging-tab');
                    var ns = '.' + pn.uuid();
                    // TODO: allow dragging between different grids? under what conditions?
                    // TODO: drop on view
                    var targets = anyInGrid(dragged, '.pn-flex-gutter, [role=tablist], [role=tab]')
                        .not(dragged)
                        .filter('[aria-dropeffect]');
                    if (!dragged.nextAll('[role=tab]').length) {
                        targets = targets.not(dragged.closest('[role=tablist]'));
                    }
                    var endDrag = function () {
                        targets.attr('aria-dropeffect', 'none');
                        container.removeClass('pn-flex-dragging-tab');
                        targets.off(ns);
                        dragged.off(ns);
                    };
                    dragged.on('dragend' + ns, endDrag);
                    dragged.on('dragover', function (dragover) {
                        dragover.stopPropagation();
                    });
                    targets.attr('aria-dropeffect', 'move')
                        .on('dragover' + ns, function (dragover) {
                            dragover.preventDefault();
                        })
                        .on('drop' + ns, function (drop) {
                            if (drop.isDefaultPrevented()) {
                                return;
                            }
                            drop.preventDefault();
                            var target = $(this);
                            if (target.is('.pn-flex-gutter')) {
                                insertInGutter(content, target);
                            } else if (target.is('[role=tab]')) {
                                _pane(target).insert(content, target);
                            } else if (target.is('[role=tablist]')) {
                                _pane(target).insert(content);
                            }
                            endDrag();
                            pn.nav.flushLayout();
                        });
                }
            });
        tab.find('button.pn-close')
            .on('click', function () {
                reflex.tab(this).close();
            });
        if (content.is('.pn-pinnable')) {
            tab.addClass('pn-pinnable');
            if (content.is('.pn-hide-pin')) {
                tab.addClass('pn-pinnable-pinned');
            } else {
                $('<label class="pn-pin"><span></span><input type="checkbox"></label>')
                    .on('click', function (click) {
                        click.stopPropagation();
                    })
                    .insertBefore(tab.find('button.pn-close'))
                    .find('input[type=checkbox]').on('change', function () {
                        tab.toggleClass('pn-pinnable-pinned');
                        pn.nav.flushLayout();
                    })
                    .end()
                    .find('span').text(pn.s.pin);
            }
        }
        tab.find('button.pn-close span').text(pn.s.close);
        tab.find('a span').text(title);
        return {
            tab: tab,
            content: content
        };
    };

    var initTabs = function (pane, content) {
        var tabified = tabify(content);
        var tabs = tabified.tab.closest('[role=tablist]');
        if (pane.children('.pn-flex-gutter').length) {
            tabs.insertAfter(pane.children('.pn-flex-gutter').first());
        } else {
            tabs.prependTo(pane);
        }
        tabified.content.insertAfter(tabs);
        fitOnResize(tabs);
        return tabified;
    };

    var rowMarkup = function () {
        return $('<div class="pn-flex-row"><div class="pn-flex-col"></div></div>');
    };
    var colMarkup = function () {
        return $('<div class="pn-flex-col"><div class="pn-flex-row"></div></div>');
    };

    var wrapNoGutter = function (content) {
        content = bodify(content || '<div class="pn-flex-placeholder"></div>');
        var row = rowMarkup().insertAfter(content);
        if (content.attr('title')) {
            initTabs(row.find('.pn-flex-col'), content);
        } else {
            row.find('.pn-flex-col').append(content);
        }
        return reflex.pane(content);
    };

    var insertInGutter = function (content, target) {
        var newPane = wrapNoGutter(content);
        if (newPane.children('[role=tablist]').length) {
            _tab(newPane.children('.pn-flex-view')).activate();
        }
        var newRow = newPane.closest('.pn-flex-row');
        var creatingColumn = target.parent().is('.pn-flex-row');
        var insertable = creatingColumn ? newPane : newRow;

        // TODO: handling other combinations of non-draggable gutters. This works only for the
        //      limited case we need right now
        var insert = (target[0] === target.parent().children('.pn-flex-gutter')[0])
                  || (target.next().length && !/^true$/i.test(target.attr('draggable')))
            ? $.fn.insertAfter
            : $.fn.insertBefore;

        if (!creatingColumn) {
            target.siblings().not('.pn-flex-gutter').not('.pn-flex-row')
                .wrapAll(rowMarkup());
        }

        insert.call(insertable, target);
        insert.call(sizer(), insertable);

        if (creatingColumn) {
            newRow.remove();
            if (target.siblings('.pn-flex-col').children('.pn-flex-gutter').length) {
                newPane.prepend(gutter()).append(gutter());
            }
        }
    };

    /**
    Wrap the given content in a row/column/view/body nest of nodes, returning the pane object
    containing the newly inserted content (see below for more about pane objects).

    The given content should be a single node that becomes the "view." It can optionally contain one
    each of a `pn-flex-banner` and `pn-flex-body` child. If it does not, its contents get wrapped in
    a div with the class `pn-flex-body`.

    If the content has a "title" attribute, this considers it tabbed content and creates a
    corresponding tab.

    The content can be a detached node, but for compatibility with browsers that do not support
    flexbox, mainly IE <= 9, it should usually be a node in a positioned container, otherwise this
    cannot size the panes correctly.
    */
    reflex.wrap = function (content) {
        // TODO: should this allow snippet urls, as in pane.insert()?
        var panel = wrapNoGutter(content);
        panel.prepend(gutter()).append(gutter())
            .closest('.pn-flex-row').prepend(gutter()).append(gutter())
            .addClass('pn-flex-grid');
        flexGrow(panel.parent(), 1);
        flexGrow(panel, 1);
        return panel;
    };

    var visible = {
        visibility: '',
        position: ''
    };
    var invisible = {
        visibility: 'hidden',
        position: 'absolute'
    };

    var gutter = function (element) {
        // Either creates or finds a gutter
        if (element) {
            return element.next('.pn-flex-gutter').length
                ? element.next('.pn-flex-gutter')
                : element.prev('.pn-flex-gutter');
        }
        return $('<div class="pn-flex-gutter" aria-dropeffect="none"></div>');
    };
    var sizer = function (element) {
        return gutter(element).attr({
            draggable: 'true',
            tabindex: 0
        });
    };

    // Public methods that modify sizes and content get layout flushed after execution, but not
    // private versions.
    // TODO: tests for when layout flushes happen
    var flushAfter = function (original, methods/*...*/) {
        methods = Array.prototype.slice.call(arguments, 1);
        var wrapped = $.extend({}, original);
        $.each(methods, function (i, name) {
            wrapped[name] = function () {
                var result = original[name].apply(this, arguments);
                pn.nav.flushLayout();
                return result;
            };
        });
        return wrapped;
    };

    var fitContent = function (element) {
        // TODO: document that if you set something fit content and set a specific size, set it on
        //       view body, not the view itself
        var calc = sizeFn(element);
        if (element.siblings(calc.selector).length) {
            element.addClass('pn-flex-fit-content');
            if (features.noFlexbox) {
                element.css(calc.direction, '');
                if (element.is('.pn-flex-row')) {
                    element.find('> .pn-flex-col > .pn-flex-view > .pn-flex-body')
                        .css(calc.direction, '');
                }
                fitPanesToGrid(element);
            }
            $.each([$.fn.prev, $.fn.next], function (i, fn) {
                fn.call(element, '.pn-flex-gutter')
                    .removeAttr('draggable')
                    .removeAttr('tabindex');
            });
            return false;
        }
    };

    var relSize = function (panel, pixels) {
        // Returns the size of the panel proportional to its resizable siblings, or, if given a
        // number of pixels, the proportional size of the panel that necessary to set its absolute
        // size to that number of pixels.
        if (panel.is('.pn-flex-fit-content')) {
            return 0;
        }
        if (panel.is('.pn-flex-grid')) {
            return 1;
        }
        // TODO: limits (min size)
        var calc = sizeFn(panel);
        var targetSize = pixels == null ? calc.outerSize(panel) : pixels;
        return targetSize / unitSpace(panel);
    };

    var clearColumn = function (col, leaveSubgrid) {
        var row = col.closest('.pn-flex-row');
        col.children().not('.pn-flex-gutter').remove();
        var insertPlaceholder = function () {
            var placeholder = wrapNoGutter().find('.pn-flex-view');
            if (col.children('.pn-flex-gutter').length) {
                placeholder.insertAfter(col.children('.pn-flex-gutter').first());
            } else {
                placeholder.appendTo(col);
            }
        };
        if (row.parent().is('.pn-flex-col') || col.siblings('.pn-flex-col').length) {
            // Not the last pane in the grid
            var subgrid = !row.siblings('.pn-flex-row').length;
            var rowEmpty = !(row.children('.pn-flex-col').length - 1);
            if (rowEmpty) {
                if (subgrid) {
                    if (leaveSubgrid) {
                        insertPlaceholder();
                    } else {
                        clearColumn(row.parent());
                    }
                } else {
                    var outerColumn = row.parent('.pn-flex-col');
                    gutter(row).remove();
                    row.remove();
                    var leftoverRow = outerColumn.children('.pn-flex-row');
                    if (leftoverRow.length === 1) {
                        // One row remains in this column, hoist its contents up a level
                        // TODO: fix for multiple columns in leftover row
                        leftoverRow.replaceWith(leftoverRow.children('.pn-flex-col').children());
                    }
                }
            } else {
                gutter(col).remove();
                col.remove();
            }
        } else {
            // Last pane in the grid
            insertPlaceholder();
        }
        return col;
    };

    var isSubgrid = function (row) {
        return !row.is('.pn-flex-grid')
            && row.is('.pn-flex-row')
            && row.siblings('.pn-flex-row').length === 0;
    };

    var viewUrl = (function () {
        var urlKey = pn.uuid();
        return function (view, url) {
            if (url) {
                $(view).data(urlKey, url);
            } else {
                return pn.snip(view).urls()[0] || $(view).data(urlKey);
            }
        };
    })();
    var viewUrls = function (elements) {
        return $.map(elements, function (view) {
            return viewUrl(view);
        });
    };

    var extendPane = function (element, extensions) {
        var col = $(element).closest('.pn-flex-col');
        // TODO: support multiple panes in the collection
        pn.assert(col.length === 1, 'Element must be in a pane');
        pn.assert(col.parent().is('.pn-flex-row'), 'Pane must be in a row');
        return $.extend(col, extensions);
    };
    /**
    Returns a jQuery object representing the pane that contains the given element, augmented with
    methods for manipulating the pane.

    To find the pane that contains a snippet, for example:

        pn.reflex.pane(snip)
    */
    reflex.pane = function (element) {
        var methods = flushAfter(paneMethods,
            'insert', 'load', 'clear',
            'splitRight', 'splitLeft', 'splitDown', 'splitUp',
            'widenTo', 'heightenTo', 'fitContent',
            'subgrid');
        return extendPane(element, methods);
    };

    /**
    ## Pane methods
    */

    var paneMethods = (function () {
        var pane = {};

        var tabInPane = function (pane, element) {
            var tab = _tab(element);
            pn.assert(tab.parent()[0] === pane.children('[role=tablist]')[0],
                'Tab located by element is not in this pane');
            return tab;
        };

        var insert = function (panel, content, beforeTab) {
            // TODO: test for no side effects when given illegal content
            beforeTab = beforeTab
                && tabInPane(panel, beforeTab); // Not panel.tab(), `panel` can be ordinary jQuery bag
            if (beforeTab && beforeTab[0] === _tab(content)[0]) {
                return;
            }
            var newPane = wrapNoGutter(content);
            content = newPane.children('.pn-flex-view');
            panel.children('.pn-flex-view.pn-flex-placeholder').remove();
            var existing = panel.children('.pn-flex-view');
            var plainInsert = function () {
                if (panel.children('.pn-flex-gutter').length) {
                    newPane.children().insertAfter(panel.children('.pn-flex-gutter').first());
                } else {
                    newPane.children().appendTo(panel);
                }
            };
            if (existing.length) {
                if (!panel.children('[role=tablist]').length) {
                    pn.assert(existing.length === 1,
                        'An untabbed pane somehow contains multiple view');
                    existing.remove();
                    plainInsert();
                } else {
                    // TODO: dry up - make a function for setting tab deactive (but not public)
                    var tab = _tab(content).attr('aria-selected', 'false');
                    if (!tab.length) {
                        tab = tabify(content).tab;
                    }
                    content.css(invisible);
                    if (beforeTab) {
                        tab.insertBefore(beforeTab);
                        content.insertBefore(beforeTab.view());
                    } else {
                        tab.appendTo(panel.children('[role=tablist]'));
                        content.insertAfter(panel.children('.pn-flex-view').last());
                    }
                }
            } else {
                plainInsert();
            }
            fitViewToPane(content);
            return panel;
        };

        /**
        Add a content to the pane. As in other insertion methods, this creates a tab if the content
        has a title attribute. If the pane contains tabs, this creates a new tab; if not, this
        replaces the existing content. Content may be anything that jQuery can resolve to elements.

        If the "beforeTab" is provided, it should be an element in the pane, either a tab or content
        of a tab panel.

        To load a snippet, use `pane.load()`.

        ### Magic classes

        When inserting a tab, these classes change tab behavior:

        - `pn-pinnable`: adds a "pin" checkbox to the tab that toggles a `pn-pinnable-pinned` on the
           tab. When pinned, the layout manager will load snippets of the same URL into the existing
           location, rather than a new tab.
        - `pn-hide-pin`: in conjunction with `pn-pinnable`, makes the tab always pinned.
        - `pn-noclose`: removes close affordances.
        - `pn-nodrag`: blocks dragging.
        */
        pane.insert = function (content, beforeTab) {
            return insert(this, content, beforeTab);
        };

        /**
        Behaves the same as `pane.insert()` except that it loads content from the given snippet url.
        While loading, this inserts placeholder content with a spinner.
        */
        pane.load = function (url, beforeTab) {
            var panel = this;
            var placeholder = $('<div></div>');
            pn.application().spinner(placeholder);
            viewUrl(placeholder, url);
            pn.snip.load(url, function (snip) {
                var tab = _tab(placeholder);
                if (tab.length) {
                    tab.replaceTab(snip);
                } else {
                    insert(panel, snip);
                }
            });
            return insert(panel, placeholder, beforeTab);
        };

        /**
        Empty the pane and remove it from the layout. This removes the pane and any rows or columns
        that thereby become empty, except the top-level grid.
        */
        pane.clear = function () {
            // TODO: the clear function should take as an argument a function for placeholder
            //      construction, invoked if a placeholder is required. Either that, or make that
            //      a configurable property of the grid, or both. These would be useful in the
            //      reflex editor.
            return clearColumn(this);
        };

        var insertGutter = function (element, resizable, jqFn) {
            jqFn.call((resizable === false ? gutter : sizer)(), element);
        };

        var splitCol = function (panel, content, resizable, jqFn) {
            // TODO: test for no side effects when given illegal content
            var newPane = wrapNoGutter(content);
            if (newPane.children('[role=tablist]').length) {
                _tab(newPane.children('.pn-flex-view')).activate();
            }
            if (features.noFlexbox) {
                newPane.css('width', unitSpace(panel));
            }
            var newRow = newPane.closest('.pn-flex-row');
            jqFn.call(newPane, panel);
            newRow.remove();
            if (panel.children('.pn-flex-gutter').length) {
                newPane.prepend(gutter()).append(gutter());
            }
            insertGutter(panel, resizable, jqFn);
            fitPanesToGrid(panel);
            return panel;
        };
        var splitRow = function (panel, content, resizable, jqFn) {
            // Wrap new content first in case it is illegal and throws an error
            // TODO: test for no side effects when given illegal content
            var newRow = wrapNoGutter(content).closest('.pn-flex-row');
            var existing = panel.closest('.pn-flex-row');
            if (panel.siblings('.pn-flex-col').length
                || !panel.closest('.pn-flex-row').parent().is('.pn-flex-col')) {
                // Other columns are in this row, or this is the top-level pane, so need a new
                // column to contain the new rows
                existing = panel
                    .wrapAll(colMarkup())
                    .closest('.pn-flex-row');
                panel.children('.pn-flex-gutter').first().insertBefore(existing);
                panel.children('.pn-flex-gutter').last().insertAfter(existing);
                if (features.noFlexbox) { // Optional conditional
                    flexGrow(existing.parent(), 1);
                    flexGrow(existing, 1);
                }
            }
            if (features.noFlexbox) {
                newRow.css('height', unitSpace(existing) + 'px');
            }
            jqFn.call(newRow, existing);
            insertGutter(existing, resizable, jqFn);
            if (features.noFlexbox) { // Optional conditional
                flexGrow(newRow.children('.pn-flex-col'), 1);
                fitPanesToGrid(newRow);
            }
            return panel;
        };

        /**
        ### Split functions

        Create a new column in the layout after this pane, containing the given content. Returns
        this pane. The new pane will be user-resizable by default; to make it non-resizable, pass
        `false` as the `resizable` argument.

        The [Reflex editor](#reflex-editor.html) demonstrates each split behavior.
        */
        
            /***/
            pane.splitRight = function (content, resizable) {
                return splitCol(this, content, resizable, $.fn.insertAfter);
            };
            /***/
            pane.splitLeft = function (content, resizable) {
                return splitCol(this, content, resizable, $.fn.insertBefore);
            };
            /***/
            pane.splitDown = function (content, resizable) {
                return splitRow(this, content, resizable, $.fn.insertAfter);
            };
            /***/
            pane.splitUp = function (content, resizable) {
                return splitRow(this, content, resizable, $.fn.insertBefore);
            };

        // TODO: would be nice to have a pane.latestSplit() method or something that would return
        //      the new pane after a split, but that gets a bit tricky with avoiding extraneous
        //      layout flushes

        /**
        Returns a jQuery collection of all tabs in the pane.
        */
        pane.tabs = function () {
            // TODO: this should allow the tab methods, applied to each tab in the collection
            return this.children('[role=tablist]').children('[role=tab]');
        };

        /**
        Behaves like `pn.reflex.tab(element)`, but requires that the tab be one of the tabs in
        this pane.
        */
        pane.tab = function (element) {
            // TODO: should be OK to use this if the element is in a tab in a view below this pane
            return reflex.tab(tabInPane(this, element));
        };

        /**
        Return the grid object that owns this pane, just a convenience for `pn.reflex.grid(pane)`.
        */
        pane.grid = function () {
            return pn.reflex.grid(this);
        };

        /**
        ### Gutter finders

        These allow selecting the gutters that surround the pane.
        */

            var gutterX = function (row, jqPrevNext) {
                pn.assert(row.is('.pn-flex-row'), 'Bad reflex grid structure - expected a row');
                pn.assert(!row.is('.pn-flex-grid'), 'Reached the top of the grid looking for a gutter');
                var gut = jqPrevNext.call(row, '.pn-flex-gutter');
                return gut.length ? gut : gutterX(row.parent().parent(), jqPrevNext);
            };
            var gutterAboveBelow = function (panel, jqFirstLast, jqPrevNext) {
                var children = panel.children('.pn-flex-gutter');
                return children.length
                    ? jqFirstLast.call(children)
                    : gutterX(panel.parent(), jqPrevNext);
            };
            var gutterLeftRight = function (panel, jqPrevNext) {
                pn.assert(panel.is('.pn-flex-col'), 'Bad reflex grid structure - expected a column');
                var gut = jqPrevNext.call(panel, '.pn-flex-gutter');
                return gut.length
                    ? gut
                    : gutterLeftRight(panel.parent().parent(), jqPrevNext);
            };

            /***/
            pane.gutterAbove = function () {
                return gutterAboveBelow(this, $.fn.first, $.fn.prev);
            };
            /***/
            pane.gutterBelow = function () {
                return gutterAboveBelow(this, $.fn.last, $.fn.next);
            };
            /***/
            pane.gutterLeft = function () {
                return gutterLeftRight(this, $.fn.prev);
            };
            /***/
            pane.gutterRight = function () {
                return gutterLeftRight(this, $.fn.next);
            };

            /**
            When the pane is in a subgrid, the normal gutter finders select the inside gutters, but
            you can find the outer gutters with the `gutterOuter*()` family of methods.
            */

            // TODO: make these well-behaved when called on a pane that is not a subgrid

            /***/
            pane.gutterOuterAbove = function () {
                return gutterX(this.parent(), $.fn.prev);
            };
            /***/
            pane.gutterOuterBelow = function () {
                return gutterX(this.parent(), $.fn.next);
            };
            /***/
            pane.gutterOuterLeft = function () {
                return gutterLeftRight(this.parent().parent(), $.fn.prev);
            };
            /***/
            pane.gutterOuterRight = function () {
                return gutterLeftRight(this.parent().parent(), $.fn.next);
            };

            $.each(['Above', 'Below', 'Left', 'Right'], function (i, direction) {
                var name = 'gutterOuter' + direction;
                var original = pane[name];
                pane[name] = function () {
                    if (isSubgrid(this.parent())) {
                        return original.apply(this, arguments);
                    } else {
                        return $();
                    }
                };
            });

            /**
            The gutter finders return a jQuery object augmented with one method:
            */

            $.each(['Above', 'Below', 'Left', 'Right'], function (i, direction) {
                $.each(['', 'Outer'], function (j, prefix) {
                    var name = 'gutter' + prefix + direction;
                    var original = pane[name];
                    pane[name] = function () {
                        var gutter = original.apply(this, arguments);
                        /**
                        Disable dragging content into the gutter.
                        */
                        gutter.noDrop = function () {
                            this.removeAttr('aria-dropeffect');
                        };
                        return gutter;
                    };
                });
            });
            // TODO: gutters should have an insert method, at least, and navigation methods to find
            //      nearby components of the grid would be nice

        /**
        Makes the pane fit-to-content instead of sizable, with respect to the closest axis where the
        pane has siblings.
        */
        pane.fitContent = function () {
            // TODO: this should also readjust the surrounding growth factors to 1 = default size
            if (this.siblings('.pn-flex-col').length) {
                fitContent(this);
            } else {
                fitContent(this.parent());
            }
            return this;
        };

        var grower = function (direction, jqOuterSize, selector) {
            return function (pixels) {
                var self = selector(this);
                var adjacent = self.nextAll('.pn-flex-' + direction).not('.pn-flex-fit-content');
                adjacent = adjacent.length
                    ? adjacent
                    : self.prevAll('.pn-flex-' + direction).not('.pn-flex-fit-content');
                adjacent = adjacent.first();
                // TODO: friendlier handling when there is no adjacent (could resize parent)
                pn.assert(adjacent.length, 'No adjacent panes');
                var selfSize = relSize(self, pixels);
                var adjacentPixels = jqOuterSize.apply(self) + jqOuterSize.apply(adjacent) - pixels;
                var adjacentSize = relSize(adjacent, adjacentPixels);
                // Must compute both expected sizes before resizing anything
                if (selfSize < 0 || adjacentSize < 0) {
                    // This can happen on drag to edges, I think, because edge cases aren't handled
                    // yet. Once they are, this can become an assertion.
                    console.warn('Unexpected flex size', selfSize, adjacentSize);
                }
                flexGrow(self, selfSize);
                flexGrow(adjacent, adjacentSize);
                fitPanesToGrid(self);
                return this;
            };
        };

        /**
        Widen (or narrow) the pane's column to the given number of pixels.
        */
        pane.widenTo = function (pixels) { // ignore jshint
            // TODO: this can be simplified since most of the need for the weird declaration style
            //      has been factored away
            throw 'See below'; // Done thus for documentation
        };
        pane.widenTo = grower('col', $.fn.outerWidth, function (panel) {
            return panel;
        });

        /**
        Heighten (or shorten) the pane's row to the given number of pixels.
        */
        pane.heightenTo = function (pixels) { // ignore jshint
            throw 'See below'; // Done thus for documentation
        };
        pane.heightenTo = grower('row', $.fn.outerHeight, function (panel) {
            return panel.parent('.pn-flex-row');
        });

        /**
        Make the pane a subgrid, which really just means that it has gutters on all four sides.
        */
        pane.subgrid = function () {
            this.wrapAll(colMarkup())
                .parent()
                .prepend(gutter()).append(gutter());
            if (this.children('.pn-flex-gutter').length) {
                this.parent().before(gutter()).after(gutter());
            } else {
                this.prepend(gutter()).append(gutter());
            }
            if (features.noFlexbox) {
                this.parent().parent().css('width', this.css('width'));
                flexGrow(this.parent(), 1);
                fitPanesToGrid(this.parent().parent());
            }
            return this;
        };

        /**
        Return the snippet urls, if any that can rebuild this pane's content. This omits any content
        not loaded from snippets.
        */
        pane.urls = function () {
            return viewUrls(this.children('.pn-flex-view'));
        };

        return pane;
    })();

    var _pane = function (element) {
        // A private version of reflex.pane that does not trigger expensive layout flushes
        var pane = extendPane(element, paneMethods);
        // Avoid using methods that return a layout-flushing object internally:
        delete pane.tabs;
        delete pane.tab;
        return pane;
    };

    var extendTab = function (element, extensions) {
        var tab = $(element).closest('[role=tab]').length
            ? $(element).closest('[role=tab]')
            // TODO: handle when the element is in a nested, untabbed, pane
            : $(element).closest('.pn-flex-view');
        if (tab.is('.pn-flex-view')) {
            tab = tab.siblings('[role=tablist]').find('[role=tab]').filter(function () {
                return $(this).attr('aria-controls') === tab.attr('id');
            });
        }
        // TODO: allow for multiple tabs in the same collection, so methods apply to each
        pn.assert(tab.length <= 1, 'Operations on multiple tabs at once not yet implemented');
        return $.extend(tab, extensions);
    };

    /**
    Return the tab that activates the container for the given element, or if given content in a tab,
    the tab itself. The collection is augmented with tab-specific methods.

    To find the tab that contains a snippet, for example:

        pn.reflex.tab(element)
    */
    reflex.tab = function (element) {
        var methods = flushAfter(tabMethods,
            'activate', 'replaceTab', 'replaceSnippet',
            'close', 'detachView');
        return extendTab(element, methods);
    };
    /**
    ## Tab methods
    */

    var tabMethods = (function () {
        var tabPanel = function (element) {
            return element.parent().siblings('.pn-flex-view').filter(function () {
                return this.id === element.attr('aria-controls');
            });
        };
        var tab = {};

        var tabName = function (element) {
            return element.find('a').text();
        };

        /**
        Show the given tab.
        */
        tab.activate = function () {
            // TODO: recursive activation
            // TODO: tabindex handling
            this.attr('aria-selected', 'true').siblings().attr('aria-selected', 'false');
            tabPanel(this).css(visible).siblings('.pn-flex-view').css(invisible);
            try {
                // TODO: hack - need a more consistent way to do a becoming visible event
                pn.snip(tabPanel(this)).fn('show')();
            } catch (e) {
                // don't care
            }
            return this;
        };

        var removeTab = function (element, jqFn) {
            var view = tabPanel(element);
            
            // allow tabs to abort closure
            // note -- can easily be extended to allow nested snips to abort closure too
            try {
                if( pn.snip(view).fn('tabWillClose') && pn.snip(view).fn('tabWillClose')()[0] === false ){
                    return;
                }
            } catch(e){
                // we don't care -- snip().fn throws exceptions stupidly
            }
            
            view
                .attr('title', tabName(element))
                .removeClass('pn-flex-view');
            jqFn.call(view);
            // TODO: also .focus() if removed tab is focused
            if (element.attr('aria-selected') === 'true') {
                var next = element.next().length ? element.next() : element.prev();
                if (next.length) {
                    reflex.tab(next).activate();
                }
            }
            var tabs = element.parent();
            element.remove();
            if (!tabs.children('[role=tab]').length) {
                clearColumn(tabs.parent(), true);
            }
            return view;
        };

        /**
        Remove the tab and content from the pane. This returns the tab content, with a title
        attribute affixed; the content can thus be inserted as a tab elsewhere, if desired.

        If a pane becomes empty, this removes the pane as well, but it never removes the last pane,
        either from a subgrid or the top-level grid. Instead, it inserts an empty placeholder view,
        of class `pn-flex-placeholder`. If you do want to completely remove a subgrid, use
        `pane.clear()`. To completely remove a top-level grid, just remove it as you would a normal
        dom element.
        */
        tab.close = function () {
            return removeTab(this, $.fn.remove);
        };

        /**
        Close the tab, but use `detach()` instead of `remove()`, thus maintaining event handlers and
        such. May be useful for detaching the tab panel content for use elsewhere, such as in a
        popup.
        */
        tab.detachView = function () {
            return removeTab(this, $.fn.detach);
        };

        /**
        Return the tab's title text, or if given an argument, rename the tab.
        */
        tab.name = function (name) {
            return name == null ? tabName(this) : this.find('a').text(name);
        };

        var replace = function (originalTab, nodes) {
            _pane(originalTab).insert(nodes, originalTab);
            var newTab = _tab(nodes);
            if (originalTab.is('[aria-selected=true]')) {
                newTab.activate();
            }
            if (originalTab.is('.pn-pinnable-pinned') && nodes.is('.pn-pinnable')) {
                newTab.find('.pn-pin input[type=checkbox]')
                    .prop('checked', true)
                    .trigger('change');
            }
            return tabMethods.close.apply(originalTab);
        };
        /**
        Insert the given content into this tab's position in the pane, returning this tab's content,
        as from `tab.close()`. This accepts the same type of content as `pane.insert()`; to replace
        a tab with content from a snippet, use `tab.replaceSnippet()`.
        */
        tab.replaceTab = function (content) {
            return replace(this, $(content));
        };

        /**
        Replace this tab with content from the given snippet url. This returns content, as in
        `tab.replaceTab()`, but does not remove the content until the snippet loads. Instead, this
        puts spinners on the tab and view.
        */
        tab.replaceSnippet = function (url) {
            var originalTab = this;
            var panel = tabPanel(originalTab);
            pn.application().spinner(originalTab);
            pn.application().spinner(panel);
            viewUrl(panel, url);
            pn.snip.load(url, function (snip) {
                replace(originalTab, snip);
            });
            return panel;
        };

        /** The pane containing this tab. */
        tab.pane = function () {
            return reflex.pane(this);
        };

        /** Return the tab panel element for the given tab. */
        tab.view = function () {
            return tabPanel(this);
        };

        /** If the tab is loaded from a snippet, return the URL that loads it. */
        tab.url = function () {
            return viewUrl(tabPanel(this));
        };

        return tab;
    })();

    var _tab = function (element) {
        // A private version of reflex.tab that does not trigger expensive layout flushes
        var tab = extendTab(element, tabMethods);
        // Dummy check to avoid using layout-flushing objects internally:
        delete tab.pane;
        return tab;
    };

    /**
    Return the grid container for the given element, a jQuery collection of one node, augmented with
    methods for manipulating the grid. If the grid contains subgrids, this returns the outer grid.
    */
    reflex.grid = function (element) {
        var walkUp = function (row) {
            pn.assert(row.is('.pn-flex-row'), 'Element is not in a properly structured layout');
            return row.parent().is('.pn-flex-col') ? walkUp(row.parent().parent()) : row;
        };
        var topRow = walkUp($(element).closest('.pn-flex-row'));
        return $.extend(topRow, gridMethods);
    };

    var gridMethods = (function () {
        var grid = {};
        /**
        Insert the given content in the given position, as appropriate for that node.

        Currently, the target may only be a gutter.
        */
        grid.insert = function (content, target) {
            // TODO: figure out what the sensible behavior should be when given non-gutter targets,
            //      probably whatever works for tab drag & drop
            // TODO: add resizability parameter
            target = $(target);
            pn.assert(target.is('.pn-flex-gutter'), 'Grid insert target must be a gutter');
            insertInGutter(content, target);
            pn.nav.flushLayout();
            return this;
        };

        /**
        If passed no argument, return an object suitable for serializing the grid state, minus any
        snippet information. This format is meant to be dependable so it can be used for persistent
        URLs and layout serialization, but not human-readable. Use the
        [Reflex editor](#reflex-editor.html) to build layouts instead of writing the format spec by
        hand.
        */
        grid.positions = function () {
            // TODO: unit tests
            var bitmask = function (elements, condition) {
                var mask = 0;
                for (var p = 1, i = 0; i < elements.length; p *= 2, i++) {
                    if (condition(elements[i])) {
                        mask |= p;
                    }
                }
                return mask;
            };
            var collectSizes = function (panel) {
                var sizes = [];
                var tabs = panel.filter('[role=tablist]').children('[role=tab]');
                if (tabs.length) {
                    var active = tabs.index(tabs.filter('[aria-selected=true]'));
                    var pinState = bitmask(tabs, function (tab) {
                        return $(tab).is('.pn-pinnable-pinned');
                    });
                    return [tabs.length, active, pinState];
                }
                panel.filter('.pn-flex-row, .pn-flex-col').each(function () {
                    var rc = $(this);
                    var size = relSize(rc);
                    var growth = Math.round(size * 1000) / 1000;
                    // For a grid, growth factor is always 1
                    var base = rc.is('.pn-flex-grid') || isSubgrid(rc)
                        ? [] // panel is a grid or subgrid
                        : [growth];
                    // TODO: well-defined behavior when size is both set and set to fit content
                    sizes.push(base.concat(collectSizes(rc.children())));
                    if (rc.is('.pn-flex-col') && rc.children('.pn-flex-view').length) {
                        var gutters = [];
                        $.each(['Above', 'Right', 'Below', 'Left'], function (i, direction) {
                            gutters[i] = paneMethods['gutter' + direction].call(rc);
                            gutters[i + 4] = paneMethods['gutterOuter' + direction].call(rc);
                        });
                        var noDropState = bitmask(gutters, function (gutter) {
                            return gutter.length && gutter.attr('aria-dropeffect') == null;
                        });
                        if (noDropState) {
                            sizes[sizes.length - 1].push(noDropState);
                        }
                    }
                });
                return sizes;
            };
            return collectSizes(this)[0]; // Always exactly one top-level row
        };

        /**
        A jQuery collection of the views in this grid, in dom order. Differs from just
        `.find('.pn-flex-view')` because it will not return views within other views.
        */
        grid.views = function () {
            // TODO: unit tests that this does not go into grids within pane bodies
            return anyInGrid(this, '.pn-flex-view');
        };

        /** Any snippet URLs in this grid. */
        grid.urls = function () {
            return viewUrls(anyInGrid(this, '.pn-flex-view'));
        };

        return grid;
    })();
    $.extend(reflex.grid, gridMethods);

    /**
    Create a grid from the serialized layout, invoking the given builder function for each view. The
    builder can either return a node for insertion into the pane being built, or insert content
    itself, in which case it should return falsy.

    The builder receives arguments `builder(pane, tabbed)`:

    - `tabbed`: true or false depending on whether the content should be tabbed
    - `pane`: the pane being built

    The grid will be appended to the given container, which should be a positioned element. If
    the container is not positioned, this will be unable to precisely reconstruct pane sizes in
    Internet Explorer 10.
    */
    reflex.create = function (layout, builder, container) {
        // TODO: need an external version of grid.create() that flushes layout
        var rootCol = pn.reflex.wrap();
        var grid = reflex.grid(rootCol);
        grid.appendTo(container);
        var tabCount = pn.uuid();
        var activeIndex = pn.uuid();
        var pinState = pn.uuid();
        var divide = function (panel, spec, split) {
            var appendingRows = split === paneMethods.splitDown;
            if (typeof spec[0] !== 'number') { // grid or subgrid
                if (spec !== layout) {
                    panel.subgrid();
                }
                divide(panel, [1].concat(spec), split);
                return;
            }
            
            if ((spec.length === 2 || spec.length === 5)
            && typeof spec[spec.length - 1] === 'number') {
                var noDropMask = spec[spec.length - 1];
                spec = spec.slice(0, -1);
                var directions = ['Above', 'Right', 'Below', 'Left'];
                for (var i = 0, p = 1; i < directions.length; p *= 2, i++) {
                    if (p & noDropMask) {
                        paneMethods['gutter' + directions[i]].call(panel).noDrop();
                    }
                    if (p & (noDropMask >> 4)) {
                        paneMethods['gutterOuter' + directions[i]].call(panel).noDrop();
                    }
                }
            }
            
            if (typeof spec[1] === 'number') { // tabbed pane
                panel.children('.pn-flex-placeholder')
                    .data(tabCount, spec[1])
                    .data(activeIndex, spec[2])
                    .data(pinState, spec[3]);
                return;
            }

            var panes = [panel];
            $.each(spec.slice(2), function () {
                var placeholder = $('<div class="pn-flex-placeholder"></div>');
                split.call(panes[panes.length - 1], placeholder);
                panes.push(_pane(placeholder));
            });
            $.each(spec.slice(1), function (i, subSpec) {
                var subAppend = appendingRows
                    ? paneMethods.splitRight
                    : paneMethods.splitDown;
                divide(panes[i], subSpec, subAppend);
            });
        };
        divide(rootCol, layout, paneMethods.splitRight);

        grid.views().each(function () {
            if (builder) {
                var pane = _pane(this);
                var placeholder = pane.children('.pn-flex-placeholder');
                var numTabs = placeholder.data(tabCount);
                var activeTab = placeholder.data(activeIndex);
                var pinMask = placeholder.data(pinState);
                for (var p = 1, i = 0; i < (numTabs || 1); p *= 2, i++) {
                    // TODO: test builder arguments
                    var content = builder(numTabs != null, pane);
                    if (content) {
                        pane.insert(content);
                    }
                    if (p & pinMask) {
                        _tab(content).addClass('pn-pinnable-pinned');
                    }
                }
                if (activeTab) {
                    _tab(pane.children('[role=tablist]').find('[role=tab]').eq(activeTab))
                        .activate();
                }
            }
        });

        var size = function (panel, spec) {
            if (!panel.is('.pn-flex-grid')) {
                if (typeof spec === 'number') {
                    return;
                }
                if (typeof spec[0] === 'number') {
                    if (spec[0] === 0) {
                        fitContent(panel);
                    } else {
                        flexGrow(panel, spec[0]);
                    }
                }
            }
            var slicePos = typeof spec[0] === 'number' ? 1 : 0;
            $.each(spec.slice(slicePos), function (i, subSpec) {
                size(panel.children('.pn-flex-row, .pn-flex-col').eq(i), subSpec);
            });
        };
        size(grid, layout);

        return grid;
    };

    /**
    For creating an application layout according to the [layout protocol](#api/layouts).
    */
    reflex.layout = function (target) {
        $('body').css({
            // TODO: yuck - make this nicer, but necessary for IE where this needs to calculate sizes
            position: 'fixed',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0
        });
        // TODO: unit tests
        var grid = pn.reflex.grid(reflex.wrap());
        $(target).replaceWith(grid);
        var loadingUrl = pn.uuid();
        var loadSnip = function (url, tabbed) {
            if (!url) {
                return '<div>Layout serialization error</div>';
            }
            var placeholder = tabbed
                ? $('<div class="pn-flex-loading-snip" title="Loading"><div></div></div>')
                : $('<div><div></div></div>');
            placeholder.data(loadingUrl, url);
            pn.application().spinner(placeholder.children());
            pn.snip.load(url, function (view) {
                // TODO: race condition - someone adds content to non-tabbed pane before loaded
                if (tabbed) {
                    _tab(placeholder).replaceTab(view);
                } else {
                    var pane = _pane(placeholder);
                    placeholder.remove();
                    pane.insert(view);
                    if (pane.is('.pn-flex-fit-content') || pane.parent().is('.pn-flex-fit-content')) {
                        fitPanesToGrid(pane.closest('.pn-flex-fit-content'));
                    }
                }
            });
            return placeholder;
        };
        var loadLayout = function (layout) {
            layout = layout || [];
            // TODO: need to refit pane sizes for IE < 10 after loading?

            // TODO: check for Array-type layout should be unecessary after everyone has switched
            var snips = layout.snips
                ? layout.snips
                : $.grep(layout, function (v) {
                    return typeof v === 'string';
                });
            var sizes = layout.positions
                ? layout.positions
                : $.grep(layout, function (v) {
                    return typeof v !== 'string';
                });

            if (!layout.snips) {
                console.warn('Array-style reflex layouts are deprecated. Convert with reflex editor.');
            }
            
            var index = 0;
            pn.snip.after(function () {
                var container = grid.parent();
                grid.remove();
                grid = reflex.create(sizes, function (tabbed, pane) {
                    var url = snips[index++];
                    if (tabbed) {
                        var placeholder = $('<div></div>').attr('title', pn.s.loading);
                        pane.insert(placeholder);
                        _tab(placeholder).replaceSnippet(url);
                    } else {
                        pane.load(url);
                    }
                }, container);
                // TODO: should put spinner anchor within the tab instead (need to wrap text in span)
                // grid.views().filter('.pn-flex-loading-snip').each(function () {
                //     pn.application().spinner(_tab(this));
                // });
            }, function () {
                pn.nav.flushLayout();
            });
        };
        return {
            loadLayout: loadLayout,
            loadSnippets: function (snippets) {
                var pane = _pane(grid.views().last());
                anyInGrid(grid, '.pn-flex-col').each(function () {
                    var candidate = $(this);
                    if (candidate.children('.pn-flex-view').length
                    && candidate.height() * candidate.width() > pane.height() * pane.width()) {
                        pane = _pane(candidate);
                    }
                });
                pn.snip.after(function () {
                    $.each(snippets, function (i, url) {
                        var targetView = grid.views()
                            .filter('.pn-pinnable')
                            .filter(function () {
                                var snipPath = (pn.snip(this).urls()[0] || '').split('?')[0];
                                return !_tab(this).is('.pn-pinnable-pinned')
                                    && snipPath
                                    && snipPath === url.split('?')[0];
                            });
                        var placeholder = loadSnip(url, true);
                        if (targetView.length) {
                            _tab(targetView).replaceTab(placeholder);
                        } else {
                            pane.insert(placeholder);
                        }
                        if (i === 0) {
                            _tab(placeholder).activate();
                        }
                    });
                }, function () {
                    pn.nav.flushLayout();
                });
            },
            snippets: function () {                
                return grid.urls();
            },
            serialize: function () {
                return reflex.layout.serialize(grid.positions());
            },
            restore: function (snippets, positions) {
                if (!positions) {
                    var split = snippets.split('^');
                    var spec = reflex.layout.parse(split[split.length - 1]);
                    loadLayout(split.slice(0, -1).concat(spec));
                } else {
                    loadLayout({
                        snips: snippets,
                        positions: reflex.layout.parse(positions)
                    });
                }
            }
        };
    };

    /**
    Serializes a grid spec, as returned by `grid.positions()` in the same manner as used for
    insertion into layout URLs.
    */
    reflex.layout.serialize = function (positions) {
        return JSON.stringify(positions).replace(/[\[\],]/g, function (m) {
            // These characters pass unchanged through encodeURIComponent, and most url
            // parsers should safely detect them as part of the url
            return {
                '[': 'i',
                ']': 'l',
                ',': 'j'
            }[m];
        });
    };

    /**
    Parses a grid spec from the format used for URLs.
    */
    reflex.layout.parse = function (serialized) {
        return JSON.parse(serialized.replace(/[ilj]/g, function (m) {
            return {
                'i': '[',
                'l': ']',
                'j': ','
            }[m];
        }));
    };
});
/**
Layouts
=======

An experimental module to test the layout protocol idea, that is, an application can use as its
layout any object that implements the methods:

- `loadLayout(layout)`
- `loadSnippets(snippets)`
- `snippets()`
- `serialize()`
- `restore(serialized)`
*/

pn.module('layouts', function (layouts, $) {

    /** 
        A wrapper around [flex](#api/flexible-layout). When given an array of layouts, opens
        multiple windows or maps the layouts onto existing windows.
    */
    layouts.flex = function (target) {
        return {
            loadLayout: function (layout) {
                if (layout instanceof Array) {
                    // Used for auto-open multiple windows in tmng
                    $.each(layout, function (i, layout) {
                        var win = pn.wins.family()[i];
                        if (win === window) {
                            pn.flexLayout(target, layout);
                        } else {
                            var parts = pn.nav.parts();
                            parts.layout = pn.flexLayout(target).toURL.apply({
                                layout: layout
                            });
                            if (win) {
                                win.location.href = parts.toString();
                            } else {
                                pn.wins.open(parts.toString());
                            }
                        }
                    });
                } else {
                    pn.flexLayout(target, layout);
                }
            },
            loadSnippets: function (snippets) {
                if (!pn.flexLayout(target)) {
                    // No flex set up yet, for example, opened a snippet directly in a new window
                    pn.flexLayout(target, {
                        // Default to a single-pane layout
                        columns: [{
                            left: 0,
                            right: 1,
                            rows: [{
                                top: 0,
                                bottom: 1,
                                pane: {snips: snippets}
                            }]
                        }]
                    });
                } else {
                    pn.flexLayout(target).load(snippets);
                }
            },
            snippets: function () {
                // Do not really return the snippets because old flex serializes snippet urls within
                // its position spec structure. Doesn't matter, it's going away.
                return [];
            },
            serialize: function () {
                if (pn.flexLayout(target)) {
                    // Flex not initialized somehow? Should this check be in nav.js?
                    return pn.flexLayout(target).toURL();
                }
            },
            restore: function (snippets, positions) {
                pn.flexLayout(target, positions);
            }
        };
    };

    /**
    The target can be an existing Reflex grid (TODO) or any regular node, which would then get
    replaced with a Reflex grid. See [Reflex](#api/reflex) for more.
    */
    layouts.reflex = function (target) {
        return pn.reflex.layout.call(this, target);
    };

    /** Replaces the target's content with snippet content on navigation. */
    layouts.simple = function (target) {
        var loading = '';
        var load = function (url) {
            loading = url;
            if (!url) {
                target.empty().append('<p>No snippet specified</p>');
                return;
            }
            pn.snip.load(url, function (snip) {
                // TODO: this will get confused if you rapidly click links and a later snippet
                //      loads faster
                loading = '';
                target.empty().append(snip);
            });
        };
        return {
            /**
            When given a layout object, this renders the layout; the application's `provideLayout()`
            method is responsible for providing a layout specification the layout manager can
            consume.

            Layout objects must contain these two keys:

            - snips: [a list of snippets this layout manager must load]
            - positions: an arbitrary object

            The positions object is anything this layout manager pleases that defines how it will
            arrange the given snippets on the page.
            */
            loadLayout: function (layout) {
                if (layout) {
                    load(layout.snip);
                }
            },
            /**
            Load the given list of snippets into the current layout.
            */
            loadSnippets: function (snippets) {
                load(snippets[0]);
            },
            /**
            Returns a list of snippets loaded in this layout.
            */
            snippets: function () {
                return [loading || pn.snip(target.children()).urls()];
            },
            /**
            Serialize the current layout positions, returning an URL-safe string suitable for
            passing to this layout manager's `restore()` method.
            */
            serialize: function () {
                // Need something so it's truthy
                return '-';
            },
            /**
            Given a list of snippets and a string representation of a layout, as returned from this
            layout manager's `serialize()` method, load the snippets and render them in the
            specified arrangement.

            This is analogous to the `loadLayout()` method, except that it takes a string
            representation of the position specification, rather than an arbitrary object.
            */
            restore: function (snippets, positions) {
                // TODO: convert to new school way that actually uses both params
                load(snippets[0]);
            }
        };
    };
});
/**
Drag and Drop
=============

A jQuery plugin for attaching drag and drop capability to dom elements.

jQuery.drag
-----------

Requires:
jQuery

Usage:

    var options = {
        // optional
        // return to false to override drag proxy position/size
        over: function( target-elt, region-label, source-elt ) { .... },
        drop: function( target-elt, region-label, source-elt ) { .... }, // optional
        bound: element, // an element that restricts the area that contains a drag
        source_class: 'drag-source', // class added to the drag source while drag takes place
        drag_class: 'drag-object', // optional -- class added to the thing being dragged
        drag_id: 'drag_object', // option -- id added to the thing being dragged
        target_class: 'drag-target', // optional -- class added to possible targets for the drag
        over_class: 'drag-over', // optional -- class added to thing being dragged if over legitimate target region
        lock_x: true|false, // optional -- if true, can only drag vertically
        lock_y: true|false, // optional -- if true, can only drag horizontally
        animate_snapback: true|false, // optional -- if true, animate drag proxy snapping back to source
        targets:[
            {
                selector: '.target', // OR provide an element or jQuery array of elements

                // optional
                // list of targetable subregions of the target in local [0,1]x[0,1] space
                // by default: [{ label: all, top: 0, left: 0, width: 1, height 1 }]
                regions:[
                    { label: "top", top: 0.0, left: 0.0, height: 0.2, width: 1.0 },
                    { label: "bottom", top: 0.8, left: 0.0, height: 0.2, width: 1.0 }
                ]
            }
        ]
    }
    $('.draggable-things').drag(options);

Notes
-----

If you want the drag behavior to change dynamically you can pass a function back instead of the
options object. The product of that function (which should be an object structured as above) will be
used each time.

The region **label** is simply passed back untouched, so it can be anything you like (including a
custom object or function).

- TODO: Need to find someway to simulate the actual focus of the drop target
        changing since it is just a single div moving around the page, right?

Terminology
-----------

- **source**: the thing you click on to start a drag operation
- **object**: the thing that is shown being dragged around on the screen
- **target**: a thing that the object can be dragged to
- **region**: a portion of a target that can be dragged to

Relative Coordinates
--------------------

As with flexLayout, sub-component coordinates (e.g. target regions) are described in relative (0-1)
coordinates representing the container object as living in a (0,0) top-left to (1,1) bottom-right
coordinate system.

In addition, "relative coordinates" are permitted and may take two forms:

**string**: "scale+offset" e.g. (0.5-10) is converted to the the size of that coordinate system
(e.g. the width for a left or width value) multiplied by the first number plus the second number).
In this case this would be "the middle minus 10". The idea here is to be able to create fixed size
targets at that are attached to a specific part of a target.

**function(base)**: if you provide a callback function it will be passed the value of the parent
object's width or height (as appropriate). You can, of course, return anything you like. In the
table example, this is used to scale the target areas of a dragged column to be the height of the
table (which can vary unpredictably -- e.g. if the table is initially hidden it will have zero
dimension, or if the table can content that can change).

Styling
-------

Style draggable things with these selectors:

- `[aria-grabbed]`: thing is draggable
- `[aria-grabbed="true"]`: thing is being dragged
- `[aria-dropeffect]`: can drop the thing being dragged here
- `.drag-object`: the helper rectangle that shows where the thing being dragged would land
- `.drag-vertical`: on the helper rectangle, indicates vertical lock
- `.drag-horizontal`: on the helper rectangle, indicates horizontal lock

*/
/*global pn */

/**
utility function to calculate relative coordinates modifier can be:

- (number) -- returns base * modifier
- (function) -- returns modifier(base)
- "A" (String) -- returns base * A
- "A+B" (String) -- returns base * A + B
- "A-B" (String) -- returns base * A - B
*/
Math.relativeCoordinate = function(base, modifier) {
    "use strict";

    var x, y, retVal;
    if(typeof modifier === 'number') {
        retVal = base * modifier;
    } else if(typeof modifier === 'function') {
        retVal = modifier(base);
    } else if(typeof modifier === 'string') {
        if(modifier.indexOf('-') >= 0) {
            modifier = modifier.split('-');
            x = parseFloat(modifier[0]);
            y = parseFloat(modifier[1]);
            if(isNaN(x)) {
                x = 0;
            }
            retVal = base * x - y;
        } else if(modifier.indexOf('+') >= 0) {
            modifier = modifier.split('+');
            x = parseFloat(modifier[0]);
            y = parseFloat(modifier[1]);
            if(isNaN(x)) {
                x = 0;
            }
            retVal = base * x + y;
        } else {
            retVal = base + parseFloat(modifier);
        }
    }
    return retVal;
};

/*jslint white:true, browser: true */
/*global $, jQuery, console, Math */

(function () {

    var dragBox = function (source, options) {
        var result = $('<div />')
            .addClass(options.drag_class)
            .css({
                position: 'absolute',
                left: source.offset().left,
                top: source.offset().top,
                width: source.outerWidth(),
                height: source.outerHeight()
            });
        if(options.lock_x) {
            result.addClass('drag-vertical');
        }
        if(options.lock_y) {
            result.addClass('drag-horizontal');
        }
        return result;
    };

    var restrictPosition = function (element, bound) {
        if (!bound) {
            return;
        }
        var boundary = $(bound).offset() || {top: 0, left: 0};
        element.css({
            left: Math.max(element.offset().left, boundary.left),
            top: Math.max(element.offset().top, boundary.top)
        });
        element.css({
            left: Math.min(element.offset().left, boundary.left + $(bound).outerWidth() - element.outerWidth()),
            top: Math.min(element.offset().top, boundary.top + $(bound).outerHeight() - element.outerHeight())
        });
    };

    var setupTargets = function (targets, target_class, data) {
        $.each(targets, function(idx, target) {
            // TODO: inconsistent that you can set target.selector to a function? is that necessary?
            var elements = typeof target.selector === 'function' ? target.selector() : target.selector;
            $(elements)
                .addClass(target_class) // TODO build out a target element for each region per drag5
                .each(function() {
                    var element, top, left, width, height;

                    element = $(this);
                    top = element.offset().top;
                    left = element.offset().left;
                    width = element.outerWidth();
                    height = element.outerHeight();

                    // prevent the source from dragging to itself
                    if(element[0] !== data.drag_source[0]) {

                        // if no region list was provided, create a single region that covers the element
                        if(typeof target.regions !== 'object' || target.regions.length === undefined) {
                            target.regions = [
                                { label: 'all', left: 0, top: 0, width: 1, height: 1 }
                            ];
                        }

                        // build a target region for each region of each found element
                        $.each(target.regions, function(idx, region) {
                            // reference to previous region
                            var len = data.regions.length,
                                current = {
                                    left: left + Math.relativeCoordinate(width, region.left),
                                    top: top + Math.relativeCoordinate(height, region.top),
                                    width: Math.relativeCoordinate(width, region.width),
                                    height: Math.relativeCoordinate(height, region.height),
                                    element: element, // the element this is part of
                                    target: target, // back reference to the target specification
                                    label: region.label, // copy of the region (template) label
                                    prev: len ? data.regions[len - 1] : false, // get reference to prev for keyboard
                                    next: false
                                };

                            if(current.prev) {
                                // reference to next for keyboard
                                current.prev.next = current;
                            }

                            data.regions.push(current);
                        });
                    }
                });
        });
    };

    window.DragDrop = {
        start: function(evt, source) {
            var options, data;
            
            if(source === undefined) {
                source = this;
            }
            source = $(source);

            // TODO:
            // catch all keys but spacebar and allow them to do their default;
            // the spacebar will trigger drag drop functionality when focused on a source.
            // TODO: Tonio, maybe there is a better way to check if there is already
            //       a drag ongoing than $('.drag-object').length
            // Daniel -- almost certainly but no idea yet what it is :-)
            // Tonio -- We need to prevent multiple drag-drop sessions(?) from occurring at the same time.
            // For example, when I am focused on the same drag source and keep hitting the spacebar.
            // Currently, the only way I saw how to do this was check to see if there was a .drag-object
            // on the page
            if ($('.drag-object').length) {
                return;
            }

            // tell user agent draggable element is dragging
            source.attr('aria-grabbed', true);

            options = typeof evt.data.options === 'function' ? evt.data.options() : evt.data.options;

            // set up defaults
            options = $.extend({
                source_class: 'drag-source',
                drag_class: 'drag-object',
                drag_id: 'drag-object',
                target_class: 'drag-target',
                over_class: 'drag-over',
                animate_snapback: true,
                helper_rect: {left: 0, top: 0, width: 1, height: 1}
            }, options);

            options.helper_rect = $.extend({}, options.helper_rect);
            options.helper_rect.left = Math.relativeCoordinate(source.outerWidth(), options.helper_rect.left);
            options.helper_rect.top = Math.relativeCoordinate(source.outerHeight(), options.helper_rect.top);
            options.helper_rect.width = Math.relativeCoordinate(source.outerWidth(), options.helper_rect.width);
            options.helper_rect.height = Math.relativeCoordinate(source.outerHeight(), options.helper_rect.height);

            data = {
                options: options,
                regions: [],
                drag_source: source,
                // keep track of where the mouse is relative to the top of the source object
                helper_offset: {
                    x: (evt.pageX - source.offset().left) || 0,
                    y: (evt.pageY - source.offset().top) || 0
                }
            };

            if (options.targets) {
                setupTargets(options.targets, options.target_class, data);
            }

            data.helper = dragBox(source, options);
            $('iframe').hide();
            data.helper.appendTo('body');

            $('html')
                .on('keydown.dnd', data, pn.onkey(['right', 'left', 'up', 'down', 'tab'], DragDrop.move))
                .on('mousemove', data, DragDrop.move)
                .on('keydown.dnd', data, pn.onkey(['escape', 'enter'], DragDrop.end))
                .on('mouseup', data, DragDrop.end);

            if (evt.type === 'keydown') {
                // TODO: why triggering a keydown?
                $('html').trigger($.Event('keydown',
                    {
                        'which': 40,
                        'data': data
                    })
                );
            }
        },

        move: function(evt) {
            var
                options = evt.data.options,
                data = evt.data,
                target_region = false,
                handle_size = true;
            evt.stopPropagation();
            var reposition = {};
            if (evt.type === 'mousemove') {
                reposition.x = evt.pageX;
                reposition.y = evt.pageY;
                $.each(data.regions, function(idx, region){
                    if(
                        evt.pageX >= region.left
                            && evt.pageX <= region.left + region.width
                            && evt.pageY >= region.top
                            && evt.pageY <= region.top + region.height
                    ){
                        target_region = region;
                        return false;
                    }
                });
            } else if (evt.type === 'keydown') {
                // remove mouse move so drag and drop stuff doesn't move all over the place if mouse
                // moved while a drag object has focus and is "grabbed"
                // TODO: event should be namespaced?
                $('html').off('mousemove', DragDrop.move);
                // prevent default tab so we can control focus as we please
                if (evt.which === pn.keyboard.tab) {
                    evt.preventDefault();
                }
                if (options.targets) {
                    // if up, left, tab with shift back to previous; other keys caught above
                    if (evt.which === pn.keyboard.up || evt.which === pn.keyboard.left
                        || (evt.which === pn.keyboard.tab && evt.shiftKey)) {
                        target_region =  (data.target_region && data.target_region.prev)
                                        || data.regions[data.regions.length - 1];
                    } else { // down, right, tab without shift advance to next
                        target_region = (data.target_region && data.target_region.next) || data.regions[0];
                    }
                } else {
                    var keyMove = {};
                    keyMove[pn.keyboard.up] = [0, -10];
                    keyMove[pn.keyboard.down] = [0, 10];
                    keyMove[pn.keyboard.left] = [-10, 0];
                    keyMove[pn.keyboard.right] = [10, 0];
                    reposition.x = data.helper.offset().left + keyMove[evt.which][0] || 0;
                    reposition.y = data.helper.offset().top + keyMove[evt.which][1] || 0;
                }
            }
            data.target_region = target_region;

            if(target_region) {
                // TODO: this seems odd - shouldn't all possible targets get a dropeffect attribute?
                // Aria docs are unclear: http://www.w3.org/TR/wai-aria/states_and_properties#aria-dropeffect
                // but it would remove need for the 'drag-target' class.
                $(options.targets).removeAttr('aria-dropeffect');
                target_region.element.attr('aria-dropeffect', 'move').focus();

                if(typeof options.over === 'function') {
                    handle_size = !options.over(target_region.element, target_region.label, data.drag_source);
                }
                if(handle_size) {
                    data.helper.css({
                        left: target_region.left,
                        top: target_region.top,
                        width: target_region.width,
                        height: target_region.height
                    });
                }
                data.helper.addClass(options.over_class);
            } else {
                if(!options.lock_x) {
                    data.helper.css({
                        left: reposition.x - data.helper_offset.x
                    });
                }
                if(!options.lock_y) {
                    data.helper.css({
                        top: reposition.y - data.helper_offset.y
                    });
                }
                data.helper
                    .width(data.options.helper_rect.width)
                    .height(data.options.helper_rect.height)
                    .removeClass(options.over_class);
            }
            restrictPosition(data.helper, options.bound);
        },

        end: function(evt) {
            var options = evt.data.options,
                data = evt.data,
                target_region = data.target_region;

            evt.stopPropagation();
            data.drag_source.attr('aria-grabbed', false);
            $.each(options.targets || [], function(idx, target) {
                // TODO: $(target.selector) is inconsistent with how target is jqueryfied in setupTargets
                $(target.selector)
                    .removeClass(options.target_class)
                    .removeAttr('aria-dropeffect');
            });
            $('html')
                .off('keydown.dnd')
                .off('mousemove', DragDrop.move)
                .off('mouseup', DragDrop.end);
            var done = function () {
                data.helper.remove();
                data.drag_source.removeClass(options.source_class);
                data.drag_source.focus();
                $('iframe').show();
            };
            if ((evt.which !== pn.keyboard.escape) // drag not cancelled
                && (!options.targets || target_region)) { // free drag or a target found
                options.drop(
                    target_region ? target_region.element : null,
                    target_region ? target_region.label : null,
                    data.drag_source,
                    data.helper);
                done();
            } else {
                if (options.animate_snapback) {
                    data.helper.animate({
                        left: data.drag_source.offset().left,
                        top: data.drag_source.offset().top
                    }, 250, 'swing', done);
                } else {
                    done();
                }
            }
        },

        // utility function for blocking selection events (saves creating an anonymous function and
        // creating closures all over the place)
        doNotDrag: function(e) {
            console.log('do not drag', e);
            return false;
        },

        /**
        Takes an element and adds logic to allow that element to be dragged.
         */
        makeDraggable: function (element, dndOptions) {
            var startPos,
                dragThreshold = 5;
            $(element)
                .attr({
                    'aria-grabbed': false,
                    tabindex: 0
                })
                .addClass('unselectable')
                .on('selectstart', function () {
                    // prevent text selection in IE
                    return false;
                })
                .on("mousedown", function (e) {
                    var $target = $(e.target);
                    if (!$target.attr("contenteditable") && $target.parents("[contenteditable]").length === 0) {
                        startPos = { x: e.clientX, y: e.clientY };
                    }
                    // prevent text selection in Firefox
                    return false;
                })
                .on("mousemove", function (e) {
                    // If the user has a mouse down, and they have moved at least a dragThreshold
                    // distance away from where they put their mouse down
                    if (startPos && (Math.abs(e.clientX - startPos.x) > dragThreshold
                                  || Math.abs(e.clientY - startPos.y) > dragThreshold)) {
                        startPos = undefined;
                        e.data = {options: dndOptions};
                        DragDrop.start(e, $(this));
                    }
                })
                .on("mouseup", function () {
                    startPos = undefined;
                })
                .on('keydown', pn.onkey(['spacebar'], function (e) {
                    e.data = {options: dndOptions};
                    DragDrop.start(e, $(this));
                }));
        }
    };
})();

jQuery.fn.drag = function(options) {
    "use strict";
    window.DragDrop.makeDraggable(this, options);
    return this;
};
 /**
    drag5 &mdash; HTML5 drag and drop
    =================================

    Requires
    --------

    jQuery
    Math.relativeCoordinate from drag-drop.js

    Notes
    -----

    __drag5__ is a wrapper for HTML5 drag and drop that (for now) ignores dataTransfer (and passes data via
    the event chain instead) and which (like DragDrop) allows the targeting of regions within or around
    target elements rather than simply elements (the classic example being dragging something between
    two other things).
    
    No longer intended to match DragDrop's API. Much simpler and more robust than DragDrop, but lacks
    some of DragDrop's interactive niceties.
    
    CSS Styles
    ----------
    
    Drag5 uses the following **classes**:
    
    *   .drag-source -- class applied to the thing initiating the drag (also affects
        the appearance of the dragged object)
    *   .drag-target -- class for drag targets (ideally only for suitable drag targets).
    *   .drag-over -- class applied to a suitable target when object is over it.
    *   .drag-temp -- class applied to dynamically create drag targets

    Drag5 also uses the following **attributes**:

    *   draggable -- any &lt;a&gt; tag is draggable by default, set draggable for anything else
    *   data-drag -- one or more space-delimited mime types (or any string not including a space) 
        representing the kind(s) of data dragged when a given element is dragged.
    *   data-drag-content -- text content that will be transferred with the drag operation. If
        nothing is supplied, default content will be chosen based on content type:
        *   text/html -- inner html of source element (will be URI decoded)
        *   anything else -- inner text, alt, title, or src attributes (in that order of precedence)
    *   data-drop -- one or more space-delimited mime types (or any string not including a space) 
        representing the kind(s) of data that can be dropped on a given element.
    *   data-drag-id -- uuid assigned to a source element when it is dragged, and passed via
        dataTransfer object with key 'id' (so it can be retrieved using dataTransfer.getId('id')
        if you need to find the source object when something is dropped.

    Notes
    -----

    data-drop should be unnecessary, but the dropzone attribute appears not to work as advertised,
    and also it's more annoying to set up, e.g. instead of data-drop="text/html" you need to 
    put in dropzone="string:text/html".
    http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#the-dropzone-attribute
    

    API
    ---
    
    drag5 exposes two key low-level functions via jQuery. These create statically
    draggable objects, and static receivers.
    
        $( selector ).drag5( contentType[, content] );
        $( selector ).drop5( contentType[, handler] );
        $( selector ).stopDrag5();
        $( selector ).stopDrop5();
    
    * **contentType** is a string (mime type or similar) or an array thereof.
    * **content** is (ideally) a string or callback function. The callback variant
      will be treated as an event handler but the event will have propagation stopped by default
      and will receive contentType as an extra parameter in case it's useful. If omitted, the
      innerHTML of the dragged element will be passed as data.
    * **handler** is a function to be called on a successful drop operation. It
      will be called as an event handler, but with propagation of the event stopped by default,
      and with the additional contentType parameter in case that's useful. If omitted, 
      whatever data is passed will be inserted into the element as HTML.
      
    ### Example
    
    The following example shows three different kinds of draggable object and 
    three different kinds of receiver, all playing nicely together.
    
        !!!
            <div id="dnd3">
                <style>
                    .html, .text, .both, .html-target, .text-target, .both-target, .custom-handler {
                        margin: 4px;
                        padding: 4px;
                        border: 1px solid #888;
                        display: inline-block;
                    }
                    .html-target, .text-target, .both-target, .custom-handler {
                        background-color: #aaf;
                    }
                    #dnd3 div span {
                        background-color: white;
                    }
                </style>
                <div class="html">Drag <b>HTML</b></div>
                <div class="html-target">Drop <b>HTML</b><span></span></div><br>
                <div class="text">Drag text</div>
                <div class="text-target">Drop Text<span></span></div><br>
                <div class="both">Drag <i>both</i></div>
                <div class="both-target">Drop Both<span></span></div>
                <div class="custom-handler">Custom Handler</div>
            </div>
            <script>
                example.find('.html').drag5('text/html');
                example.find('.text').drag5('text/plain');
                example.find('.both').drag5(['text/plain', 'text/html']);
                example.find('.html-target').drop5('text/html');
                example.find('.text-target').drop5('text/plain');
                example.find('.both-target').drop5(['text/html', 'text/plain']);
                example.find('.custom-handler').drop5(['text/html', 'text/plain'], function(e, contentType){
                    var elt = $(this);
                    $.each( contentType, function(idx, type){
                        var evt = e.originalEvent,
                            dataTransfer = evt.dataTransfer;
                        if( dataTransfer.getData(type) ){
                            elt.html("<b>Custom handler received</b>: " + dataTransfer.getData(type));
                        }
                    })
                });
            </script>
    
    TODO
    ----
    
     * replace data-drop with dropzone (and try to shim the advertised functionality in it).
     * re-implement aria compliance
     * better behavior handling drags from outside the app (e.g. initialize drag settings on dragenter) 
     * provide convenience functions for re-ordering lists, table
     * add a labelled behind the scenes context menu for better accessibility
*/

/*jslint white:true, browser: true */
/*global jQuery, console, pn */

// note that functions have been declared as variables because this allows them to lint(!)

(function(window, pn, $){
    "use strict";

    if( pn.drag5 ){
        console.error("Attempted to redefine drag5");
        return;
    }

    var setup = function( w ){
        $(w.document.body)
            .off('dragstart.drag5 dragover.drag5 dragenter.drag5 drageleave.drag5 dragend.drag5 drop.drag5')
            .on('dragstart.drag5', function(e){
                var target = $(e.target).closest('[data-drag]'),
                    evt = e.originalEvent,
                    dataTransfer = evt.dataTransfer,
                    types,
                    url,
                    id = pn.uuid();
                
                if( target.length ){
                    $(w.document.body).find('[data-drag-id]').removeAttr('data-drag-id');
                    types = target.attr('data-drag').split(' ');
                    $.each(types, function(idx, type){
                        type = type || "text/html";
                        var content;
                        if( target.attr('data-drag-content') ){
                            content = decodeURIComponent(target.attr('data-drag-content'));
                        } else {
                            if(type === 'text/html'){
                                content = target.html();
                            } else {
                                content = target.text() || target.attr('alt') || target.attr('title') || target.attr('src');
                            }
                        }
                        dataTransfer.setData(type, content);
                    });
                } else {
                    types = [];
                    target = $(e.target);
                    if(!target.is('.pn-drag5-ignore')){
                        // infer drag content for things that are draggable by default
                        url = target.prop('href');
                        if( url ){
                            types.push('url');
                            dataTransfer.setData('url', url);
                        }
                        w.dragTypes = types;
                    }
                }
                if( types.length ){
                    w.dragTypes = types;
                    dataTransfer.setData('id', id);
                    target
                        .attr('data-drag-id', id)
                        .addClass('drag-source');
                }
            }).on('dragover.drag5 dragenter.drag5 drop.drag5', function(e){
                var target = $(e.target).closest('[data-drop]'),
                    evt = e.originalEvent,
                    dataTransfer = evt.dataTransfer,
                    types,
                    available = w.dragTypes || ['url'];

                if( !target.length ){
                    return;
                }

                if( e.type !== 'drop' && target.is('.drag-over') ){
                    if( evt.preventDefault ){
                        evt.preventDefault();
                    }
                    return;
                }

                if( target.length ){
                    types = target.attr('data-drop').split(' ');
                    $.each(types, function(idx, type){
                        if( available.indexOf( type ) > -1 ){
                            if( e.type === 'drop' ){
                                target
                                    .html( dataTransfer.getData(type) || "nothing" )
                                    .removeClass('drag-over');
                            } else {
                                target.addClass('drag-over');
                            }
                            if(evt.preventDefault){
                                evt.preventDefault();
                            }
                            return false;
                        }
                    });
                }
            }).on('dragleave.drag5', function(e){
                $(e.target).closest('.drag-over').removeClass('drag-over');
            }).on('dragend.drag5', function(){
                // TODO: generalized implementation - see comment in pane.js about how this class
                // gets added to the body. Also used below in the drop handler.
                pn.wins.anywhere('body').removeClass('pn-dragging-tab');
                w.dragTypes = false;
                $('.drag-source,.drag-over').removeClass('drag-source drag-over');
            });
    };
    
    $.fn.drag5 = function(contentType, content){
        return this.each( function(){
            var elt = $(this);
            elt
                .css('cursor', 'move')
                .attr('draggable', true)
                .attr('data-drag', contentType.join ? contentType.join(' ') : contentType);
            if( typeof content === 'function' ){
                elt.on('dragstart', function(e){
                    e.stopPropagation();
                    content.call(this, e, contentType);
                });
            } else {
                elt.attr('data-drag-content', content);
            }
        });
    };
    
    $.fn.drop5 = function(contentType, handler){
        this.attr('data-drop', contentType.join ? contentType.join(' ') : contentType );
        if( typeof handler === 'function' ){
            this.on('drop', function(e){
                e.stopPropagation();
                pn.wins.anywhere('body').removeClass('pn-dragging-tab');
                handler.call(this, e, contentType);
                // odd construction to make sure it takes place in the local document
                $(this).closest('body').find('.drag-over').removeClass('drag-over');
            });
        }
        return this;
    };

    $.fn.stopDrag5 = function(){
        return this
                    .css({
                        cursor: ''
                    })
                    .removeAttr('data-drag')
                    .removeAttr('data-drag-content')
                    .removeAttr('aria-grabbed');
    };

    $.fn.stopDrop5 = function(){
        return this
                    .removeAttr('data-drop')
                    .removeAttr('aria-dropeffect');
    };
    
    pn.drag5 = {
        setup: setup
    };

    setup(window);
}(window, pn, jQuery));
/**
Patsy
=====

Patsy intercepts all jQuery ajax requests and runs them through a number of filters that may modify
the request and response. Requests that patsy filters do not explicitly handle will complete as
ordinary ajax requests, so things generally just work. If, however, you want to explicitly skip
filtering a request, you can add a truthy `pnIgnorePatsy` property to `$.ajax` options.

Getting started
---------------

To intercept ajax requests for a Pneumatic app, first create the patsy app using `pn.patsy.app`.
This assumes that the app root is one level above the page that creates it, so it will usually be
the folder name that contains the app. Relative URLs created via the app's `url` method get resolved
against that location.

    !!!
    <script>
    // App name does not matter for examples, but it must be unique
    window.demo = pn.patsy.app(pn.uuid())
    example.text(demo.url('example/url'))
    </script>

Known bugs
----------

- On post, success filters (maybe others as well) recieve response data as a string regardless of
  the response Content-Type. Possibly related: when a filter replies with a string, if a filter
  executed after expects json, this should try to convert.
- I think jsonp blows up - needs research
- Query parameters passed to a filter should be `undefined` when not provided, rather than blank.
  This change may break some TMNG patsies - look for todos in that file.
- Maybe list query parameters should be passed to filters as arrays. Now they come into filter
  comma-separated. This may be a change to `pn.nav.params,` but may break some tmng patsies. See
  todos in its patsies.
- Add a property to the filter `this` object that allows access to parameters by name, which is much
  much more convenient than the positional parameters for query params.
- Partial patsies cannot use the same pattern as a normal patsy, but that should be allowed.
- Matchers with multiple optional parameters in the url do not match as expected, so, for example,
  the url `/foo/` does not match the pattern `/foo/{}/{}`.

Execution model
---------------

Like most Web service frameworks, patsy maps url patterns to handler functions, something like this:

    GET /pets/{family}/{breed} -> getOther()
    GET /pets/canidae/{breed} -> getDogs()
    GET /pets/felidae/{breed} -> getCats()

Patsy handles this by matching urls in ajax requests against patterns and executing matching filter
functions:

    !!!
    <script>
    var getOther = function (family, breed) {
        this.reply('yertle')
    }
    var getDogs = function (breed) {
        this.reply({'collie': 'lassie', 'viszla': 'clifford'}[breed])
    }
    var getCats = function (breed) {
        this.reply({'siamese': 'rusik'}[breed])
    }

    demo.patsy
    ('pets/{family}/{breed}').on('get').filter(getOther)
    ('pets/canidae/{breed}').on('get').filter(getDogs)
    ('pets/felidae/{breed}').on('get').filter(getCats)

    $.get(demo.url('pets/canidae/collie'), function (reply) {
        example.text('The animal is ' + reply)
    })
    </script>

Ajax executions through patsy follows this series of steps:

1. Match url patterns, finding any patsies that can handle the request
2. Execute synchronous request filters
3. Execute asynchronous request filters
4. Execute reply filters

Each patsy has an associated set of filters that execute one after another in a **filter chain**,
along which any filter may reply to the request. For request filters, a reply stops further
execution of the filter chain, while a reply from a reply filter just changes the response data as
seen by further filters in the chain and, ultimately, the original requester.

The patsies shown so far match whole URL paths. The request for `pets/canidae/collie` can match both
`pets/{family}/{breed}` and `pets/canidae/{breed}`. Patsy executes filters from multiple matching
chains in order of specificity - that is, fewest parameters it must replace to make the match.

**Partial patsies** match the beginning of an URL, and are thus useful for filtering requests on
groups of URLs. This partial patsy matches any url beginning with "pets/" and uses a reply filter to
capitalize the response:

    !!!
    <script>
    demo.patsyPart('pets/').filter(function () {
        this.success = function (response) {
            this.reply(response.replace(/^./, function (c) {
                return c.toUpperCase() }))
        }
    })
    $.get(demo.url('pets/canidae/collie'), function (reply) {
        example.text('The animal is ' + reply)
    })
    </script>
*/

/*global pn*/

pn.module('patsy', function (patsy, $) {
    'use strict';
    var patsies = [];
    var chains = function (url) {
        url = urlNormalize(url).split('?')[0];
        return $.grep(patsies, function (patsy) {
            return patsy.matcher.test(url);
        }).sort(function (a, b) {
            var len = function (url) {
                // Some browsers treat backslash as forward slash in an url. No reason to be so
                // lenient here though.
                return urlSub(url, [], function () {
                    return '';
                }).split('/').length;
            };
            return len(a.pattern) - len(b.pattern)
                || url.match(a.matcher).length - url.match(b.matcher).length;
        });
    };

    var replyRepresentations = function (data) {
        // TODO: xml?
        // TODO: should not need the json representation any longer
        return typeof data === 'string' ? {text: data} : {json: data, text: JSON.stringify(data)};
    };

    (function () {
        var send = function (options, originalOptions, originalXhr, ajaxDone) {
            var finisher;
            var tryFilter = function (filter, methods, params, chain) {
                try {
                    filter.apply(methods, params);
                    (chain || $.noop)(methods);
                    return true;
                } catch (e) {
                    finisher = null;
                    methods.reply(599, e.toString());
                }
            };
            var successFilters = [], errorFilters = [];
            // Notice that finish functions use essentially the same signature as jQuery's
            // transport done function
            var finish = function (app) {
                return function (reqCode, reqDescription, reqData, reqHeaders) {
                    // TODO: does not preserve headers
                    pn.assert(!finisher, 'filter replied more than once');
                    var runningChain;
                    var altChain = function () {
                        return runningChain === successFilters ? errorFilters : successFilters;
                    };
                    var runReplyChain = function (chainCode, chainDescription, chainData, chainHeaders) {
                        var filterMethods = function (fn, pattern) {
                            return replyFilterMethods({
                                app: app,
                                ajax: options,
                                defaultCode: chainCode,
                                defaultData: chainData,
                                finish: fn,
                                override: {url: originalOptions.url},
                                pattern: pattern
                            });
                        };
                        var finishReply = function (replyCode, replyDescription, replyData) {
                            finisher = function () {
                                finisher = null;
                                if (pn.jax.success(replyCode)) {
                                    runningChain = runningChain === successFilters ?
                                        runningChain : altChain();
                                } else {
                                    runningChain = runningChain === errorFilters ?
                                        runningChain : altChain();
                                }
                                runReplyChain(replyCode, replyDescription, replyData, chainHeaders);
                            };
                        };
                        while (runningChain.length) {
                            // @jshint: creating functions here is fine because this returns immediately
                            //      where it matters
                            altChain().shift();
                            var runningFilter = runningChain.shift();
                            var methods = filterMethods(finishReply, runningFilter.pattern);
                            // TODO: correctly choose entity body by accept header
                            tryFilter(runningFilter.fn, methods,
                                [chainData[methods.accepts() || 'text'], chainCode],
                                function () {
                                    pn.assert(!(methods.success || methods.error),
                                        'cannot add reply filter from a reply filter');
                                    pn.assert(!methods.chain,
                                        'cannot chain from a reply filter');
                                    pn.assert(!(methods.suspend && !options.async),
                                        'cannot suspend filters for synchronous requests');
                                    // ignore jshint - executes immediately
                                }); 
                            // TODO: should not allow calling both reply and setting suspend?
                            if (finisher) {
                                return finisher();
                            }
                            if (methods.suspend) {
                                var suspendMethods = filterMethods(function () {
                                    finishReply.apply(this, arguments);
                                    setTimeout(function () {
                                        tryFilter($.noop, filterMethods(finishReply),
                                            [],
                                            function () {
                                                pn.assert(!(suspendMethods.success
                                                         || suspendMethods.error
                                                         || suspendMethods.chain
                                                         || suspendMethods.suspend),
                                                    'suspenders cannot add any filters');
                                            });
                                        finisher();
                                    });
                                    // ignore jshint - returns on next line
                                }, runningFilter.pattern);
                                return tryFilter(methods.suspend, suspendMethods, [suspendMethods]);
                            }
                        }
                        ajaxDone(chainCode, chainDescription, chainData, chainHeaders);
                    };
                    finisher = function () {
                        finisher = null;
                        runningChain = pn.jax.success(reqCode) ? successFilters : errorFilters;
                        runReplyChain(reqCode, reqDescription, reqData, reqHeaders);
                    };
                };
            };
            var addReplyFilters = function (methods) {
                pn.assert(!methods.suspend, 'cannot suspend from a request filter');
                var filter = function (fn) {
                    return {fn: fn || $.noop, pattern: methods.pattern};
                };
                successFilters.unshift(filter(methods.success));
                errorFilters.unshift(filter(methods.error));
            };
            (function () {
                // TODO: timeouts
                var override = {
                    data: originalOptions.data,
                    dataType: originalOptions.dataType,
                    contentType: originalOptions.contentType,
                    url: originalOptions.url || options.url
                };
                var passAlong = function (proceed) {
                    var proxyOpt = $.extend(true, {}, options, override, { pnIgnorePatsy: true,
                        beforeSend: null, success: null, error: null, complete: null,
                        dataFilter: null, statusCode: null
                    });
                    var complete = function (d, xhr) {
                        var replyData = {};
                        if (proxyOpt.dataType && d != null) {
                            replyData[proxyOpt.dataType] = d;
                        } else {
                            replyData.text = xhr.responseText;
                        }
                        proceed(xhr.status, xhr.statusText, replyData, xhr.getAllResponseHeaders());
                    };
                    $.ajax(proxyOpt)
                        .done(function (d, s, xhr) {
                            complete(d, xhr);
                        }).fail(function (xhr) {
                            complete(null, xhr);
                        }).always(function () {
                            finisher();
                        });
                };
                var asyncFilters = [];
                var asyncChain = function () {
                    var filter = asyncFilters.shift();
                    if (!filter) {
                        return passAlong(finish());
                    }
                    var proceed = finish(filter.app);
                    var run = function (done) {
                        setTimeout(function () {
                            var filterOk = tryFilter(
                                $.noop,
                                anyFilterMethods({finish: proceed,
                                    ajax: options,
                                    override: override,
                                    app: filter.app}),
                                [],
                                function () {
                                    // TODO: should allow chaining from an async filter so you can
                                    //  make a filter that runs after whole patsy filters from a
                                    //  partial patsy filter
                                    pn.assert(!methods.chain, 'cannot chain from an async filter');
                                    addReplyFilters(methods);
                                });
                            if (filterOk) {
                                done();
                            } else {
                                finisher();
                            }
                        }, 0);
                    };
                    var methods = $.extend(
                        requestFilterMethods({
                                finish: function () {
                                    proceed.apply(this, arguments);
                                    run(finisher);
                                },
                                ajax: options,
                                app: filter.app,
                                override: override,
                                pattern: filter.pattern
                        }), {
                            pass: function () {
                                run(asyncChain);
                            }
                        });
                    tryFilter(filter.fn, methods, [methods]);
                };
                (function () {
                    var url = urlNormalize(options.url);
                    var allQueryParams = pn.nav.params(url);
                    var stickies = {};
                    var runRequestFilters = function (filters, pattern, params) {
                        var nextChain = [];
                        var jumpTo;
                        $.each(filters, function (i, filter) {
                            if (jumpTo && jumpTo !== filter.name) {
                                return;
                            }
                            jumpTo = '';
                            var jump = function () {
                                jumpTo = filter.name;
                            };
                            stickies[filter.name] = stickies[filter.name] || {};
                            var methods = requestFilterMethods({
                                    finish: finish(filter.app),
                                    // TODO: sticky not available to chains
                                    sticky: stickies[filter.name],
                                    jump: function () {
                                        jump();
                                    },
                                    ajax: options,
                                    app: filter.app,
                                    override: override,
                                    pattern: pattern
                                });
                            tryFilter(filter.fn, methods, params, function () {
                                pn.assert(!(methods.chain && !options.async),
                                    'cannot chain filters for synchronous requests');
                                pn.assert(!(jumpTo && finisher),
                                    'cannot jump and reply from the same filter');
                                if (methods.chain) {
                                    nextChain.push({
                                        app: filter.app,
                                        fn: methods.chain,
                                        pattern: pattern
                                    });
                                }
                                addReplyFilters(methods);
                            });
                            jump = function () {
                                throw new Error('cannot jump from async filters');
                            };
                            if (finisher) {
                                return false;
                            }
                        });
                        return nextChain;
                    };
                    var matchedChains = chains(url);
                    $.each(matchedChains, function (i, currentPatsy) {
                        var pattern = '';
                        for (var j = i; j < matchedChains.length; j++) {
                            if (!matchedChains[j].partial) {
                                pattern = matchedChains[j].pattern;
                                break;
                            }
                        }
                        var matchedParams = url.split('?')[0].match(currentPatsy.matcher).slice(1);
                        urlSub(currentPatsy.pattern, [], function (k, v, query) {
                            if (!query) {
                                return;
                            }
                            if (allQueryParams[k]) {
                                matchedParams.push(allQueryParams[k]);
                            } else {
                                matchedParams.push('');
                            }
                        });
                        var nextFilters = runRequestFilters(
                            currentPatsy.filters, pattern, matchedParams);
                        asyncFilters = asyncFilters.concat(nextFilters);
                        if (finisher) {
                            return false;
                        }
                    });
                    if (finisher) {
                        finisher();
                    } else {
                        asyncChain();
                    }
                })();
            })();
        };
        
        $.ajaxPrefilter(function (options) {
            if (!options.pnIgnorePatsy) {
                // TODO: rename this option or get rid of it
                return 'pn.patsy';
            }
        });
        $.ajaxTransport('pn.patsy', function (options, originalOptions, originalXhr) {
            options.dataTypes.shift();
            return {
                send: function (headers, done) {
                    return send(options, originalOptions, originalXhr, done);
                },
                // TODO: not sure if this is a correct way to use abort
                abort: originalXhr.abort
            };
        });
    })();

    var urlSub = function (urlPattern, args, replacer, encode) {
        encode = encode || function (s) {
            return s;
        };
        var i = 0, query = false, hash = false;
        var parts = $.grep(urlPattern.match(/([^?#]*)(?:(\?)([^#]*))?(?:(#)(.*))?/).slice(1),
            function (part) {
                return part != null;
            });
        parts = $.map(parts, function (urlPart) {
            query = urlPart !== '#' && (query || urlPart === '?');
            hash = urlPart !== '?' && (hash || urlPart === '#');
            if (urlPart === '?' || urlPart === '#') {
                return urlPart;
            }
            var wholeSegment;
            var result = urlPart.replace(/([^\{]*)\{([^\}]*)\}([\/&]?)/g, function (unused, head, k, tail) {
                var qkey = query && head.match(/^(&)?([^=]+)=([^=]*[^&])?$/);
                var qvlead = '';
                if (query && qkey) {
                    head = qkey[1] || '';
                    qvlead = qkey[3] || '';
                    qkey = qkey[2];
                }
                pn.assert(!(query && !(qkey || k)), 'query parameters must be named');
                var v = args instanceof Array ? args[i++] : args && args[k];
                v = replacer(qkey || k, v, query);
                wholeSegment = !hash && (head && head.slice(-1) === '/' || wholeSegment);
                if (v == null && wholeSegment) {
                    tail = '';
                }
                var qlead = (qkey ? qkey : encodeURIComponent(k)) + '=';
                var qval = v == null ? '' : qvlead + encode(v);
                return head
                    + (query && qval ? qlead : '')
                    + qval
                    + (query ? qval && '&' : '')
                    + (!query && tail || '');
            });
            return query ? result.replace(/&$/, '') : result;
        });
        return parts.join('');
    };
    var urlMatch = function (a, b) {
        var replacer = function () {
            return '{}';
        };
        return urlSub(a, [], replacer).split('?')[0] === urlSub(b, [], replacer).split('?')[0];
    };
    var urlSplitToString = function () {
        return decodeURI(this.pathname + this.search + this.hash);
    };
    var urlSplit = function (url) {
        // TODO: this kind of functionality needed elsewhere - see about generalizing it
        var anchor = document.createElement('a');
        anchor.href = url;
        // For Internet Explorer
        anchor.href = anchor.href; 
        return {
            protocol: anchor.protocol,
            hostname: anchor.hostname,
            // IE adds a port even if it is default and not present in the url. This normalizes so
            // you generally get the same answer regardless of browser.
            port: ((anchor.protocol === 'http:' && anchor.port === '80' && ' ')
                || (anchor.protocol === 'https:' && anchor.port === '443' && ' ')
                || anchor.port).replace(' ', ''),
            pathname: anchor.pathname.replace(/^\/?/, '/'),
            search: anchor.search,
            hash: anchor.hash,
            toString: urlSplitToString
        };
    };
    var urlNormalize = function (url) {
        return urlSplit(url).toString();
    };
    var urlCheckLegality = function (urlPattern) {
        pn.assert(!(urlPattern.split('#')[1]), 'No hash parts allowed in patsy url pattern: ' + urlPattern);
        var query = urlPattern.split('?')[1];
        pn.assert(!(query && !query.match(/^(\{[^\}]+\})*$/)),
            'No hardcoded query parameters allowed in patsy url pattern: ' + urlPattern);
    };

    var apps = {};
    /**
    Create an application rooted at the given location. That is, the folder where a Pneumatic app's
    index.html lives.
    */
    patsy.app = function (name) {
        var root = pn.urlUtils.normalize('../' + slug(name)) + '/';
        var normurl = function (urlPattern) {
            return urlPattern.match(/^\//) ? urlPattern : root + urlPattern;
        };
        var curryPatsy = function (methods) {
            return $.extend(function () {
                return apps[root].patsy.apply(apps[root], arguments);
            }, methods);
        };
        var createPatsy = function (urlPattern, partial) {
            urlPattern = normurl(urlPattern);
            urlCheckLegality(urlPattern);
            var overwrites = $.grep(patsies, function (v) {
                return urlMatch(v.pattern, urlPattern);
            });
            if (overwrites.length) {
                throw new Error('Cannot overwrite patsy ' + overwrites[0].pattern + ' with ' + urlPattern);
            }
            var currentPatsy = {
                filters: [],
                matcher: regex(urlSub(urlPattern, [], function () {
                    return '{}';
                }).split('?')[0], partial),
                pattern: urlPattern,
                partial: partial
            };
            patsies.push(currentPatsy);
            var extender = {};
            $.each(patsy.fn, function (name, fn) {
                pn.assert(typeof fn === 'function', 'patsy extensions must be functions');
                extender[name] = function () {
                    var filter = fn.apply({
                        pattern: urlPattern,
                        url: apps[root].url
                    }, arguments);
                    pn.assert(typeof filter === 'function', 'patsy extensions must generate functions');
                    currentPatsy.filters.push({
                        app: apps[root],
                        fn: filter,
                        name: name,
                        pattern: urlPattern
                    });
                    return curryPatsy(this);
                };
            });
            return curryPatsy(extender);
        };
        /**
        Methods of patsy app objects
        ----------------------------
        */
        
        apps[root] = apps[root] || {
            /**
            Create a patsy that matches the given url pattern. The pattern should include query
            parameters, as described in the patsy app `url` function, but patsy uses only the path
            portion to match a request. Creating a patsy whose url pattern matches an existing url
            pattern is an error.

            Patsy url matches always match the entire request path and do not forgive trailing slash
            omission, so a patsy for `foo/bar/{baz}` will match a request for `foo/bar/`, but not
            for `foo/bar`. To create patterns that match the beginning section of an url, use the
            `patsyPart` function.

            The returned object, a patsy, provides the core `filter` method and any patsy extension
            methods. It may also be invoked as a function to create a new patsy, allowing the
            chaining pattern:

                !!!
                <script>
                demo.patsy
                ('pets/cyprinidae/goldfish').filter(function () {
                    this.reply('dorothy')
                })
                ('pets/pomacentridae/clownfish').filter(function () {
                    this.reply('nemo')
                })
                $.get(demo.url('pets/pomacentridae/clownfish'), function (reply) {
                    example.text(reply)
                })
                </script>
            */
            patsy: function (urlPattern) {
                return createPatsy(urlPattern);
            },

            /**
            Create a patsy that matches partial urls. The given pattern matches against the
            beginning portion of a request, so a pattern for `/root` will matches requests for both
            `/root` and `/root/branch/`.
            */
            patsyPart: function (urlPattern) {
                return createPatsy(urlPattern, true);
            },

            /**
            Construct an URL from a Patsy-style pattern. The optional parameters can be either a
            variable number of arguments that will match up to patterns in the url, an object whose
            names match to patterns, or an array matched to patterns in the url.

                !!!
                <script>
                    var write = function (str) {
                        $('<pre></pre>').text(str).appendTo(example);
                    };
                    var app = pn.patsy.app('test');
                    write(app.url('foo/{}/{}', 'hello', 'world'));
                    write(app.url('foo/{}/{}', ['goodbye', 'world']));
                    write(app.url('foo/{dude}/{who}', {dude: 'the dude', who: 'lebowski'}));
                    write(app.url('foo/{dude}?{who}', 'the dude', 'lebowski'));
                </script>

            This url-encodes the parameters and returns an absolute URL string, without the portion
            prior to the path.

            If a parameter occupies an entire segment of a path and not given in the options to use
            for interpolation, this drops that segment of the path. This makes it possible for a
            pattern like `foo/{bar}/baz`, to resolve to either `foo/baz` or `foo/x/baz`.

            If the last parameter is a function, this calls that function on each replacement, using
            its return value as the parameter value to interpolate into the url pattern, where null
            or undefined become the empty string. The replacer function receives three arguments:

            - parameter name
            - argument value
            - boolean - true if the argument is a query parameter

            When using a replacer function, this does not automatically URI-encode the returned 
            value, so the replacer should usually be sure to do so.

            A Loony Tunes character replacer might look like so:

                !!!
                <script>
                    var app = pn.patsy.app('test');
                    $('<pre></pre>').text(app.url('/hunting/{rascally}', 'rabbit',
                        function (name, value) {
                            return encodeURIComponent(
                                    name.replace(/[rl]/g, 'w')
                                    + value.replace(/[rl]/g, 'w'));
                        })).appendTo(example);
                </script>
            */
            url: function (urlPattern, params) {
                // TODO: fix bug where pn.patsy.app('test').url('#foo?bar={}{}&baz={}', 'x', 'y', 'z')
                //      makes #foo?bar=xybaz=z
                urlPattern = urlPattern || '';
                var replace = arguments[arguments.length - 1];
                var paramLen = arguments.length;
                var encode = encodeURIComponent;
                if (typeof replace === 'function') {
                    --paramLen;
                    encode = function (v) {
                        return v;
                    };
                } else {
                    replace = function (k, v) {
                        return v;
                    };
                }
                var url = urlPattern.match(/^\//) ? urlPattern : root + urlPattern;
                var args = params != null && typeof params === 'object'
                    ? params
                    : Array.prototype.slice.call(arguments, 1, paramLen);
                return urlNormalize(urlSub(url, args, replace, encode));
            }
        };
        return apps[root];
    };

    // TODO: there are a handful of other places that make slugs. Should probably expose this
    // function as a general-purpose api somewhere after considering what a good generalized
    // implementation would do.
    var slug = function (fragment) {
        return fragment.toLowerCase().replace(/[^\w]/g, '-').replace(/-+/g, '-');
    };

    var reReplacements = (function () {
        // Which characters get url-encoded during normalization depends on the browser, so figure
        // out what the current browser does.
        var result = {};
        var chars = '\\^$*+.|[]()';
        for (var i = 0; i < chars.length; i++) {
            var char = chars[i];
            var encoded = urlNormalize('/x' + char).slice(2);
            if (encoded !== char) {
                result[char] = encoded;
            }
        }
        return result;
    })();
    var regex = function (url, partial) {
        return new RegExp('^' + url.replace(/[\^\\$*+.|\[\]()]/g, function (char) {
                                        return reReplacements[char] || '\\' + char;
                                    })
                                   .replace(/\{\}/g, '([^/\\?]*)')
                          + (partial ? '' : '$'));
    };

    /**
    Filter context
    ==============

    These methods and properties are available on the `this` object for any filter, in either the
    request or reply chains.
    */

    var normalReplyArgs = function (code, data, fn) {
        if (typeof code !== 'number') {
            return fn(undefined, code);
        }
        return fn(code, data);
    };

    var anyFilterMethods = function (options) {
        var accepts = function () {
            var contentType;
            var shorthand = [
                [/application\/.*json/, 'json'],
                [/application\/.*xml/, 'xml'],
                [/text\/.*html/, 'html'],
                [/text\/.*/, 'text']];
            if (options.override.contentType) {
                contentType = options.override.contentType.match(/^\s*([^;]+\/[^;]+)/);
                contentType = contentType ? contentType[1] : options.override.contentType;
                contentType = contentType ? contentType.toLowerCase() : undefined;
                var translation = $.grep(shorthand, function (t) {
                    return t[0].test(contentType);
                })[0];
                contentType = translation ? translation[1] : contentType;
            }
            var dataType = options.override.dataType || options.ajax.dataType;
            return /^(?:put|post)$/i.test(options.ajax.type.toLowerCase())
                ? contentType || dataType : dataType;
        };
        var url = function () {
            return options.app.url.apply(null, arguments);
        };
        $.extend(url, urlSplit(options.override.url));
        // In IE 8, $.extend does not replace Function.prototype.toString
        url.toString = urlSplitToString; 
        return {
            /**
            Any filter may execute a reply, either before or after the request has completed. In
            request filters, the reply method stops execution of further request filters and starts
            the reply chain. Reply always allows the remainder of the current filter to complete
            before starting the reply chain.

            When executed from a response filter, reply can change a request from a success to a
            failure and vice versa. When doing so, it continues from the next filter on the parallel
            chain. That is, this example only executes one of the two error filters:

                !!!
                <script>
                demo.patsy('pets/felidae/tabby')
                    .filter(function () {
                        this.error = function () {
                            this.reply("I'm a teapot")
                        }
                    })
                    .filter(function () {
                        this.error = function () {
                            throw 'Never runs'
                        }
                        this.success = function () {
                            this.reply(418)
                        }
                        this.reply('cheshire')
                    })
                $.get(demo.url('pets/felidae/tabby')).fail(function (xhr) {
                    example.text(xhr.status + ': ' + xhr.responseText)
                })
                </script>

            Both arguments are optional. In request filters, `code` defaults to 200 and `data`
            to an empty string. In reply filters, the arguments default the responses recieved from
            previous replies. If provided, the responce code it should be a number that matches one
            of the standard [HTTP response codes](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html).
            Patsy automatically provides corresponding response status text.

            Data can be a string or arbitrary object. Patsy will attempt to encode or decode it as
            necessary to reply as needed to the original request and response filter expectations.

            > TODO: describe exact behavior for transcoding errors.
            */
            reply: function (code, data) {
                // Overridden for reply filters
                normalReplyArgs(code, data, function (code, data) {
                    // TODO: use empty object as reply if looking for json
                    var body = replyRepresentations(data == null ? '' : data);
                    var status = code || 200;
                    options.finish(status, patsy.httpCodes[status] || 'Unassigned', body);
                });
            },

            /**
            From asynchronous filters, indicates that the filter has completed and the filter chain
            should continue. Like `reply`, pass lets the remainder of the filter execute before
            continuing the chain. From synchronous filters, pass is a no-op.
            */
            pass: $.noop,

            accepts: function (type) {
                pn.assert(!type, 'cannot change accept type in reply filter');
                return accepts();
            },

            /**
            An object with properties analogous to `window.location`. Calling its `toString` method
            returns the portion of the URL starting with pathname as a string. The supported
            properties are:

            - protocol
            - hostname
            - port
            - pathname
            - search
            - hash

            When called as a function, this is an alias to the filter's app's `url` function; that
            is, it generates application-relative URLs.

            > TODO: there is a bug where an url like `url('#foobar')` resolved on a page `foo/bar.html`
            > will resolve to `foo/#foobar` rather than `foo/bar.html#foobar`.
            */
            url: url,

            /**
            The normalized url pattern this filter matches. In partial patsies, the generator
            function's `this.pattern` property refers to the partial patsy pattern and the filter
            function's pattern property is the next regular patsy pattern that will match the
            request, if any. If no regular patsies will match, it is the empty string.
            */
            pattern: options.pattern,

            /**
            True or false depending on whether the request is asynchronous.
            */
            async: !!options.ajax.async,

            /**
            HTTP verb, always lowercase.
            */
            verb: options.ajax.type.toLowerCase()
        };
    };

    /**
    Request filter context
    ======================

    Request filters can access these functions and properties from their `this` object. Each request
    filter receives as its arguments the parameters matched from the url pattern.
    */

    var requestFilterMethods = function (options) {
        var copy = function (arg) {
            if (arg == null) {
                return arg;
            }
            switch (typeof arg) {
                // intentional fall through to string
                case 'boolean': 
                case 'number':
                case 'string':
                    return arg;
                case 'object':
                    return arg instanceof Array ? $.extend(true, [], arg) : $.extend(true, {}, arg);
            }
        };
        var coders = {
            json: [
                function (data) {
                    return JSON.stringify(data);
                },
                function (str) {
                    return JSON.parse(str);
                }],
            text: [
                copy,
                copy
            ]
        };
        var coder = function (i) {
            return function (arg) {
                try {
                    return ((coders[accepts()] || [])[i] || copy)(arg);
                } catch (e) {
                    return arg;
                }
            };
        };
        var encoder = function () {
            return coder(0);
        };
        var decoder = function () {
            return coder(1);
        };
        var reqData = function (modified) {
            if (modified != null) {
                options.override.data = encoder()(modified);
            } else {
                var result = decoder()(options.override.data);
                return result == null ? '' : result;
            }
        };
        var baseMethods = $.extend(extensionFilterMethods(options.sticky, options.jump),
            anyFilterMethods(options));
        var accepts = baseMethods.accepts;
        return $.extend(baseMethods, {
            /**
            When called with no parameters, returns the data passed to jQuery's ajax method,
            decoded if possible. When passed a parameter, will modify the entity body as seen by
            filters further in the chain and the final passed-through request that happens when no
            filters reply.

            _Filters cannot modify the request's body by modifying this data object. Don't even try._

            This decodes the request entity body according to the value of the `accepts` function,
            if defined. Likewise, any data set by this function gets encoded. Valid encodings are:

            - json
            - xml (TODO)
            - html (TODO)
            - text

            When decoding fails, this returns the string value of the request data.
            */
            data: function () { return reqData.apply(this, arguments); },

            /**
            When called without arguments, returns the shorthand version of the request's preferred
            mime type, that is, typically, `text` or `json`. On `put` or `post` requests, this
            refers to the request's `contentType` option, falling back to the `dataType` option if
            `contentType` is not defined.

            When called with an argument, changes the request preferred mime type as seen by filters
            that execute later. When the original request did not specify a `contentType` option,
            this normalizes it to the mime type specified by the given argument. The argument may
            be one of:

            - json
            - text
            - xml
            - html

            > TODO:
            > - script and jsonp types
            > - don't lose less preferred types
            > - don't ignore `accepts` ajax option/http header
            */
            accepts: function (type) {
                // TODO: right order? Most preferred is first or last?
                var longhand = {
                    'json': 'application/json',
                    'text': 'text/plain',
                    'xml': 'application/xml',
                    'html': 'text/html'
                };
                if (type) {
                    options.override.dataType = type;
                    options.override.contentType = longhand[type] || type;
                    reqData(reqData());
                } else {
                    return accepts();
                }
            },

            /**
            Make the request to the given url, using current request options, or, if provided, the
            given options object, which is compatible with [$.ajax](http://api.jquery.com/jQuery.ajax/).
            If given options, the new options completely replace the current request options; they
            do not merge.

            > This method is hypothetical. While it seems clear that something like it should exist,
            > it is not clear without more concrete use cases whether it should behave as described.
            > In particular, should it stop the current reply chain or allow the chain to finish?
            > Should there be separate methods for the two different cases - maybe `redirect` and
            > `proxy`?
            */
            redirect: function (url, options) {
                // ignore jshint
                throw 'not implemented';
            }
        });
    };

    var replyFilterMethods = function (options) {
        var baseMethods = anyFilterMethods(options);
        var baseReply = baseMethods.reply;
        return $.extend(baseMethods, {
            reply: function (code, data) {
                normalReplyArgs(code, data, function (code, data) {
                    baseReply.call(baseMethods,
                        code || options.defaultCode,
                        data || options.defaultData.text);
                });
            }
        });
    };

    var extensionFilterMethods = function (sticky, jump) {
        return {
            /**
            Only available to extension filters, this object allows stashing request-scope data that
            other filters created by the same extension can see.
            */
            sticky: sticky,

            /**
            Only available to synchronous extension filters, this jumps to the next call to that
            extension in the chain. Jump does not cross patsies, so when executed from a partial
            patsy filter, it can jump off the end of the partial patsy's request chain, but not to
            other patsies that match the request:

                patsy.fn.alwaysJump = function () {
                    return function () {
                        this.jump();
                    };
                };
                app.patsyPart('root').filter(executes)
                    .alwaysJump().filter(neverExecutes);
                app.patsy('root/branch').filter(executes);
            */
            jump: jump
        };
    };

    /**
    Chaining properties
    ===================
    
    Setting one of these properties to a function adds that function to the associated filter chain.
    If set, each must be set to a function or a falsy value, falsy being equivalent to no-op.

    ### chain

    Allows asynchronous operations within request filters by appending the filter to the async
    request filter chain. The async filter executes in the same `this` context as a the request
    filter that appended it. The chained filter receives a single argument, the same as its `this`.

    ### success, error

    Valid within any request filter, these allow manipulating the response, be it a success or
    error code, respectively. These receive as arguments `data`, and `code`, which are the
    response's entity body and HTTP response code, respectively. Error reply filters always
    receive data as a string, but success filters receive data transcoded to the data type
    appropriate for the request.

    ### suspend

    Allows asynchronous operations within reply filters by suspending the reply filter chain until
    the suspend function calls back the function provided to it. Suspend executes with a `this`
    context that has the same methods as a normal reply filter context and must call `this.reply` to
    signal that it has completed, the same as async request filters.
    */

    /**
    Built in filters
    ================
    
    These are the standard extensions Patsy makes available.
    */

    var builtInFilters = {
        /**
        Append the given function to the patsy's synchronous filter request chain.
        */
        filter: function (fn) {
            return function () {
                var self = this;
                $.each(extensionFilterMethods(), function (name) {
                    delete self[name];
                });
                return fn.apply(this, arguments);
            };
        },

        /**
        Matches the given verbs to request verbs, case insensitive, and skips to the next `on`
        call in the filter chain if none match.
        */
        on: function (verbs) { // ignore jshint
            var pass = {};
            $.each(arguments, function (i, verb) {
                pass[verb] = true;
            });
            return function () {
                if (!pass.hasOwnProperty(this.verb)) {
                    this.jump();
                }
            };
        },

        /**
        Skips filters further in the request chain when the given condition evaluates falsy. If the
        condition is a function, this calls that function with the arguments passed to a normal 
        request filter, though not the filter `this` context.
        */
        when:  function (condition) {
            return function () {
                var pass = condition;
                if (typeof condition === 'function') {
                    pass = condition.apply(null, arguments);
                }
                if (!pass) {
                    this.jump();
                }
            };
        },

        /**
        Use a local file for data and local storage for changes to data. Currently supports the
        operations `get`, `put`, and `delete`.

        > This works, but is currently just a first approximation of how it should work in the long
        > term.
        */
        local: (function () {
            // TODO: this optimization loads only once, but make other windows not see changes
            var storage = localStorage.patsy && JSON.parse(localStorage.patsy) || {};
            return function () {
                // TODO: this extension could use some unit tests
                var deleted = {};
                var localData = function (path, save) {
                    var store = function () {
                        localStorage.patsy = JSON.stringify(storage);  
                    };
                    if (!storage[path]) {
                        storage[path] = {json: ''};
                        store();
                    }
                    var bucket = storage[path];
                    if (!save) {
                        if (bucket.deleted) {
                            return deleted;
                        }
                        return bucket.json ? JSON.parse(bucket.json) : bucket.json;
                    }
                    if (save === deleted) {
                        bucket.deleted = true;
                        store();
                        return;
                    }
                    if (save) {
                        delete bucket.deleted;
                        bucket.json = typeof save === 'string' ? save : JSON.stringify(save);
                        store();
                    }
                };
                // TODO: use sessionStorage instead of localStorage - need multi-window support
                return function () {
                    var path = this.url.pathname;
                    var maybeChain = function (req, fn) {
                        // TODO: this creates subtle differences in behavior between synchronous
                        //      and async requests... how to handle it better?
                        if (req.async) {
                            req.chain = fn;
                        } else {
                            fn(req);
                        }
                    };
                    if (this.verb === 'get') {
                        var async = this.async;
                        maybeChain(this, function (req) {
                            var localReply = localData(path);
                            if (localReply) {
                                if (localReply === deleted) {
                                    req.reply(404);
                                } else {
                                    req.reply(localReply);
                                }
                            } else {
                                if (!req.accepts() || /\.[^\/.]+$/.test(path)) {
                                    req.pass();
                                } else {
                                    var mockUrl = path + '.' + req.accepts();
                                    if (/\/$/.test(path)) {
                                        mockUrl = path + 'index' + '.' + req.accepts();
                                    }
                                    $.ajax({url: mockUrl, dataType: req.accepts(),
                                            async: async, pnIgnorePatsy: true
                                        })
                                        .done(function (data) {
                                            req.reply(data);
                                        })
                                        .fail(function (xhr) {
                                            // TODO: consider successfully returning an empty list if 
                                            //  this is a request for a mock index that does not exist.
                                            req.reply(xhr.status, xhr.responseText);
                                        });
                                }
                            }
                        });
                    }
                    if (this.verb === 'put') {
                        maybeChain(this, function (req) {
                            localData(path, req.data());
                            req.reply(200);
                        });
                    }
                    if (this.verb === 'delete') {
                        maybeChain(this, function (req) {
                            var ok = function () {
                                localData(path, deleted);
                                req.reply(200);
                            };
                            // Assume last urls segment is the id in the index
                            // TODO: should check whether the pattern looks like it has an ID at the
                            //      end, but there seems to be a bug where the pattern comes up blank
                            //      (see alerts service)
                            var tailId = path.split('/').slice(-1)[0];
                            var indexUrl = path.split('/').slice(0, -1).join('/') + '/';
                            $.ajax({url: indexUrl, async: req.async, dataType: 'json'})
                            .done(function (ids) {
                                ids = $.grep(ids, function (id) {
                                    // Coerce to string if necessary, for int ids
                                    return id != tailId; 
                                });
                                $.ajax({type: 'put', url: indexUrl, data: ids,
                                    async: req.async, contentType: 'application/json' })
                                .done(ok)
                                .fail(function (xhr) {
                                    req.reply(xhr.status, 'Failed to delete from index ' + xhr.responseText);
                                });
                            })
                            .fail(ok); // No index, but that's fine
                        });
                    }
                    if (this.verb === 'post') {
                        maybeChain(this, function (req) {
                            var create = function (ids) {
                                var id = pn.uuid();
                                ids.push(id);
                                $.ajax({type: 'put', url: path, data: ids, contentType: 'application/json'})
                                    .done(function () {
                                        // TODO: should put location in header field
                                        // TODO: better strategy for creating new ids
                                        // TODO: path must end in slash
                                        var location = path + id;
                                        localData(location, req.data());
                                        req.reply(201, {id: id, location: location});
                                    })
                                    .fail(function (xhr) {
                                        req.reply(xhr.status, 'Failed to create item ' + xhr.responseText);
                                    });
                            };
                            $.ajax({url: path, async: req.async, dataType: 'json'})
                                .done(function (existing) {
                                    create(existing);
                                })
                                .fail(function () {
                                    create([]);
                                });
                        });
                    }
                };
            };
        })(), 

        /**
        > Not implemented

        Takes a variable number of arguments indicating permissions required to access the given
        service. The three special built in permissions are are:

        - anonymous
        - authenticated
        - admin
        */
        restrict: function (permissions) { // ignore jshint
            return $.noop;
        }
    };

    patsy.fn = $.extend({}, builtInFilters);

    /**
    Mapping of HTTP response codes to messages, as defined in by [IANA's status code registry](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html),
    November 2012 version, plus a Patsy special code `599 Patsy Filter Error`, which indicates that
    a patsy filters threw an exception. Application-specific custom error codes can be added to this
    object, though patsy replies may use response codes not listed here without explicitly adding
    them.

    > While patsy replies can use any of these codes, some, such as 303, would never be visible to an
    > ordinary ajax request since the browser automatically follows the redirect. Patsy may someday
    > mimic that behavior, but currently does not, so avoid such codes for now.
    */
    patsy.httpCodes = $.extend({
        '599': 'Patsy Filter Error'
    }, {
        '100': 'Continue',
        '101': 'Switching Protocols',
        '102': 'Processing',
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '203': 'Non-Authoritative Information',
        '204': 'No Content',
        '205': 'Reset Content',
        '206': 'Partial Content',
        '207': 'Multi-Status',
        '208': 'Already Reported',
        '226': 'IM Used',
        '300': 'Multiple Choices',
        '301': 'Moved Permanently',
        '302': 'Found',
        '303': 'See Other',
        '304': 'Not Modified',
        '305': 'Use Proxy',
        '306': 'Reserved',
        '307': 'Temporary Redirect',
        '308': 'Permanent Redirect',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '406': 'Not Acceptable',
        '407': 'Proxy Authentication Required',
        '408': 'Request Timeout',
        '409': 'Conflict',
        '410': 'Gone',
        '411': 'Length Required',
        '412': 'Precondition Failed',
        '413': 'Request Entity Too Large',
        '414': 'Request-URI Too Long',
        '415': 'Unsupported Media Type',
        '416': 'Requested Range Not Satisfiable',
        '417': 'Expectation Failed',
        '422': 'Unprocessable Entity',
        '423': 'Locked',
        '424': 'Failed Dependency',
        '426': 'Upgrade Required',
        '428': 'Precondition Required',
        '429': 'Too Many Requests',
        '431': 'Request Header Fields Too Large',
        '500': 'Internal Server Error',
        '501': 'Not Implemented',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Timeout',
        '505': 'HTTP Version Not Supported',
        '506': 'Variant Also Negotiates (Experimental)',
        '507': 'Insufficient Storage',
        '508': 'Loop Detected',
        '510': 'Not Extended',
        '511': 'Network Authentication Required'
    });
});
/**
    Bind-o-matic
    ============
    
    A simple, easy-to-use, automatic data-binding system.
    
    Bind-o-matic requires _no changes_ to a data structure to render data into the DOM,
    and _almost no changes_ to data structures for "live binding" (in essence the 
    only thing it requires for live binding is for non-object values to be object
    properties &mdash; which is typically how JSON data is formatted anyway) and does 
    not impose any additional styles, names, or ids on the DOM 
    (bind-o-matic's binding is driven entirely by "data-" attributes).
 
    Usage
    -----

    **Note**: in general you should use one-way binding (data-source) unless you expect data to be mutable.
    
        pn.bindomatic.bind( data-object, dom-node-or-selector [, options] ); // bind data to node
        $( dom-node-or-selector ).bindomatic( data-object [, options] ); // as above
        pn.bindomatic.findBinding( dom-node-or-selector ); // find binding for that node
        pn.bindomatic.cleanup(); // clear all bindings to elements no longer in DOM
        pn.pindomatic.unbind(elt); // clear all bindings to **elt** (element) and its descendants
        pn.bindomatic.touch( data-object [, reference] ); // notify bindomatic of outside changes to object
        pn.bindomatic.status(); // returns usage statistics
        
        options = {
            decorators: {
                decorator_name : function( obj, member, name ){
                        // this is the DOM node
                        // obj will be the current object / row object (e.g. data)
                        // member will be the bound value (e.g. data.field.foo) -- note that
                        // a computed (function) member will have been evaluated
                        // name will be the reference (in case you need it) (e.g. ".field.foo")
                        ...
                    },
                    ...
                },
            change: function(data, ref, newValue){
                    // fired when a value changes
                    // this will be the element that triggered the change
                    // should return newValue or a substitute
                    return newValue;
                },
            deletedProperty: false // set to property name
        }
    
    Calling .bind(...) (or .bindomatic(...)) on a previously bound element will 
    completely redo the binding. In effect this is a brute-force refresh -- use this when
    you want to bind a new object to an element or have made major changes to the bound
    data-object directly.
    
    Note that when rebinding, the data parameter is optional (if not provided, the
    existing data object is refreshed into the DOM).
    
    **Note** that touch does not currently refresh repeating elements that have been
    added or removed (changes to fields in array elements will be refreshed). If you've
    manipulated an array inside a bound data object, use bind instead.
    
    Bind-o-matic uses several custom attributes:
    
    * __data-source__ creates a one-way (read-only) binding (if you simply want to bind for
      purposes of decoration, use data-source or data-source="" and the element will be
      populated with an empty string before the decorator executes.)
    * __data-bind__ creates a two-way (read/write) binding
    * __data-repeat__ uses the tag as a repeating template for a referenced array
      (or object). Tags inside the template are bound to the array element.
    * __data-repeat-add__ allows a clickable element to be used to add elements to
      a specified array element &mdash; the attribute value should be the usual 
      reference followed by a semicolon and then a JSON serialization of the new
      element, e.g. data-repeat-add="people.list;{name:"enter name",phone:""}
    * __data-repeat-delete__ allows a clickable element to delete a record. It must be
      inside a data-repeat template. If options.deletedProperty has been set then the
      row will have that property set to true, otherwise the element will simply be deleted.
    * __data-decorator__ calls the named function from the options decorator list (the element
      thus decorated needs to have a data-source and data-bind attribute).
    
    For example:
    
        !!!
        <p data-source="data.test"></p>
        <p>Edit this: <input data-bind="data.test" /></p>
        <script>
            example.append(this);
            data = { test: "hello, world" };
            pn.bindomatic.bind(data, this);
        </script>


    Note that the first part of the attribute is ignored, so "foo.bar" is the same as 
    "blah.bar" or ".bar".
    
    The idea here is that generally one will bind, say, the properties of "foo" to various
    dom nodes as foo.bar, foo.baz, foo.bar.baz &mdash; the base object passed will be "foo"
    but its name will be unknown to the binder.
    
    <code>pn.bindomatic.status();</code>
    
    Returns a status object telling you how many different bindings (and of what kinds)
    Bind-o-matic is currently dealing with.
    
    <code>pn.bindomatic.cleanup();</code>
    
    Access to cleanup() is provided to allow you to explicitly remove all references
    to elements that have been removed from the DOM &mdash; e.g. if you've just rebuilt the
    page without telling Bind-o-matic. Note that this function is internally called 
    whenever an array element is deleted, so there should never be too much cruft lying around.
    
    <code>pn.bindomatic.touch(data, &lt;data-reference-string&gt;)</code>
    
    Forces a refresh of all references to the specified element.

    Bindings
    --------

    The findBinding method returns a binding object that bindomatic uses to tie
    DOM nodes to data objects.

        {
            data: <the object>,
            elt: <jQuery wrapper of the bound element>,
            options: <copy of the options object used when bindiung>,
            template: <pristine copy of the bound DOM nodes>
        }

    A binding is generated for the initial call to bind(), and recursively
    for any data-repeat elements within the bound DOM tree. (So, if you call
    findBinding on a node inside a repeating element, you'll get a binding
    wrapped around the array, and not the top-level binding.)
    
    $(elt).findBinding() is syntax sugar for findBinding.
    
    Rebinding
    ---------
    
    When the data you've bound using bindomatic is changed externally (e.g. the user 
    enters something into a dialog box and confirms it, and now you need to change the 
    data directly, or  you call the service again and get new data) you'll need to
    do one of three things.
    
    **touch()** can be used to notify bindomatic that a scalar property has changed, and
    will publish updates to all bound interface elements (and fire off decorators, etc.)
    
    **bind()** can be used to bind the object over again -- this handles the cases where
    array elements have been added or removed independently.
    
    TODO: Both of these issues can be resolved in future when ES6 is available everywhere.
    
    The final case (where you really want to **replace the original bound data source**) 
    is the worst case and here the best approach is to:  

    * take the original bound object (if you haven't retained a reference to it, 
           you can use findBinding to get one), 
    * "hollow it out" by removing all its elements, 
    * extend it with the new data, and then 
    * use bind() to bind it again. The reason for this little dance is to not 
           destroy the original object (and its attendant references).
    
    TODO: Provide a convenience function for this operation.
    
    Iteration
    ---------
    
    One of the common tasks for database-binding is handling of iteration (i.e. lists and
    tables). The goal of Bind-o-matic is for this to be achieved without requiring a
    templating system &mdash; just bog standard HTML. As far as possible, it should be clear
    to any reasonably experienced coder exactly what is going on without reading docs.
    
    The basic structure of a repeatable template is something like a simple list.
    
    * ul
        * li (automatically generated)
    
    E.g.:
    
        !!!
        <ul class="supporting" data-source="data" />
        <script>
            example.append(this);
            var data = [ "Isabella", "Candace", "Doof" ];
            pn.bindomatic.bind(data, this);
        </script>

    > Consider also mapping structures. In HTML, `<dt/><dd/>` pairs and `<label><input/></label>`
    > could be analogous to key/value pairs in JavaScript objects.
    
    We can do something similar with table rows.
    
    * table
        * tr
            * td (automatically generated)
    
    E.g.:
    
        !!!
        <table>
            <tr data-source="data.beatles" />
            <tr data-source="data.spice girls" />
        </table>
        <script>
            example.append(this);
            var data = {
                beatles: [ "George", "Paul", "Ringo", "John", "Pete" ],
                "spice girls": [ "Posh", "Sporty", "Baby", "Ginger", "Scary" ]
            };
            pn.bindomatic.bind(data, this);
        </script>

    
    And even (more usefully) an entire table.
    
    * table
        * tr (automatic)
            * td (automatic)
    
    E.g.:
    
        !!!
        <table data-source="data.rows">
        </table>
        <script>
            example.append(this);
            var data = {
                rows: [
                    [ "George", "Paul", "Ringo", "John", "Pete" ],
                    [ "Posh", "Sporty", "Baby", "Ginger", "Scary" ]
                ]
            };
            pn.bindomatic.bind(data, this);
        </script>

    
    Note that because automatic two-way binding is implemented at object-level you cannot
    bind values (as shown above) this way.
    
    If this were regular code, the fields would be dynamically bound (check the demo).
    Also note that the binding is in no way reliant on the DOM objects having unique or
    even unusual classes, names, or ids.
    
    (While we're at it, I've added some edge cases to the example.)
    
        !!!
        <ul>
            <!-- we don't need to provide anything since we're iterating on the root -->
            <li data-repeat data-source=".text"></li>
        </ul>
        <ol>
            <li data-repeat="data"><input data-bind=".text"></span></li>
        </ol>
        <button class="break">Break Binding</button>
        <script>
            var data = [
                {
                    text: "John"
                },
                {
                    text: "Paul"
                },
                {
                    text: "George"
                },
                {
                    text: "Ringo"
                },
                {
                    text: null // show how null is handled
                },
                {
                    text: 0 // show how zero is handled
                },
                {
                    text: NaN // show how NaN is handled
                },
                {
                    // show how undefined is handled
                },
                {
                    text: {foo: "bar"} // show how incorrectly referenced object is handled
                }
            ];
            pn.bindomatic.bind(data, this);
            example.find('.break').on('click', function(evt){
                pn.bindomatic.unbind($(this).closest('div'));
            })
        </script>

    
    Or a more complex (and useful) case:
    
    * table
        * tr (repeating element)
            * td (multiple sub-elements that also get populated)
            * td
            * td
    
    Here's a very simple example of a table:
    
        !!!
        <table>
            <tr data-repeat="data">
                <th data-source="element.key"></th><td data-source="element.val"></td>
            </tr>
        </table>
        <script>
            example.prepend(this);
            var data = [
                {
                    key: "Seventeen",
                    val: 17
                },
                {
                    key: "PI",
                    val: Math.PI
                }
            ];
            pn.bindomatic.bind(data, this);
            example.find('table').on('mouseup', 'tr', function(evt){
                // obtains the row binding
                var binding = pn.bindomatic.findBinding( evt.target );
                binding.data.val += " clicked";
                pn.bindomatic.touch( binding.data );
            });
        </script>

    This example demonstrates the use of __findBinding__ to obtain a binding associated
    with a DOM node and also demonstrates the use of __touch__ to force references to 
    data to be updated.
    
    * __data-repeat__ creates an iteration of the element for each element in the array.
    
    In order to display the contents of the array element a child tag is needed.
    
    To fully support editable data structures there are two more attributes:
    
    * __data-repeat-add__ adds an element to the specified property (the text value should
      comprise a standard reference followed by a semicolon and then a JSON string
      encoding the template for the new object, e.g. 'foo.bar;{"test":17}'
    * __data-repeat-delete__ deletes the element (it needs to be inside the array
      template) or if options.deletedProperty is set, then the row's property will
      be set instead.
    
    The more complex case simply uses variations of the original attributes (data-source
    and data-bind) that are bound to the array element. Again, the first part of the
    reference (before the first period) is ignored, but should probably be something
    like "element" for clarity, e.g. data-source="element.name".
    
    __Note__: when the markup is bound the array-bound node is cloned to the binding and retained
    by the bindomatic to serve as a template. The original node is stripped down and left as
    as an invisible insertion point.
    
    Decorators
    ----------
    
    options.decorators allows you to pass a bunch of "decorator" functions to bind-o-matic
    and then call them (by name) on specific nodes when their values are set via
    data-decorator.
    
    One advantage decorators have over computed methods is that you don't need to modify 
    the bound data structure with methods. On the flip-side decorators do not (yet) handle
    propagating changes (e.g. computed setters).
    
    The decorator function is called against the data-source or data-bind node after it
    has been populated, and on a data-repeat element when it is instantiated.
    
        !!!
        <ul>
            <li data-repeat data-source=".name" data-decorator="makeBoysBlue"></li>
        </ul>
        <script>
            example.prepend(this)
            var abba = [
                { sex: "M", name: "Benny" },
                { sex: "F", name: "Anna" },
                { sex: "F", name: "Frida" },
                { sex: "M", name: "Bjorn" }
            ];
            // note that bindomatic has no idea what variables decorator observes so
            // if you wanted dynamic behavior you'd be better off using a computed property
            // (e.g. if the bandmember changes sex his/her color gets updated)
            example.bindomatic( abba, { 
                decorators: {
                    makeBoysBlue: function( bandmember ){ // the val and ref parameters aren't used
                        if(bandmember.sex === "M"){ 
                            $(this).css('color','blue');
                        }
                    }
                }
            });
        </script>
        
    Here's another example using a decorator on a data-repeat:

        !!!
        <table>
            <tr data-repeat="abba" data-decorator="makeBoysBlue">
                <td data-source=".name"></td>
            </tr>
        </table>
        <script>
            example.prepend(this)
            var abba = [
                { sex: "M", name: "Benny" },
                { sex: "F", name: "Anna" },
                { sex: "F", name: "Frida" },
                { sex: "M", name: "Bjorn" }
            ];
            // note that bindomatic has no idea what variables decorator observes so
            // if you wanted dynamic behavior you'd be better off using a computed property
            // (e.g. if the bandmember changes sex his/her color gets updated)
            example.bindomatic( abba, { 
                decorators: {
                    makeBoysBlue: function( band, bandmember ){ // the val and ref parameters aren't used
                        if(bandmember.sex === "M"){ 
                            $(this).find('td').css('color','blue');
                        }
                    }
                }
            });
        </script>
    
    Function Properties
    -------------------
    
    If a data-source or data-array ref is a function, the function will be called to
    get and, if appropriate, set values. The function may take one parameter (if
    it's read-only) or two if it is read/write:
    
    function computed_value( base [, newValue] ){ ... }
    
    When the function is called, "this" will refer to $(the-target-element), and the
    base will be the original data object or array element (so if the function resides in
    data.foo.bar, it will be data.foo, if the function is rendering a data-repeat over
    an array, this will be the current array element). newValue will be the new value 
    being set.
    
    If the function returns undefined then it is assumed to have done its job (otherwise
    the returned value will be inserted into the target element).
    
        !!!
            <p><input data-bind="data.f" /></p>
            <p data-bind="data.x"></p>
            <p data-source="data.g"></p>
            <ul>
                <li data-repeat="data.abba">
                    <span data-source="data.h" />
                </li>
            </ul>
            <script>
                example.prepend(this);
                var h = function(row){
                    this.text(row.name);
                }
                var data = {
                    abba: [
                            {name: "Frida", h:h},
                            {name: "Bjorn", h:h},
                            {name: "Benny", h:h},
                            {name: "Agnetha", h:h}
                        ],
                    x : 7,
                    f : function(data, newValue){
                            if( newValue !== undefined ){
                                data.x = newValue - 10;
                                pn.bindomatic.touch(data, "data.x");
                            } else {
                                return data.x + 10; 
                            }
                        },
                    g : function(){ 
                            $('<img/>')
                                .attr('src', 'images/schemanator.jpg')
                                .css('max-width', '100px')
                                .appendTo(this);
                        }
                }
                pn.bindomatic.bind(data, this);
            </script>

    Architecture
    ------------
    
    When you bind a data object to a DOM element:
    
    * a binding object is created to track the root-level binding,
      it also retains a clone of the bound element to serve as a template for rebinding
    * a change event handler is wired to the DOM element
    * a click event handler is wired to the DOM element
    * for each top-level data-repeat element found, a binding from the corresponding array
      element of the source object is created.
        * the template is copied to the binding
        * the template's "data-repeat" attribute is removed, as are its contents, it's hidden
          and a reference to it is kept for purposes of knowing where in the DOM to insert
          instances of the template. (I'll refer to this as the "insertion point".)
        * for each element of the array, an instance of the template is inserted before
          the insertion point and bound to that element.
    * a subscriber object is created for each read-only binding
    * a publisher object is created for each read/write binding

    Note that the data-repeat elements are converted into templates and removed from the 
    DOM before individual bindings are created (so elements inside data-repeat elements
    only get bound when an instance is inserted). By "top-level" I mean only data-repeat
    elements not contained in other data-repeat elements -- this allows nested bindings
    (to arrays contained inside elements of other arrays).
    
    These objects include references to the original data object, the exact DOM element
    bound to the property, and the exact property (within the object) bound to the element.
    
    When a publisher object is changed, all publishers and subscribers referring to the
    exact same data object and reference are updated.
    
    Arrays of primitives (numbers, strings, booleans) can only be bound using data-source
    (i.e. read only). This is because read/write binding is implemented based on objects
    being passed by reference. This is not an onerous restriction because most "real life"
    JSON packages records as objects with named properties.
    
    __Note__: ECMAScript5 will allow us to bind primitives but is not supported in IE8.
    
    Deleting an array element is currently quite messy and relies on jQuery behaving well
    when elements that already have been removed are removed. It seems to work perfectly
    well but is pretty ugly. (In essence the delete button is used to find the parent
    template, and then that template's first child is used to obtain a reference to the
    row source object. This is then used to fire off delete events for both the parent
    templates and all the child objects in no particular order, so it's perfectly possible
    for an object do be removed after its parent has already been removed. This could be
    prevented, but seems to work just fine as it is.)


    TODO
    ----
    
    * Review the console.error and console.warning feedback and make it more strict
      (e.g. missing decorators should probably throw an error, not merely spam console)
    * Refactor binding as a prototyped object. New "class" would have methods:  
        .touch(), .bind([data]) // rebinds, with new data if appropriate
    * Implement explicit "base name" parameter so that the base name is non-optional
      in a reference, and errors are reported when it isn't matched. This would also 
      propagate through data-repeat, so repeating on foo.bar would create the explicit 
      base-name "bar" which would also be non-optional.
    * Provide a convenient array-boxer (that walks through "bare" arrays and turns them
      into arrays of objects with a "value" member or similar) and corresponding unboxer.
    * Implement data-target="..." to specify where exactly a bound value goes (e.g. into
      a specified attribute vs. the default attribute or the node's content).
    * It would be nice if touch efficiently updated arrays
 */

(function(pn, $){
    'use strict';

    if( pn.bindomatic !== undefined ){
        console.error('Attempting to redefine bindomatic');
        return;
    }
    
    var bindings = [],
        subscribers = [],
        publishers = [],
        arrays = [];
        
    function cleanup(){
        // note that $.grep passes its arguments in sane order
        function filter(binding){
            return binding.elt.closest('body').length > 0;
        }  
        bindings = $.grep( bindings, filter);
        subscribers = $.grep( subscribers, filter);
        publishers = $.grep( publishers, filter);
        arrays = $.grep( arrays, filter);
    }

    function unbind(elt){
        elt = $(elt);
        if( !elt.length ){
            console.error("Asked to unbind nothing", elt);
        }
        if( elt.get(0).tagName === 'BODY'){
            throw "Cannot unbind body";
        }
        elt.first().before(elt.clone());
        elt.remove();
        cleanup();
    }
    
    var _donotupdate = {}; // unique token to prevent element from being updated
        
    function getValueByReference( target, data, reference ){
        var refParts = reference.split('.'),
            result = data,
            resultParent;
        
        refParts.shift(); // we ignore the first element!
        
        try {
            while( refParts.length ){
                resultParent = result;
                result = resultParent[ refParts.shift() ];
            }
        } catch(e) {
            result = "";
            console.error( "bindomatic getValueByReference failed for", reference, "in", data );
        }
        
        if( typeof result === 'function') {
            result = result.call( target, data );
            if( result === undefined ){
                result = _donotupdate;
            }
        }
        
        return result;
    }
    
    function setValueByReference( target, data, ref, newValue, options ){
        var refParts = ref.split('.'),
            key,
            parent = data;
        
        if( refParts.length === 1 ){
            data = newValue;
        } else {        
            refParts.shift(); // we ignore the first element!
        
            try {
                while( refParts.length > 1 ){
                    key = refParts.shift();
                    parent = parent[ key ];
                }
                key = refParts.shift();
                if( parent[key] !== newValue ){
                    newValue = options.change.call(target, data, ref, newValue);
                    if( typeof parent[key] !== 'function' ){
                        if( typeof(parent[key]) === 'number' ){
                            // TODO throw error if NaN
                            parent[key] = parseFloat(newValue);
                        } else {
                            parent[key] = newValue;
                        }
                    } else {
                        parent[key].call( target, data, newValue );
                    }
                }
            } catch(e) {
                console.error( "bindomatic setValueByReference failed for", ref, "in", data );
            }
        }
    }
    
    function getValue( target ){
        // accept either a bare DOM element, a $(elt), or a binding
        target = target.elt ? $(target.elt) : $(target);
        var result;
        switch( target[0].tagName ){
            case "INPUT":
                if ( target.attr('type') === 'checkbox' ){
                    result = target.prop('checked') ? target.val() : "";
                } else if ( target.attr('type') === 'radio' ){
                    result = target.closest("parent,body").find('input:radio[name="' + target.attr('name') + '"]:checked').val();
                } else {
                    result = target.val();
                }
                break;
            case "TEXTAREA":
                result = target.val();
                break;
            case "IMG":
                result = target.attr('src');
                break;
            case "SELECT":
                result = target.val();
                break;
            case "TABLE": // falls-through
            case "TBODY":
            case "TR":
            case "UL":
            case "OL":
                console.error("Bindomatic cannot bind containers this way", target);
                break;
            default:
                result = target.text();
                break;
        }
        return result;
    }
    
    function setValue( binding ){
        var target = $(binding.elt),
            value = getValueByReference(target, binding.data, binding.ref),
            str_value = value == null ? "" : value + "";

            if(!binding.ref){
                str_value = "";
            } else if (typeof value === 'number' && value != value){
                // test for NaN
                str_value = "";
            } else if (typeof value === 'object'){
                if( value === null ){
                    str_value = "";
                } else {
                    str_value = "OBJECT: " + JSON.stringify(value);
                    // TODO -- figure out a better way to do this or just don't bother
                    // console.warn("Bindomatic -- obj -> string", binding);
                }
            }
        
        if( value === _donotupdate ){
            return;
        }
        
        switch( target[0].tagName ){
            case "INPUT":
                if( target.attr('type') === 'checkbox' ){
                    target.prop('checked', !!value && value !== 'false' && value !== '0' && value !== 'off');
                } else if ( target.attr('type') === 'radio' ){
                    target.prop('checked', str_value === target.val() );
                } else {
                    target.val( str_value );
                }
                break;
            case "TEXTAREA":
                target.val( str_value );
                break;
            case "IMG":
                target.attr('src', str_value);
                break;
            case "TABLE": // falls-through
            case "TBODY":
                $.each(value, function( idx, rowValue ){
                    var row = $('<tr/>');
                    $.each(rowValue, function( idx, cellValue ){
                        $('<td/>')
                            .text(cellValue)
                            .appendTo(row);
                    });
                    row.appendTo(target);
                });
                break;
            case "SELECT":
                target.get(0).value = str_value;
                break;
            case "TR":
                target.empty();
                $.each(value, function( idx, item ){
                    $('<td/>').text(item).appendTo(target);
                });
                break;
            case "UL": // falls-through
            case "OL":
                target.empty();
                $.each(value, function( idx, item ){
                    $('<li/>').text(item).appendTo(target);
                });
                break;
            default:
                target.text( 
                    // safely render HTML entities
                    str_value
                        .replace(/\&[^;]+;/g, function(entity){ return $('<span>').html(entity).text(); }) 
                );
                break;
        }
        
        decorate( target, binding, value );
        
        return target;
    }
    
    function decorate( target, binding, value ){
        if( target.attr('data-decorator') ){
            try {
                var decorator_name = target.attr('data-decorator'),
                    f = binding.options.decorators[ decorator_name ];

                if(typeof f !== 'function' ) {
                    console.error( "data-decorator not found:", target.attr('data-decorator') );
                } else {
                    f.call( target, binding.data, value, binding.ref );
                }
            } catch(e) {
                console.warn( "bindomatic -- data-decorator:", decorator_name, "referencing:", binding.ref, "threw exception. ", binding);
            }
        }
    }
    
    /*
        Based on a target element that has changed, update all subscribers to its ref
    */
    function updateReferences( target, data, options ){
        var ref = target.attr('data-bind'),
            newValue;
        if (ref) {
            newValue = getValue( target );
            setValueByReference( $(target), data, ref, newValue, options );
            touch( data, ref, newValue, target[0] );
        }
    }
    
    /**
        update all references to a specified data reference
        
        if ref is undefined, all elements bound to data will be updated
        if newValue is undefined the existing value will be used
    */
    function touch( data, ref, newValue, target ){
        $.each(subscribers, function( idx, sub ){
            if( sub.data === data && (ref === undefined || sub.ref === ref) ){
                if( newValue !== undefined ){
                    sub.elt.text( newValue );
                } else {
                    setValue( sub, data );
                }
            }
        });
        
        $.each(arrays, function( idx, arr ){
            if( arr.data === data && (ref === undefined || arr.ref === ref) ){
                arr.elt.parent().find('[data-repeat-instance]').remove();
                $.each(data, function( i, rowData ){
                    buildAndBindRow( rowData, arr, data );
                });
            }
        });
        
        $.each(publishers, function( idx, pub ){
            if( target !== pub.elt[0] && pub.data === data && (ref === undefined || pub.ref === ref) ){
                setValue( pub, data );
            }
        });
    }
    
    /**
        lightweight wrapper for updateReferences enclosing a reference to data
    */
    function makePublisher( data, options ){
        return function(evt){
            var target = $(evt.target);
            updateReferences( target, data, options );
        };
    }
    
    function buildAndBindRow(data, binding, sourceArray){
        var elt = binding.template.clone();
        // hide deleted rows
        if( 
            binding.options.deletedProperty
            && data[binding.options.deletedProperty]
        ){
            return;
        }
        elt
            .removeAttr('data-repeat')
            .attr('data-repeat-instance','');
        binding.elt.before(elt);
        bind(data, elt, binding.options, sourceArray);
        decorate(elt, binding, data);
    }

    /** 
     * given an element, find its binding
     */
    function findBinding( elt ){
        var binding = false,
            node = $(elt)[0];
        
        $.each( bindings, function(idx, b){
            if( b.elt[0] === node ){
                binding = b;
                return false;
            }
        });
        
        if( !binding ){
            node = $(elt).closest('[data-source],[data-bind]')[0];
            if( !node ){
                node = $(elt).closest('[data-repeat-instance]').find('[data-source],[data-bind]')[0];
            }
            $.each( subscribers, function(idx, sub){
                if( sub.elt[0] === node ){
                    binding = sub;
                    return false;
                }
            });
        }
        
        if( !binding ){
            $.each( publishers, function(idx, pub){
                if( pub.elt[0] === node ){
                    binding = pub;
                    return false;
                }
            });
        }
        
        if( !binding && typeof elt === 'object' && elt.length ){
            binding = findRowBinding(elt);
        }
        
        return binding;
    }
    
    /**
     * given an object, find bound bindings
     */
    function findBindings( data ){
        var elements = [];
        $.each(subscribers, function(){
           if( this.data === data ){
               elements.push(this);
           }
        });
        $.each(publishers, function(){
           if( this.data === data ){
               elements.push(this);
           }
        });
        return elements;
    }
    
    /**
     *  given a repeating element, find its binding
     */
    function findRowBinding( elt ){
        var row = elt.closest('[data-repeat-instance]').any('[data-source],[data-bind]')[0],
            binding = false;
        
        $.each( subscribers, function(idx, sub){
            if(sub.elt[0] === row){
                binding = sub;
                return false;
            }
        });
        
        if( !binding ){
            $.each( publishers, function(idx, pub){
                if( pub.elt[0] === row ){
                    binding = pub;
                    return false;
                }
            });
        }
        
        return binding;
    }
    
    function handleClick( evt ){
        var target = $(evt.target),
            arrayRef,
            rowData,
            binding;

        function removeDeleted (idx, item){
            if( item.data === rowData ){
                item.elt.closest('[data-repeat-instance]').remove();
            }
        }
            
        if( target.attr('data-repeat-add') ){
            evt.stopPropagation();
            var dataArray;
            rowData = target.attr('data-repeat-add').split(';');
            arrayRef = rowData.shift();
            rowData = JSON.parse(rowData.join(';'));
            
            // TODO implement addRows once we've figured out how we want it to work
            // and refactor this code.
            $.each(arrays, function(i, a){
                if( a.data === evt.data.data && a.ref === arrayRef ){
                    dataArray = getValueByReference( target, evt.data.data, arrayRef );
                    buildAndBindRow(rowData, a, dataArray);
                }
            });
            rowData = evt.data.options.change.call(target, rowData, arrayRef, rowData);
            dataArray.push(rowData);
        }
        if ( target.attr('data-repeat-delete') !== undefined ){
            evt.stopPropagation();
            binding = findRowBinding(target.closest('[data-repeat-instance]'));
            rowData = binding.data;
            
            if( binding.options.deletedProperty ){
                rowData[binding.options.deletedProperty] = true;
            } else {
                for( var i = binding.src.length - 1; i >= 0; i-- ){
                    if( binding.src[i] === binding.data ){
                        binding.src.splice(i,1);
                    }
                }
            }
            $.each(subscribers, removeDeleted);
            $.each(publishers, removeDeleted);
            rowData = binding.options.change.call(target, rowData, binding.ref, rowData);
            cleanup();
        }
    }
    
    function bindElements( data, base, attribute, options, sourceArray, repeatable ){
        repeatable = !!repeatable;
        var list = [];
        
        base
            .any('[' + attribute + ']')
            // filter out any element that is nested inside a data-repeat
            .filter(function(){
                return $(this).parent().closest('[data-repeat]').length === 0;
            })
            .each(function( idx, elt ){
            elt = $(elt);
            var reference = elt.attr(attribute),
                    binding = {
                    data: data,
                    elt: elt,
                    ref: reference,
                    options: options
                };
            if( repeatable ){
                binding.template = elt.clone();
                // we're leaving an empty bleeding stump for purposes of knowing where to insert instances
                binding.elt = elt
                                .removeAttr('data-repeat')
                                .addClass('pn-bindomatic-insertion-point-zombie')
                                .empty()
                                .hide();
            } else {            
                setValue(binding);
            }
            if( sourceArray ){
                binding.src = sourceArray;
            }
            list.push(binding);
        });
        
        return list;
    }
    
    /**
        sourceArray is used for adding a reference to a template's binding to allow
        it to be deleted from its owner if necessary.
     */
    function bind(data, elt, options, sourceArray){
        elt = $(elt);
        options = $.extend({ 
                decorators:{},
                change: function(data, ref, newValue){ return newValue; },
                deletedProperty: false
            }, options);

        var new_arrays,
            root_binding;

        if( !elt.length ){
            throw "Cannot bind to nothing";
        }
        if( elt.get(0).tagName === 'BODY' ){
            throw "Do not bind body";
        }

        // save root-level bindings
        if( sourceArray === undefined ){
            // rebinding
            $.each(bindings, function( i, binding ){
                if( binding.elt[0] === elt[0] ){
                    // elt = binding.template.clone();
                    elt.empty().append( binding.template.clone().contents() );
                    data = data || binding.data;
                    binding.elt.replaceWith( elt );
                    // update the binding
                    binding.data = data;
                    binding.elt = elt;
                    root_binding = binding;
                    return false;
                }
            });
            // new binding
            if(!root_binding){
                root_binding = {
                    data: data,
                    elt: elt,
                    template: elt.clone(),
                    options: options
                };
                bindings.push(root_binding);
            }
            
            setTimeout( cleanup, 0 );
        }
        
        elt.on('change.bindomatic keyup.bindomatic mouseup.bindomatic', makePublisher(data, options) );
        
        // array add and delete buttons
        elt.on('click.bindomatic', {data:data, options:options}, handleClick);
        
        subscribers = subscribers.concat(bindElements(data, elt, 'data-source', options, sourceArray));
        publishers = publishers.concat(bindElements(data, elt, 'data-bind', options, sourceArray));
        new_arrays = bindElements(data, elt, 'data-repeat', options, sourceArray, true);
        
        $.each( new_arrays, function( i, binding ){
            var dataArray = getValueByReference( binding.elt, binding.data, binding.ref );
            try{
                $.each(dataArray, function( i, rowData ){
                    buildAndBindRow( rowData, binding, dataArray );
                });
            } catch(e) {
                console.warn('bindomatic -- failed to bind array ref:', binding, 'found:', dataArray);
            }
        });
        
        arrays = arrays.concat( new_arrays );
        
        return elt;
    }
    
    function status(){
        return {
            bindings: bindings.length,
            arrays : arrays.length,
            subscribers : subscribers.length,
            publishers: publishers.length
        };
    }
    
    /**
        arrayinator( obj, propertyNames )
        
        * converts properties with specified names into arrays recursively.
        * intended to sanitize output of services which return singletons as bare objects
        
        e.g. you might have a service which returns a single child as a bare object,
        but multiple children as an array of objects:
            hasOneChild = {
                    child: {name: 'Tom'} // only child
                }
            
            hasTwoKids = {
                    child: [
                        {name: 'Tom'},
                        {name: 'Sandra'}
                    ]
                }
                
        **Then**:
            arrayinator( hasOneChild, 'child' )
            
        **Produces**:
            {
                child: [
                    {name: 'Tom'}
                ]
            }
     */
    function arrayinator( obj, propertyNames ){
        if( typeof propertyNames === 'string' ){
            propertyNames = [ propertyNames ];
        }
        
        $.each( obj, function(key, val){
            if( typeof val === 'object' ){
                arrayinator( val, propertyNames );
            }
            if( propertyNames.indexOf(key) >= 0 && !$.isArray(val) ){
                obj[key] = [val];
            }
        });
    }
    
    $.fn.bindomatic = function( data, options ){
        bind( data, this, options );
        return this;
    };
    
    $.fn.findBinding = function(){
        return findBinding(this);
    };
    
    pn.bindomatic = {
        bind: bind,
        findBinding: findBinding,
        findBindings: findBindings,
        cleanup: cleanup,
        unbind: unbind,
        touch: touch,
        arrayinator: arrayinator,
        status: status
    };
}(pn, jQuery));/**
Theme
======

> Experimental. Will probably be significantly redesigned.

Easy theme switching.

To enable, add a `select` element in your page with `name=pn-theme`. The value of the select element
should match the name of a Less file in your css directory, that is, a value "polkadots" will load
"css/polkadots.less".

This considers whichever value of the selector is selected on page ready to be the default theme.

To persist theme changes, simply attach a change handler to the theme chooser select element  and
save its value as needed. When persisting theme selections, use the `pn.theme.onload` function to
retrieve the user's theme preference when the page loads.

Stylesheets load asynchronously from this function.

*/

/*global pn, less*/

pn.module('theme', function (theme, $) {
    "use strict";
    var themeChooser, defaultTheme;

    var preprocess = function (location, oncomplete) {
        var stack = function (url, parents) {
            var result = [].concat(parents);
            result.push(url);
            result.reverse();
            return result;
        };
        var imports = [];
        var recur = function (url, parents, complete) {
            var rel = function (path) {
                var result = pn.urlUtils.relativize(path, parents.slice(-1)[0]);
                return pn.urlUtils.normalize(result);
            };
            var normUrl = rel(url.match(/\.[^.\/]+$/) ? url : url + '.less');
            imports.push(normUrl);
            $.get(normUrl, function (source) {
                var lines = source.split(/\r?\n/);
                var blocks = [[]];
                var countdown = 0;
                var maybeFinish = function () {
                    if (!countdown) {
                        complete($.map(blocks, function (block) {
                            // jQuery map flattens arrays, but not recursively
                            return block;
                        }));
                    }
                };
                $.each(lines, function (i, line) {
                    var block = blocks[blocks.length - 1];
                    if (!line.match(/^@import\s+\S+\s*(\/\/.*)?$/)) {
                        if (line.match(/@import/)) {
                            console.warn('Line looks like an import, but unrecognized format:', line);
                        }
                        block.push(line);
                        return;
                    }
                    pn.assert(!line.match(/;.*;/), 'cannot handle multiple imports on one line');
                    var childUrl = line.match(/@import\s+['"]?([^'"]+)['"]?/)[1];
                    if (childUrl.match(/\.css$/)) {
                        block.push('@import "' + rel(childUrl) + '";');
                        return;
                    }
                    ++countdown;
                    blocks.push([]);
                    recur(childUrl, parents.concat([normUrl]), function (childLines) {
                        $.each(childLines, function (j, childLine) {
                            block.push(childLine);
                        });
                        --countdown;
                        maybeFinish();
                    });
                });
                maybeFinish();
            }, 'text').fail(function () {
                console.error('Error importing stylesheet ' + stack(normUrl, parents).join(' <- '));
            });
        };
        recur(location, [], function (result) {
            oncomplete(result.join('\n'), imports);
        });
    };

    var loaders = [];
    var initialized = !$('select[name=pn-theme]').length;
    /**
    Attach handlers that will fire after a theme loads. This is for things that need to wait
    until styles have been applied to compute dimensions, visibility, and so on.

    If a theme has already loaded, the handler runs immediately.

    If the page is not using a LESS-based theme, determined by whether it contains a
    `<select name ="ph-theme">`, this assumes that styling is done by a linked ordinary css
    stylesheet and therefore is immediately initialized. *This will probably change in the future,
    when we have a good way of supporting both LESS and CSS themes.*
    */
    theme.ready = function (fn) {
        loaders.push(fn);
        if (initialized) {
            fn();
        }
    };

    var initTheme = function (theme, callback) {
        theme = theme || defaultTheme;
        themeChooser.value = theme;
        var now = function () {
            return new Date().getTime(); // Date.now() only available in IE 8 when shimmed
        };
        var start = now();
        var done = function (imports) {
            console.log('Less loaded in ' + (now() - start) + " millis");
            callback(imports);
            $.each(loaders, function (i, fn) {
                fn();
            });
            initialized = true;
        };
        preprocess(theme, function (source, imports) {
            // The setTimeouts allow Internet Explorer to compile css without opening the hung
            // script dialog. The hung script dialog triggers based on number of instructions, not
            // running time: http://support.microsoft.com/default.aspx?scid=kb;en-us;175500
            var insert = function (css) {
                // String concatenation because $('<style></style>').text(...) fails on IE 8
                $('head > style.pn-theme').remove();
                $('<style class="pn-theme">' + css + '</style>').appendTo('head');
                setTimeout(function () {
                    // TODO: have flex hook up to the theme.ready, so this doesn't need to resize
                    $(window).trigger('resize');
                }, 0);
                done(imports);
            };
            var right = source.slice(source.length >> 1);
            var left = source.slice(0, right.length);
            var hashleft = md5(left);
            setTimeout(function () {
                var hashright = md5(right);
                var hash = hashleft + hashright;
                setTimeout(function () {
                    var css;
                    if( localStorage[theme + '-hash'] === hash && localStorage[theme + '-compiled'] ){
                        // We've already got one, it's verrah nice
                        console.log('Using cached CSS ' + hash);
                        insert(localStorage[theme + '-compiled']);
                    } else {
                        console.log('Parsing LESS ' + hash);
                        new less.Parser().parse(source, function (err, tree) {
                            if (err) {
                                throw err.message;
                            }
                            setTimeout(function () {
                                try {
                                    css = tree.toCSS();
                                } catch (e) {
                                    console.error(e);
                                    $('head > style.pn-theme').remove();
                                    $('body > *').not('script').remove();
                                    $('<h4>Fatal LESS Error</h4>').appendTo('body');
                                    $('<pre></pre>').text(JSON.stringify(e, null, 4))
                                        .appendTo('body');
                                    throw e;
                                }
                                // cache it for later
                                localStorage[theme + '-compiled'] = css;
                                localStorage[theme + '-hash'] = hash;
                                insert(css);
                            }, 0);
                        }, 'text');
                    }
                }, 0);
            }, 0);
        });
    };

    var onpreload;
    /**
    Calls the given function before loading the stylesheets. Use this, for example, to get a user's
    saved theme preference when first loading the page. The callback receives a single argument, a
    callback to invoke when ready, so typical use should look like so:

        theme.preload(function (done) {
            ... load user preferences ...
            done(themeName, callback);
        });

    The `themeName` parameter passed to the `done` callback may be falsy, which causes it to load
    the default theme. The second, optional, callback argument to the done function will be invoked
    after the theme has loaded. This is useful if you need to do things that only work once the
    stylesheets make some elements visible that were previously hidden, for example. That callback
    receives as an argument an array of urls imported.

    Only one handler may be specified. Calling this more than once is an error.
    */
    theme.preload = function (fn) {
        pn.assert(!onpreload, 'multiple preloaders not allowed for themes');
        onpreload = function () {
            fn(function (themeName, callback) {
                initTheme(themeName, function (imports) {
                    (callback || $.noop)(imports);
                });
            });
        };
    };

    $(function () {
        var candidate = $('select[name="pn-theme"]');
        if (!candidate.length) {
            return;
        }
        pn.assert(candidate.length === 1, 'multiple theme choosers not allowed');
        themeChooser = candidate[0];
        defaultTheme = themeChooser.value;
        if (onpreload) {
            onpreload();
        } else {
            initTheme(null, $.noop);
        }
        $(themeChooser).on('change', function () {
            initTheme(this.value, $.noop);
        });
    });
});/**
 Follow
 ========

 Attach an element

 Requires: jQuery

 TODO
 ----
 - follow on element resize as opposed to just window
 - look into using :before pseudo element instead of separate arrow div

 Will bind a position fixed follower to a target and follow
 the target around the page on resize and scroll.

 Options:

 - window - useless for now, but might eventually be used to attach
 follower to different elements other than the body
 - offset - will set how far away the follower is from the target
 and will affect the size of the arrow (in pixels)
 - placement - sets default placement and default placement order
 - n, s, e, w, ne, se, nw, sw - override default placement order
 - arrowSize - controls size of the arrow (in pixels). Passing a falsy
 will result in no arrow.
 */

/*global pn */

(function () {
    'use strict';

    pn.module('follow', function (follow, $) {
        // TODO: rewrite this so it's DRY and doesn't unnecessarily (a) create, and (b) pass back
        // a rabbit warren of closures
        function placement(settings) {
            var target = settings.target,
                follower = settings.follower,
                iframeOffset = settings.iframe ? $(settings.iframe).offset() : {top: 0, left: 0},
                iframeScrollTop = settings.iframe ? $(settings.iframe).contents().find('body').scrollTop() : 0,
                targetPos = $.extend({}, target.offset(), {
                    'top': iframeOffset.top + target.offset().top - iframeScrollTop,
                    'left': iframeOffset.left + target.offset().left,
                    'bottom': target.offset().top + target.outerHeight(),
                    'right': target.offset().left + target.outerWidth(),
                    'height': target.outerHeight(),
                    'width': target.outerWidth()
                }),
                arrowBorder = settings.arrowSize;

            return {
                'follower': {
                    'n': function () {
                        return {
                            'top': (targetPos.top - settings.offset - follower.outerHeight()),
                            'left': (targetPos.left + ((targetPos.width * 0.5) - (follower.outerWidth() * 0.5)))
                        };
                    },
                    'e': function () {
                        return {
                            'top': (targetPos.top + (targetPos.height * 0.5) - (follower.outerHeight() * 0.5)),
                            'left': (targetPos.left + targetPos.width + settings.offset)
                        };
                    },
                    's': function () {
                        return {
                            'top': (targetPos.top + targetPos.height + settings.offset),
                            'left': (targetPos.left + ((targetPos.width * 0.5) - (follower.outerWidth() * 0.5)))
                        };
                    },
                    'w': function () {
                        return {
                            'top': (targetPos.top  + (targetPos.height * 0.5) - (follower.outerHeight() * 0.5)),
                            'left': targetPos.left - settings.offset - follower.outerWidth()
                        };
                    },
                    'ne': function () {
                        return {
                            'top': (targetPos.top - settings.offset - follower.outerHeight()),
                            'left': (targetPos.right - (settings.offset * 2))
                        };
                    },
                    'nw': function () {
                        return {
                            'top': (targetPos.top - settings.offset - follower.outerHeight()),
                            'left': (targetPos.left - follower.outerWidth() + (settings.offset * 3))
                        };
                    },
                    'se': function () {
                        return {
                            'top': (targetPos.top + targetPos.height + settings.offset),
                            'left': (targetPos.right - (settings.offset * 2))
                        };
                    },
                    'sw': function () {
                        return {
                            'top': (targetPos.top + targetPos.height + settings.offset),
                            'left': (targetPos.left - follower.outerWidth() + (settings.offset * 3))
                        };
                    }
                },
                'arrow': {
                    'n': function () {
                        return {
                            'top': targetPos.top - settings.offset,
                            'left': (targetPos.left - (settings.offset * 0.5) + (targetPos.width * 0.5)),
                            'border-width': settings.offset + 'px',
                            'border-right-width': arrowBorder + 'px',
                            'border-left-width': arrowBorder + 'px'
                        };
                    },
                    'e': function () {
                        return {
                            'top': targetPos.top + (targetPos.height * 0.5) - arrowBorder,
                            'left': targetPos.right,
                            'border-width': settings.offset + 'px',
                            'border-top-width': arrowBorder + 'px',
                            'border-bottom-width': arrowBorder + 'px'
                        };
                    },
                    's': function () {
                        return {
                            'top': targetPos.top + targetPos.height,
                            'left': (targetPos.left - (settings.offset * 0.5) + (targetPos.width * 0.5)),
                            'border-width': settings.offset + 'px',
                            'border-right-width': arrowBorder + 'px',
                            'border-left-width': arrowBorder + 'px'
                        };
                    },
                    'w': function () {
                        return {
                            'top': targetPos.top + (targetPos.height * 0.5) - arrowBorder,
                            'left': targetPos.left - settings.offset,
                            'border-width': settings.offset + 'px',
                            'border-top-width': arrowBorder + 'px',
                            'border-bottom-width': arrowBorder + 'px'
                        };
                    },
                    'ne': function () {
                        return {
                            'top': targetPos.top - settings.offset,
                            'left': targetPos.right - settings.offset,
                            'border-width': 0,
                            'border-top-width': settings.offset + 'px',
                            'border-right-width': (arrowBorder * 1.5) + 'px'
                        };
                    },
                    'nw': function () {
                        return {
                            'top': targetPos.top - settings.offset,
                            'left': targetPos.left + settings.offset,
                            'border-width': 0,
                            'border-top-width': settings.offset + 'px',
                            'border-left-width': (arrowBorder * 1.5) + 'px'
                        };
                    },
                    'se': function () {
                        return {
                            'top': (targetPos.top + targetPos.height),
                            'left': targetPos.right - settings.offset,
                            'border-width': 0,
                            'border-bottom-width': settings.offset + 'px',
                            'border-right-width': (arrowBorder * 1.5) + 'px'
                        };
                    },
                    'sw': function () {
                        return {
                            'top': (targetPos.top + targetPos.height),
                            'left': targetPos.left + settings.offset,
                            'border-width': 0,
                            'border-bottom-width': settings.offset + 'px',
                            'border-left-width': (arrowBorder * 1.5) + 'px'
                        };
                    }
                }
            };
        }

        function collisions(settings) {
            var i, coords,
                win = {
                    'height': settings.window.outerHeight(),
                    'width': settings.window.outerWidth()
                },
                follower = settings.follower,
                placementDir = null,
                positions = placement(settings),
                positionOptions = settings[settings.placement],
                len = positionOptions.length;
            for (i = 0; i < len; i += 1) {
                coords = positions.follower[positionOptions[i]]();
                placementDir = positionOptions[i];
                if (coords.top < 0) {
                    continue;
                } else if (coords.top + settings.follower.outerHeight() > 0 + win.height) {
                    continue;
                } else if (coords.left < 0 || coords.left + follower.outerWidth() > 0 + win.width) {
                    continue;
                } else if (coords.left + follower.outerWidth() > 0 + win.width || coords.left + follower.outerWidth() < 0) {
                    continue;
                }

                break;
            }
            return placementDir;
        }

        function setPosition(settings) {
            var placementDir = collisions(settings);
            settings.follower.css(placement(settings).follower[placementDir]());

            if (settings.arrowSize) {
                settings.arrow.removeClass('n e s w ne nw se sw')
                    .addClass(placementDir)
                    .css(placement(settings).arrow[placementDir]());
            }
        }

        /**
         Example Usage:

             !!!
             <div style="width:400px;height:150px;position:relative;">
                <button style="position: absolute; top: 0; left: 0">Stations</button>
                <button style="position: absolute; top: 0; right: 0">All</button>
                <button style="position: absolute; bottom: 0; left: 0">To</button>
                <button style="position: absolute; bottom: 0; right: 0">Central</button>
                <div>Click to pin me to buttons</div>
             </div>
             ---
             <script>
                 follower = example.find('div>div');
                 example.find('button')
                    .on('click', function (event) {
                                pn.follow(this, follower);
                            });
             </script>


         OR

             !!!
             <div style="width:150px;height:150px;">
             This is a test!
             </div>
             ---
             <script>
             example.find('div')
             .on('click', function (event) {
                            var el = $(this);
                            $('<div>I will follow you!</div>')
                                .appendTo(example)
                                .follow(el);
                        });
             </script>
         */
        follow = function (target, follower, options) {
            var settings = {
                'window': $(window),
                'offset': 8,
                'placement': 'e',
                'n': ['n', 'ne', 'nw', 's'],
                'e': ['e', 'ne', 'se', 'w', 'nw', 'sw', 'n', 's', 'e'],
                's': ['s', 'se', 'sw', 'n'],
                'w': ['w', 'nw', 'sw', 'e', 'ne', 'se', 'n', 's', 'w'],
                'nw': ['nw', 'w', 'sw', 'n', 's', 'se', 'nw'],
                'ne': ['ne', 'e', 'se', 'n', 's', 'sw', 'ne'],
                'sw': ['sw', 'w', 'nw', 's', 'n', 'ne', 'sw'],
                'se': ['se', 'e', 'ne', 's', 'n', 'nw', 'se'],
                'arrowSize': 6
            };

            settings.target = $(target);
            settings.follower = $(follower).addClass('follower');

            if (settings.arrowSize) {
                settings.arrow = $('<div class="follower-arrow" />').prependTo(settings.follower);
            }

            settings = $.extend(settings, options);

            // Note -- deleted some code that attached events to window resize that never
            // get removed and very quickly slow application to a crawl.
            setPosition(settings);

            settings.target.on('mouseover focus', function () {
                // replaces all the voodoo designed to have followers follow something
                // as it live resizes/scrolls since:
                // a) this is not really a use-case and
                // b) it was absolutely horrible
                setPosition(settings);
                settings.follower.addClass('target-hovered');
            }).on('mouseout blur', function () {
                settings.follower.removeClass('target-hovered');
            });
            // Note -- deleted some dubious code to handle scrolling.

            return settings.follower;
        };

        $.fn.follow = function (target, options) {
            return follow(target, this[0], options);
        };

        return follow;
    });
}());
/**
jQuery any plugin
=================

.any(selector)
--------------

jQuery's find method only searches the children of a matched group. Since you often want to search
both the children and the top level of the matched set, this gives you a method to do so. Calling
`node.any(selector)` is exactly equivalent to `node.find(selector).addBack(selector)`.

*/

(function ($) {
    "use strict";
    $.fn.any = function (selector) {
        return this.find(selector).addBack(selector);
    };
})(jQuery);
/**
Accessibility
-------------

This module automatically creates ugly outlines for data elements that need labels,
including input, textarea, select controls, and also buttons without text and images
without alt tags.

Examples of bad practices this module automatically detects:

    !!!
    <input><br>
    <label><input></label><br>
    <button style="width: 60px; height: 20px;"></button><br>
    <select><option>one</option><option>two</option></select><br>
    <textarea>This textarea has no caption</textarea><br>
    <img src="images/schemanator.jpg"><!-- no alt text --></img>

And the remedies are simple:

    !!!
    <label>Caption <input></label><br>
    <button>Caption</button><br>

If you know that your element does not need a caption, just add a `data-no-label-needed`
attribute to it. **Do not do this** if in doubt, you *do* need a label.

    !!!
    <input data-no-label-needed><br>

Some selected useful [ARIA attributes](http://www.w3.org/TR/wai-aria/states_and_properties)...

- `aria-grabbed` indicates that something is draggable, and also the condition of being dragged
- `aria-dropeffect` indicates a drop target for dragging, and what happens when you drop on that
  target

This also watches for any focus change events on the page and, if the target is an input directly
inside a label, gives the label a `pn-focus` class so that the label can be targetted and outlined
with CSS.

*/

pn.module('aria', function (aria, $) {
    "use strict";
    /**
    Generate a unique ID for the label node, and assign the [aria-labelledby attribute](https://developer.mozilla.org/en-US/docs/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-labelledby_attribute)
    to the content to associate it with the label node. Using a label element that already has an
    ID is an error.

    Also available as a jQuery plugin providing methods `.aria().labelFor(content)`, and
    `.aria().labelBy(label)`.

    */

    function createLabelId(content, label) {
        var id = pn.uuid();
        if (label[0].tagName === 'LABEL') {
            label.attr('for', id);
            content.attr('id', id);
        } else {
            label.attr('id', id);
            var labelBy = (content.attr('aria-labelledby') || '') + ' ' + id;
            content.attr('aria-labelledby', labelBy);
        }
    }

    aria.label = function (content, label) {
        label = $(label);
        content = $(content);
        label.each(function (i, labelElt) {
            createLabelId($(content[i]), $(labelElt));
        });
    };
    
    $.fn.aria = function () {
        var self = this;
        return {
            labelFor: function (content) {
                pn.aria.label(content, self);
                return self;
            },
            labelBy: function (label) {
                pn.aria.label(self, label);
            }
        };
    };

    // Monitor dom for low hanging accessibility issues.
    setInterval(function () {
        // highlights inputs in the dom that don't have a label.
        $('input,textarea,select').each(function () {
            var input = $(this);
            if (!input.is('[data-no-label-needed]') && input.parent().closest('label').text() === '') {
                var id = input.attr('id');
                if (!id || !$('label[for="' + id + '"]').length) {
                    input.css('border', '3px dashed red');
                }
            }
        });
        // highlight buttons without descriptive text.
        $('button').each(function (i, button) {
            var btn = $(button);
            var child = btn.children();
            if (!btn.text() && !child.attr('data-source')) {
                $(btn).css('border', '3px dashed red');
            }
        });
        // warn for any images without an alt attribute.
        $('img').each(function (i, img) {
            if (!$(img).attr('alt')) {
                $(img).css('border', '3px dashed red');
            }
        });
    }, 2000);

    (function () {
        // TODO: should have a focus stack, for returning focus after, e.g. closing a popup
        var priorFocus = $();
        $(document).on('focusout', function () {
            priorFocus.removeClass('pn-focus');
        });
        $(document).on('focusin', function (event) {
            var label = $(event.target).parent('label');
            if (label.length) {
                label.addClass('pn-focus');
                priorFocus = label;
            }
        });
    })();
});
/*global pn */
pn.module('nav', function (nav, $) {
    'use strict';
    /**
    Navigation
    ==========

    This module facilitates use of links and urls on a single-page webapp. It adds some conventions
    to the hash part of the url to enable easy linking between pseudo-pages and parameters storage
    in the url. Pneumatic app URLs follow this structure:

        #[context]?[params]^[snippets]^[layout]

    Within snippets, links would **not* normally be in this format; rather, they should use the
    simpler linking facilities of linking directly to a context, that is, a layout of multiple
    snippets, or linking to a particular snippet:

    - `#context?global=x` links to a layout, with a global parameter all snippets in that layout
      receive
    - `#foo.html?local=y` links to a snippet, opening the snippet in the present layout

    TODO
    ----

    > Not necessarily things that need fixing in this module, but a list of pane/flex/snippet quirks
    > all related to layout and navigation

    - Window family associations get lost or duplicated on refresh

    ### View linking TODO

    - Links to multiple views are klunky (test project nav)
    - "Dynamic links," that is, target can change (evidence, case contents)
    - Targeting a pane (resource center wants to open as a nav bar)
    - Targeting a window (pane map, history link in toolbox)
    - Snippet-local params passing to a layout link (new office action snip needs params not
      relevant to others)
    - Large amounts of data to snippet (usp from selection)
    - Background tab (?)

    */

    var hash = function (location) {
        // Firefox decodes window.location.hash, making it unreliable.
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=483304
        var content = location.href.split('#').slice(1).join('#');
        return content ? '#' + content : '';
    };

    (function () {
        var encode = function (value) {
            if (value == null) {
                return value;
            }
            var json;
            switch (typeof value) {
                case 'boolean':
                case 'number':
                case 'string':
                    return encodeURIComponent(value);
            }
            try {
                json = JSON.stringify(value);
                // Leading colon marks encoded json
            } catch (e) {
                // Ignore since this should drop parameter types it doesn't understand
            }
            return json ? ':' + encodeURIComponent(json) : null;
        };
        var decode = function (value) {
            if (/^:/.test(value)) {
                return JSON.parse(decodeURIComponent(value.slice(1)));
            }
            return decodeURIComponent(value);
        };

        /**
        Encode or decode context parameters in an url. Context parameters come after the hash but
        before the second hash. If given a string argument, this decodes the string to an object
        containing parameters. If given an object, this encodes the object to URL parameters.

        The given object format is compatible with the onsubmit object from [pn.forms](#api/form).

            !!!
            <pre></pre>
            <pre></pre>
            ---
            <script>
                example.find('pre').first().text('Decoded: '
                    + JSON.stringify(
                        pn.nav.params('#context?foo=bar&bar=baz'),
                        null, 4));

                example.find('pre').last().text('Encoded: '
                    + pn.nav.params({foo: 'bar', bar: 'baz'}));
            </script>

        Encoding and decoding is not symmetric; it loses type information. So, for example, the
        JavaScript value `true` would encode to "true" and decode as the string `"true"` and an
        array of one element, become a single string value.

        This encodes primitives as their ordinary string representation. Arrays and objects become
        their JSON-serialized representation, if possible, otherwise they get dropped. Null and
        undefined become nothing.

        When serializing an object, this produces the string with parameters ordered by key, so
        output can be reliably compared for equality.
        */
        nav.params = function (params) {
            params = (params == null) ? nav.parts().params : params;
            if (typeof params === 'string') {
                var raw = params.match(/\?/) ? params.split('?').slice(-1)[0].split('#')[0] : params;
                var result = {};
                $.each(raw.split('&'), function (i, v) {
                    var kv = v.split('=');
                    if (kv.length === 2) {
                        result[decode(kv[0])] = decode(kv[1]);
                    }
                });
                return result;
            } else {
                var keys = $.map(params, function (v, k) {
                    return k;
                });
                keys.sort();
                return $.grep(
                    $.map(keys, function (k) {
                        var encoded = encode(params[k]);
                        return encoded == null ? null : encode(k) + '=' + encoded;
                    }), function (v) {
                        return v != null;
                    })
                .join('&');
            }
        };
    })();

    /**
    **Deprecated**. Given an array of snippet URLs, such as produced by [pn.snip.url](#api/snip),
    produce an URL suitable for use as an href to open those snippets.
    */
    nav.snipsUrl = function (urls) {
        urls = $.map(urls, function (url) {
            return url.replace(/[^#]*#/, '');
        });
        return '#pn-snips:' + encodeURIComponent(JSON.stringify(urls));
    };

    (function () {
        var prefix = function (str, value, conditions) {
            // Prefix prepended to value if value or conditions are truthy, otherwise, empty string
            return conditions ? str + (value || '') : '';
        };
        var partsToString = function () {
            var snips = this.snips || [];
            return prefix('#', this.context, this.context || this.params || snips.length || this.layout)
                + prefix('?', this.params, this.params)
                + prefix('+', snips.join('+') + '+' + (this.layout || ''), snips.length || this.layout);
        };
        /**
        Parse an url or url segment following a Pneumatic url pattern into its parts, returning an
        object for convenient reference; the parts object's `toString` method encodes it for use in
        an url.

            !!!
            <pre></pre>
            ---
            <script>
                example.find('pre').text(JSON.stringify(
                    pn.nav.parts('#path?x=y#layout'),
                    null, 4));
            </script>

        If omitted, the `url` parameter defaults to current window location.
        */
        nav.parts = function (url) {
            url = (url == null) ? window.location.href : url.toString();
            var snipMatch;
            // TODO: remove pn-snips business
            if (!/^[^#]*#pn-snips:/.test(url)) {
                // TODO: link to multiple snippets by something like foo.html^bar.html
                snipMatch = url.match(/^[^#]*#([^+#?]*\.html?(?:\?.*)?)/i);
                //                              ^ hash         ^ snip params
            }
            if (snipMatch) {
                return {
                    context: '',
                    params: '',
                    layout: '',
                    snips: [snipMatch[1]],
                    toString: partsToString
                };
            }
            var oldStyle = url.match(/^[^#]*(?:#([^#?]*))(?:\?([^#]*))?(?:#(.*))$/);
            //                                 ^ context    ^ params      ^ layout
            var match = oldStyle
                ? oldStyle
                : url.match(/^[^#]*(?:#([^+?]*))?(?:\?([^+]*))?(?:\+(.*))?$/);
            //                        ^ context     ^ params      ^ snips, layout
            var tail = match[3] || '';
            var result = {
                context: match[1] || '',
                params: match[2] || '',
                snips: oldStyle ? [] : tail.split(/\+/g).slice(0, -1),
                layout: oldStyle ? tail : tail.split(/\+/g).slice(-1)[0] || '',
                toString: partsToString
            };
            if (/^pn-snips:/.test(result.context)) { // TODO: remove
                console.warn('pn-snips:... link format is deprecated');
                result.snips = JSON.parse(decodeURIComponent(result.context.replace(/^pn-snips:/, '')));
                result.context = '';
            }
            return result;
        };
    })();

    (function () {
        var ownHash;
        var goTo = function (newHash) {
            ownHash = newHash;
            window.location.hash = newHash;
        };
        var switchTo = function (newHash) {
            ownHash = newHash;
            if (newHash) {
                // Check that hash actually exists, because if it is blank, window.location.replace
                // reloads the page.
                window.location.replace(newHash);
            }
        };

        /**
        Write the current application layout to `window.location`, the historic argument, if truthy,
        makes a browser history change. If falsy, no history gets created, that is, back button will
        not consider this a step in history.

        Ordinary back button behavior treats these as historic events:

        - Opening one or more views in the flex
        - Closing a tab
        - Switching between application contexts

        Notice that clicking normal anchor tags should be the ordinary way of doing any of these
        actions.
        */
        nav.flushLayout = function (historic) {
            var parts = pn.nav.parts();
            var app = pn.application();
            parts.layout = app.layout.serialize();
            parts.snips = app.layout.snippets();
            if (!parts.layout) {
                // TODO: why do we need this check - its omission has two mysteriously causes
                //      tmng, but not test, to lose layout state upon refresh
                return;
            }
            (historic ? goTo : switchTo)(parts.toString());
        };

        var leaveHandlers = [];
        $(window).on('beforeunload', function () {
            // Beware: no automated tests for this
            var messages = [];
            $.each(leaveHandlers, function (i, handler) {
                var message = handler();
                if (message) {
                    messages.push(message);
                }
            });
            if (messages.length) {
                return messages.join('\n');
            }
        });
        /**
        Add a callback that will fire when the user navigates away from the current layout. The
        handler can return a truthy value to cancel navigation; anything falsy lets navigation
        proceed. When leaving the application, these handlers will be subject to the restrictions of
        [onbeforeunload](https://developer.mozilla.org/en-US/docs/Web/API/Window.onbeforeunload).
        **Remember that just because you can cancel navigation does not mean that you should.** It's
        usually better to save state while the user works.

        > TODO: there should be some way to remove a handler, if, for example, you set it up to
        >       save a specific snippet state, but then close that snippet
        >
        > TODO: there's no way to put up, say, a confirmation dialog. One nice way might be to allow
        >       the handler to cancel the navigation, but give it a callback it can invoke if it
        >       wants the navigation to continue.
        */
        nav.onleave = function (fn) {
            leaveHandlers.push(fn);
        };

        // priorParts does **not** track history, it is used only to restore context when navigating
        // forward to a snippet link and to cancel layout changes
        var priorParts = nav.parts();

        var goLayout = function () {
            var parts = pn.nav.parts();
            var app = pn.application();
            var serialize = function () {
                parts.layout = app.layout.serialize();
                // TODO: will soon not need this check for old layouts
                parts.snips = app.layout.snippets();
                priorParts = parts;
                switchTo(parts.toString());
            };
            if (parts.snips.length && parts.layout) {
                app.layout.restore(parts.snips, parts.layout);
            } else if (parts.snips.length) {
                $.extend(parts, {
                    context: priorParts.context,
                    params: priorParts.params
                });
                // When prior context and params were empty, parts.toString() is blank, causing
                // the page to reload rather than fire a hashchange. This happens in the tutorial
                // live example projects.
                // TODO: figure out how to write a test for parts.toString() returning blank
                switchTo(parts.toString() || '#');
                app.layout.loadSnippets(parts.snips);
                serialize();
            } else if (parts.layout) {
                // TODO: if restoring the layout blows up, would be best to just drop it and try to
                //       load the default layout for that application context
                app.layout.restore(parts.layout);
                serialize();
            } else {
                for (var i = 0; i < leaveHandlers.length; i++) {
                    if (leaveHandlers[i]()) {
                        // TODO: consider whether the location should get replaced before running
                        //      leave handlers, so they still see the location in the state it was
                        //      before navigation started
                        switchTo(priorParts.toString());
                        return;
                    }
                }
                leaveHandlers = [];
                app.provideLayout(parts.context, function (layout) {
                    if (typeof layout === 'string') {
                        // TODO: check if the redirect does not change hash?
                        window.location.replace(layout);
                    } else {
                        app.layout.loadLayout(layout);
                        serialize();
                    }
                });
            }
        };
        $(document).ready(goLayout);
        $(window).on('hashchange', function () {
            if (hash(window.location) === ownHash) {
                return;
            }
            goLayout();
        });
    })();

    return nav;
});
/**
 Keyboard
 ========

 Helpers to handle keyboard events more sanely.

 Requires: jQuery

 Contains:
 - a map of commonly used keys that can be referred to in plain English
 - an onkey helper for filtering out when a keydown handler should not be fired.
*/

/*global pn*/

(function () {
    'use strict';

    var keymap = {
        "backspace": 8,
        "tab": 9,
        "enter": 13,
        "shift": 16,
        "ctrl": 17,
        "alt": 18,
        "pause/break": 19,
        "caps lock": 20,
        "escape": 27,
        "space": 32,
        "spacebar": 32,
        "page up": 33,
        "page down": 34,
        "end": 35,
        "home": 36,
        "left": 37,
        "left arrow": 37,
        "up": 38,
        "up arrow": 38,
        "right": 39,
        "right arrow": 39,
        "down": 40,
        "down arrow": 40,
        "insert": 45,
        "delete": 46,
        "0": 48,
        "1": 49,
        "2": 50,
        "3": 51,
        "4": 52,
        "5": 53,
        "6": 54,
        "7": 55,
        "8": 56,
        "9": 57,
        "a": 65,
        "b": 66,
        "c": 67,
        "d": 68,
        "e": 69,
        "f": 70,
        "g": 71,
        "h": 72,
        "i": 73,
        "j": 74,
        "k": 75,
        "l": 76,
        "m": 77,
        "n": 78,
        "o": 79,
        "p": 80,
        "q": 81,
        "r": 82,
        "s": 83,
        "t": 84,
        "u": 85,
        "v": 86,
        "w": 87,
        "x": 88,
        "y": 89,
        "z": 90,
        "left window key": 91,
        "right window key": 92,
        "select key": 93,
        "numpad 0": 96,
        "numpad 1": 97,
        "numpad 2": 98,
        "numpad 3": 99,
        "numpad 4": 100,
        "numpad 5": 101,
        "numpad 6": 102,
        "numpad 7": 103,
        "numpad 8": 104,
        "numpad 9": 105,
        "multiply": 106,
        "add": 107,
        "subtract": 109,
        "decimal point": 110,
        "divide": 111,
        "f1": 112,
        "f2": 113,
        "f3": 114,
        "f4": 115,
        "f5": 116,
        "f6": 117,
        "f7": 118,
        "f8": 119,
        "f9": 120,
        "f10": 121,
        "f11": 122,
        "f12": 123,
        "num lock": 144,
        "scroll lock": 145,
        "semi-colon": 186,
        "equal sign": 187,
        "comma": 188,
        "dash": 189,
        "period": 190,
        "forward slash": 191,
        "grave accent": 192,
        "open bracket": 219,
        "back slash": 220,
        "close braket": 221,
        "single quote": 222
    };

    pn.module('keyboard', function (keyboard, $) {

        /**
        Map containing plain english references to the following keys:

        - enter
        - tab
        - escape
        - spacebar, space
        - left
        - up
        - right
        - down
        - delete
        - backspace
        - shift
        - ctrl
        - alt
        - home
        - end
        - pagedown
        - pageup
        - f9

        Example Usage:

            !!!
            <script>
                var keycode = pn.keyboard.enter;
            </script>

        */
        keyboard = $.extend({}, keymap);

        /**
        Creates an event handler that will call
        the next function when down, right or tab
        without shift are pressed; and the previous
        function when up, left or tab + shift are pressed

            !!!
            <ul class="tabbable-collection">
                <li>First</li>
                <li>Second</li>
                <li>Third</li>
            </ul>
            ---
            <script>
                example.find('.tabbable-collection li').attr('tabindex', 0)
                    .on('keydown', pn.keyboard.nav(function (event) {
                        console.log('test');
                        $(this).next().focus();
                    }, function (event) {
                        $(this).prev().focus();
                    }));
            </script>

        */
        keyboard.nav = function (nextFn, prevFn) {
            return function (event) {
                if (event.which === keyboard.down || event.which === keyboard.right) {
                    nextFn.call(this, arguments);
                    return false;
                } else if (event.which === keyboard.up || event.which === keyboard.left) {
                    prevFn.call(this, arguments);
                    return false;
                }
            };
        };

        return keyboard;
    });

    pn.module('onkey', function (onkey, $) {

        /**
        Filters out key pressed for a keydown handler that will only fire when
        the key that was pressed is included in array of key codes that is passed
        as the first arugument. noBubble is an optional param which will filter out events
        that are bubbled up through child elements.

        The array will convert plain English string names of commons keys. As documented
        in the keyboard module. 

        Example Usage:

            !!!
            <button>Focus on me and hit enter/return!</button>
            <div></div>
            ---
            <script>
                example.find('button').on('keydown', pn.onkey(['enter'], function (e) {
                    example.find('div').text('test');
                }));
            </script>


        Example with bubbling:

            !!!
            <div class="outer" tabindex="0">Outer node - focus me and hit enter<button>Focus on me and hit enter/return!</button></div>
            <div></div>
            ---
            <script>
                example.find('div.outer').on('keydown', pn.onkey(['enter'], false, function (e) {
                    example.find('div').last().append('test');
                }));
            </script>

        Example with bubbling disabled:

            !!!
            <div class="outer" tabindex="0">Outer node - focus me and hit enter<button>Focus on me and hit enter/return!</button></div>
            <div></div>
            ---
            <script>
                example.find('div.outer').on('keydown', pn.onkey(['enter'], true, function (e) {
                    example.find('div').last().append('test');
                }));
            </script>

        */
        onkey = function (keylist, noBubble, handler) {
            // check for optional noBubble param.
            if (typeof noBubble === 'function') {
                handler = noBubble;
                noBubble = undefined;
            }
            return function (event) {
                var el = this,
                    // for iterator below
                    i,
                    // cache keyList length
                    len;
                // if noBubble is true, ignore events from child elements.
                if (noBubble && event.target !== el) {
                    return true;
                }
                // don't do this stuff for non-key events
                if (/keydown|keypress|keyup/.test(event.type)) {
                    if (keylist && keylist instanceof Array) {
                        for (i = 0, len = keylist.length; i < len; i += 1) {
                            keylist[i] = keymap[keylist[i]] || keylist[i];
                        }
                    }

                    // do nothing - keydown-ed key not in keyList
                    if ($.inArray(event.which, keylist) < 0) {
                        return true;
                    }
                }

                return handler.apply(el, arguments);
            };
        };

        return onkey;

    });
}());
/**
 * jsonPath
 * ========
 * 
 * > This module is experimental.
 *
 * Simple query system for complex json structures
 *
 * To allow for things like periods and square parens in property names use ^ as an escape character
 * (using "\" in JavaScript is a pain in the ass).
 */

/*global pn, console */

(function(pn){
    "use strict";

    if(pn.jsonPath){
        console.error('Attempted to redefine jsonPath');
    }

    function jsonPath(obj, selector) {
        var v, sub_selector;

        if( selector && typeof selector === "string" ){
            // simple parser to allow for escape character "\"
            console.log( "parsing", selector );
            var parts = [],
                part = "";
            while( selector.length > 0 ){
                if( selector[0] === "^" && selector.length > 1){
                    console.log("escaped character", selector.substr(1,1));
                    part += selector.substr(1,1);
                    selector = selector.substr(2);
                } else if( selector[0] === "." ){
                    if(part){
                        parts.push(part);
                        part = "";
                    }
                    selector = selector.substr(1);
                } else if( selector[0] === "[" && selector.indexOf("]") >= 0) {
                    if(part){
                        console.log(part);
                        parts.push(part);
                        part = "";
                    }
                    parts.push(parseInt(selector.substr(1), 10));
                    selector = selector.substr(selector.indexOf("]") + 1);
                } else {
                    part += selector[0];
                    selector = selector.substr(1);
                }
                console.log(part);
            }
            if( part ){
                parts.push(part);
            }
            console.log(parts);
            selector = parts;
        }

        if(!selector || selector.length === 0) {
            v = obj;
        } else {
            sub_selector = selector.shift();
            v = jsonPath(obj[sub_selector], selector);
            console.log(v, sub_selector, selector);
        }
        return v;
    }

    pn.jsonPath = jsonPath;
}(pn));/**
    Editor
    ======

    Intentionally minimal __rich text editor__. There are plenty of rich text editors
    out there (e.g. CKEditor, TinyMCE, and Redactor.js) but we have found all lacking
    in terms of the ability to fine-tune the handling of edits (e.g. when block elements
    are merged by deleting text across a boundary) and the behavior of UI widgets (e.g.
    all of them fail to correctly reflect the current text selection in the states of
    their toolbar icons).
    
    See **Editor Common Controls** for docs and examples on individual controls.

    Notes
    -----

    When you make a node editable, a new editor (iframe) is inserted below it,
    and the node is hidden.

    The node gains the class "editor-target" (which hides it), while the iframe
    is placed in a div with the class editor. Saving simply copies the html back
    from the editor, removes the class, and removes the editor.

    Like all these editors, much of the work is done by the mysterious
    execCommand function in the browser. This functionality is very simple and
    robust, and we should easily be able to add anything much users want,
    although we should probably draw the line somewhere and simply swap in an
    existing solution.

    > ### Aside

    > You should look at styleSpan to see how we leverage execCommand to do more
    > complex styling. styleBlocks uses a simpler mechanism for applying paragraph
    > level styles.

    [Good documentation of these built-in DOM editing
    capabilities](http://help.dottoro.com/larpvnhw.php).

    If you set iframe to false then the specified node itself is made
    contentEditable. Aside from that it works much like the iframe case.

    Usage
    -----

    Make some block element editable:

        $(some_selector).editor({ settings_object });

    Obtain a reference to a previously created editor object:

        var myEditor = $(some_selector).editor();

    By default, the editor will be embedded in an iframe inserted next to the selected
    target (which will be hidden until the editor is "saved". It may in many cases be
    easier to make an element editable in situ...

    Make the same block editable directly (i.e. not in an iframe):

        $(some_selector).editor({iframe: false});

    Other useful functions:

        $(some_selector).editor().content(); // returns html inside editor
        $(some_selector).editor().insert(html_or_nodes); // currently appends...

    ### Settings

    Here are the default editor settings:

        {
            width : 400,
            height : 200,
            controls : [ 'styles', 'bold', 'italic', 'hilite' ],
            fonts : [
                "Helvetica Neue",
                "Times New Roman",
                "serif",
                "sans-serif",
                "monospace",
                "cursive"
            ],
            styles: [
                { tag: "h1", caption: "Heading 1"},
                { tag: "h2", caption: "Heading 2"},
                { tag: "h3", caption: "Heading 3"},
                { tag: "p", caption: "Body"},
                { tag: "pre", caption: "Preformatted Text"}
            ],
            fontsizes: [ 10,12,13,14,16,18,20,24 ],
            iframe: true,
            stylesheet : false,
            error: function(msg){ alert(msg) }
        }

    Other settings:

    __toolbarElt__ selector or node in which you want the toolbar inserted (its
    contents will be replaced.
    
    __editableSelector__ selector indicating whether only .editable elements are
    contentEditable -- by default the editor's entire content is contentEditable.
    
    __onEvent__ [optional] event handler to provide specialized event handling. Will
    execute in editor's context and be passed the event and the current selection_info. 
    Explicitly returning false will block default event handling. Will be triggered
    by mouseup, keydown, keyup, change, and scroll events.

    __controls__ is a list of the controls that will appear in the editor toolbar.
    Note that omitting the "styles" or "fonts" from the controls list will
    prevent the menu from appearing regardless of what is in the fonts or styles
    arrays.

    __fonts__ is the list of fonts that will appear in the fonts menu control.

    __styles__ is the list of styles that will appear in the styles menu control.
    
    __callback__ will be called when the editor is ready for editing (which is only
    of much interest in iframe mode).

    __iframe__ determines whether the editor utilizes an iframe.
    By default, the editor will use an __iframe__, but if iframe is set to false
    then the object will be made editable in place (and it's up to you to style
    it -- width and height will be ignored).

        !!!
        <div id='editor-example-1'>
            <h2>Gettysburg Address Opening</h2>
            <p>
                Four score and seven years ago our fathers brought forth on this
                continent a new nation, conceived in liberty, and dedicated to the
                proposition that all men are created equal.
            </p>
        </div>
        <button class='toggle'>Toggle</button>
        <script>
            example.find('.toggle').on('click', function(){
                var elt = example.find( '#editor-example-1' );
                if( elt.editor() ){
                    elt.editor(false);
                } else {
                    elt.editor({
                        height:150, 
                        callback:function(){
                            this.insert($("<p>Added by callback</p>"), {where:"append"});
                        }
                    });
                }
            }).trigger('click');
        </script>

    Inline editable example:

        !!!
        <div id='editor-example-2' style="border: 1px solid gray; width: 400px; height: 100px; overflow-y: auto">
            <h3>Heading</h3>
            <p>Some text</p>
        </div>
        <button class='toggle'>Toggle</button>
        <script>
            example.find('.toggle').on('click', function(){
                var elt = example.find( '#editor-example-2' );
                if( elt.editor() ){
                    elt.editor(false);
                } else {
                    elt.editor({
                        iframe:false, 
                        callback:function(){
                            this.insert($("<p>Added by callback</p>"), {where:"append"});
                        }
                    });
                }
            }).trigger('click');
        </script>

    __stylesheet__ is a url for a stylesheet that will be loaded into an editor iframe (so
    it won't be used for inline editors).

    TODO
    ----
     * If the editor is completely empty (not even a paragraph) behavior is weird. Need to
       ensure that any text is wrapped in a block element in handleEvent
     * Lists are misbehaving w.r.t. the block style menu. When formatBlock is implemented
       as a utility routine, it needs to deal with this somehow.
     * Aside:
       Given IE's lack of support for getSelection and its weird formatBlock behavior
       it might be simplest to do blockwrapping by using (say) blockFormat+address,
       finding the resulting elements, and then restyling them (like styleSpan).
       In each case we would leave a class or data attribute behind on a correctly styled
       element to allow us to identify newly generated markup.
        * Firefox preserves class and attributes after blockFormat
        * Chrome and Safari destroy class and attributes after blockFormat
        * IE seems to be completely broken right now
     * Should we wish to implement an IE8 shim for getSelection, see following links:
        * [MSDN](http://msdn.microsoft.com/en-us/library/ms535869%28v=VS.85%29.aspx)
        * [Quirksmode](http://www.quirksmode.org/dom/range_intro.html)
        * Also there's the [Rangy Library](https://code.google.com/p/rangy/)
     * note that toolbar button behavior is not working for bold/italic in Firefox if
       you select an entire block of bold text (for example after clicking the bold
       button on previously non-bold text)
     * Chrome / Firefox regard JavaScript clipboard access as a security breach and
       block it -- workaround? Note that redactor (for example) doesn't actually provide
       toolbar icons for clipboard
     * Possibly build the markup prettifier into editor module as a utility function
       since it will probably be useful for anyone consuming this module one day)
     * IE8 shim for spellchecking (not needed for IE9)
     * Handle case where mouse is pressed down inside editor and released outside
     * Implement disabled state. Maybe related - when you do `makeEditable(false)`, fields within
       form paragraphs should be disabled.
*/

/*global console, pn, jQuery */
/*jslint browser:true, scripturl:true */

(function(pn, $){
    "use strict";
    
    /*
    // simple-minded function to find the difference between two strings assuming single contiguous change
    // not currently in use, but may be used to optimize memory usage of undo engine
    function diff(a, b){
        if( a === b ){
            return false;
        }
        var maxLength = Math.min(a.length, b.length),
            firstDifference = 0,
            lastDifference = 1;
        while( firstDifference < maxLength && a[firstDifference] === b[firstDifference] ){
            firstDifference++;
        }
        while( firstDifference + lastDifference < maxLength && a[a.length - lastDifference] === b[b.length - lastDifference] ){
            lastDifference++;
        }
        return {
                    firstDifference: firstDifference,
                    lastDifference: lastDifference,
                    leftContent: a.substr(firstDifference,a.length - firstDifference - lastDifference + 1),
                    rightContent: b.substr(firstDifference,b.length - firstDifference - lastDifference + 1)
                };
    }
    */

    if( pn.editor ){
        console.error("Attempted to redefine editor");
        return;
    }

    var blockSelector = 'h1,h2,h3,h4,h5,h6,pre,blockquote,p,div,ul,ol',
        modifierKeys = [12,16,17,18,91,92,33,34,35,36,37,38,39,40,91,93],
        nbsp = $("<p>&nbsp;</p>").text(),
        // array of editors
        editors = [], 
        active_editor = false,
        // see editor-common.js for the control implementation
        editorControls = {},
        // TODO remove all private clipboard code
        // used for copying/pasting editable chunks
        paragraph_clipboard = false;

    function find_editor( target ){
        target = $(target).get(0);
        for( var i = 0; i < editors.length; i++ ){
            if( editors[i].element_being_edited.get(0) === target ){
                return editors[i];
            }
        }
        return false;
    }

    function remove_editor( editor ){
        for( var i = editors.length - 1; i >= 0; i-- ){
            if( editors[i] === editor ){
                editors.splice(i,1);
            }
        }
    }
    
    function expectNodes( testObject, where ){
        if( !(testObject instanceof jQuery) ){
            throw { what: "expected nodes", where: where, tested: testObject };
        }
    }

    /**
     * Flattens all table content into a document fragment and returns
     * the result.
     */
    var flattenTable = function (idx, table) {
        var frag = document.createDocumentFragment(),
            br = document.createElement('br'),
            div = document.createElement('div'),
            rows = $('tr', table),
            row,
            cells,
            wrapper,
            i,
            j;

        div.style.display = 'inline-block';
        for (i = 0; i < rows.length; i++) {
            row = $(rows[i]);
            cells = row.children();
            for (j = 0; j < cells.length; j++) {
                wrapper = div.cloneNode();
                wrapper.innerHTML = cells[j].innerHTML;
                frag.appendChild(wrapper);
            }
            frag.appendChild(br.cloneNode());
        }
        return frag;
    };

    /**
     * recursive helper function to apply styles to nodes.
     */
    var mergeFormatHelper = function (nodes, css) {
        var flatTable,
            children,
            table = nodes.filter('table');
        if (table.length) {
            flatTable = table.map(flattenTable);
            mergeFormatHelper($(flatTable), css);
            table.replaceWith(flatTable);
        }
        nodes.css(css);
        children = nodes.children();
        if (children.length) {
            mergeFormatHelper(nodes.children(), css);
        }
    };

    /**
     * Takes a jquery selection and a css object and applies css properties and values
     * to the elements in the selection recursively.
     */
    var mergeFormat = function (nodes, css) {
        var clone = nodes.clone(),
            wrapper = $('<div>').append(clone);
        mergeFormatHelper(wrapper, css);
        return wrapper.children();
    };
    
    /**
     Prepare an elt for editing.
     * Convert <b> and <strong> to <span style="font-weight:bold">
     * Convert <i> and <em> to <span style="font-style:italic">
     Add more as the need arises
     */
    function convertToSpans( node ){
        var elt = $(node);
        elt.find('b,strong').each( function(){
            $(this).replaceWith( $('<span/>').css('font-weight', 'bold').html(this.innerHTML) );
        });
        elt.find('i,em').each( function(){
            $(this).replaceWith( $('<span/>').css('font-style', 'italic').html(this.innerHTML) );
        });
        return elt;
}

    /**
     Prevents IE from exploding when asked to do stuff it doesn't understand.
     Returns whether the execution of the command was successful.
     */
    function execCommandWrapper ( doc, command, showUI, value ){
        var result = false;

        if(doc.queryCommandSupported(command)){
            result = doc.execCommand( command, showUI, value );
        } else {
            console.error('Error attempting ExecCommand with parameters:cre', command, showUI, value);
        }

        return result;
    }

    /**
     This <del>EVIL</del> clever function leverages the fact that execCommand can correctly style
     arbitrary text selections but doesn't do all the many things we actually
     want it to so instead:

     1. if the selection is empty it does nothing (this is because styling an empty
        selection gives the input cursor hidden state)
     2. otherwise, it apples font-size: x-small to the selection
     3. it finds the things that have been styled this way and applies the style
        settings we wanted in the first place.
        
    Returns the styled elements.
     */
    function styleSpan( sel, css, other ){
        if( !sel || !sel.text ){
            return;
        }

        var cssNullify = $.extend({},css);
        $.each(cssNullify, function(idx){
            cssNullify[idx] = '';
        });
        execCommandWrapper(sel.document, "styleWithCSS", false, true);
        execCommandWrapper(sel.document, 'fontSize', false, "1");

        // chrome sets style="font-size: x-small"; firefox may create <font size="1"></font> wrappers (!)
        return $(sel.root)
                    .find('span,b,i,strong,em,font')
                    .filter(function(){ return this.style.fontSize === 'x-small' || $(this).attr('size') === '1'; })
                    .each( function(){
                        var elt = $(this);
                        elt.get(0).style.fontSize = '';
                        elt.removeAttr('size');
                        elt.find('*').css(cssNullify);
                        elt.css(css);
                        if( other ){
                            if( other['class'] ){
                                elt.addClass(other['class']);
                            }
                            if( other.attributes ){
                                elt.attr(other.attributes);
                            }
                        }
                    });
    }

    /**
     In contrast to styleSpan, this simply finds all block-level elements
     (other than divs) in the current selection and applies a specified
     style to them.
     */
    function styleBlocks( sel, css ){
        if( !sel ){
            return;
        }

        $.each(sel.blockList, function(idx, elt){
            $(elt).css(css);
        });
    }

    function selectNodeTextWithOptions( node, options ){
        options = $.extend({
            window: window,
            where: 'all'
        }, options);

        var win = options.window,
            doc = win.document,
            range,
            selection;

        node = $(node).focus().get(0);

        // if editable, select field text
        // http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
        // AAM: 08.28.13 range.select() or selection.addRange(range) on a select element throws in all versions of IE.
        if(!$(node).is('select')) {
            if (!doc.createRange) { // MSIE8
                range = doc.body.createTextRange();
                range.moveToElementText(node);
                range.select();
            } else if (win.getSelection) { // Others
                range = doc.createRange();
                switch(options.where){
                    case "all":
                        range.selectNodeContents(node);
                        // do nothing!
                        break;
                    case "before":
                        range.selectNodeContents(node);
                        range.collapse(true);
                        break;
                    case "after":
                        range.selectNodeContents(node);
                        range.collapse(false);
                        break;
                    default:
                        break;
                }
                selection = win.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    function editorShortcuts(elt, control, controls, hotkeys){
        if( elt && (control.shortcut || control.selection_changed) ){
            // convert human-readable "key" into keycode
            if( control.shortcut && !control.shortcut.keycode && control.shortcut.key ){
                control.shortcut.keycode = control.shortcut.key.charCodeAt(0);
            }
            control.shortcut = $.extend({
                ctrlKey: true, // ctrl and command are treated as the same
                altKey: false,
                shiftKey: false
            }, control.shortcut);
            var control_wrapper = {
                control: control,
                element: elt
            };
            controls.push(control_wrapper);
            if( control.shortcut ){
                if( hotkeys[control.shortcut.keycode] ){
                    hotkeys[control.shortcut.keycode].push(control_wrapper);
                } else {
                    hotkeys[control.shortcut.keycode] = [control_wrapper];
                }
            }
        }
    }

    var editorControlBuilders = {
        "button": function( control, editor ){
            var elt = $('<button/>',{
                html: '<span>' + control.caption + '</span>',
                title: control.title || control.caption,
                click: function() {
                    editor.execWrapper(control, this.value);
                }
            });
            editorShortcuts(elt, control, editor.controls, editor.hotkeys);
            return elt;
        },
        "menu": function( control, editor ){
            var elt = control
                .build
                .call(editor, editor.settings)
                .on('change', function() {
                    editor.execWrapper(control, this.value);
                });
            // wrap select elements in a div
            if(elt.get(0).tagName === 'SELECT'){
                elt
                    .attr('title', control.title || control.caption)
                    .attr('data-no-label-needed', '');
                elt = $('<div/>').addClass('styled-select').append(elt);
            }
            // note that menu shortcuts don't work yet so this does nothing
            editorShortcuts(elt, control, editor.controls, editor.hotkeys);
            return elt;
        },
        "group": function( control, editor ){
            var elt = $('<fieldset/>')
                .attr({ legend: control.caption });
            $.each( control.items, function( idx, controlName ){
                buildEditorControl( controlName, editor, elt );
            });
            return elt;
        },
        "split-button": function( control, editor ){
            var elt = $('<div/>')
                .attr({ legend: control.caption });
            $.each( control.items, function( idx, controlName ){
                buildEditorControl( controlName, editor, elt );
            });
            elt.addClass('split-btn').addClass('btn');
            return elt;
        },
        "separator": function(){
            return $("<span/>")
                .text(nbsp)
                .addClass("tb-separator");
        }
    };

    function buildEditorControl( controlName, editor, parentElt ){
        var control = editorControls[controlName],
            builder;

        if( control === undefined ){
            console.error( "Unknown editor control: " + controlName );
        } else {
            builder = editorControlBuilders[ control.type ];
            if( builder && typeof builder === 'function' ){
                builder( control, editor )
                    .addClass( 'tb-' + controlName )
                    .appendTo( parentElt );
            }
        }

        return parentElt;
    }

    function Editor(target, settings){
        target = $(target);
        settings = $.extend({
                width: 400,
                height: 200,
                controls: [ 'styles', 'bold', 'italic', 'hilite' ],
                styles: [
                    { tag: "h1", caption: "Heading 1"},
                    { tag: "h2", caption: "Heading 2"},
                    { tag: "h3", caption: "Heading 3"},
                    { tag: "p", caption: "Body"},
                    { tag: "pre", caption: "Preformatted Text"}
                ],
                fontsizes: [ 'Default',10,12,13,14,16,18,20,24 ],
                stylesheet: false,
                fonts: ["Helvetica Neue","Times New Roman","serif","sans-serif","monospace","cursive"],
                iframe: true,
                autoSave: true,
                pastemode: 'merge',
                error: function(msg){ alert(msg); },
                trackChanges: false
            },
            settings
        );

        var self = this;

        this.settings = settings;
        this.element_being_edited = $(target);
        this.editor = false;
        this.editor_root = false;
        this.containerDiv = false;
        this.controls = [];
        this.hotkeys = {};
        this.document = false;
        this.window = false;
        this.selection = false;
        this.dirty = false;
        this.undoBuffer = [];
        this.undoDepth = 0;
        this.updateInterval = setInterval( function(){ self.updateControls(); }, 1000 );

        if( settings.iframe ){
            this.edit_in_iframe();
        } else {
            this.edit_in_place();
        }

        if( settings.toolbarElt ){
            this.toolbarElt = $(settings.toolbarElt).empty();
        } else {
            this.toolbarElt =  $("<div/>", { "class" : "editor-btns" });
            if( settings.iframe ){
                this.toolbarElt.prependTo( this.containerDiv );
            } else {
                $(this.editor).before( this.toolbarElt );
            }
        }
        $.each( settings.controls, function( i, controlName ){
            buildEditorControl( controlName, self, self.toolbarElt );
        });

        active_editor = this;

        editors.push( this );

        return this;
    }

    Editor.prototype = {
        edit_in_iframe: function() {
            var self = this;
            this.containerDiv = $("<div>",{
                "class": pn.editor_class,
                css : {
                    width : this.settings.width,
                    height : this.settings.height
                    /* TODO: these might fix some problem in mobile safari, but causes double scroll
                             bars in Chrome and Firefox, though, for Chrome, apparently only on Windows.
                    'overflow' : 'auto', // mobile safari
                    'webkit-overflow-scrolling' : 'touch' // mobile safari
                    */
                }
            });
            this.element_being_edited.addClass('editor-target').hide();
            this.element_being_edited.after(this.containerDiv);
            this.editor = $("<iframe>",{
                frameborder : "0",
                css : {
                    border: 0
                },
                attr : {
                    width: this.settings.width,
                    height: this.settings.height - (this.settings.toolbarElt ? 0 : 31)  || this.settings.height
                },
                src: 'javascript: false'
            })
            .on('load', function(){ 
                if( self.editor.contentWindow ){
                    self.setup_iframe(); 
                } else {
                    setTimeout(function(){
                        self.setup_iframe(); 
                    }, 0);
                }
            })
            .appendTo(this.containerDiv).get(0);
        },
        setup_iframe: function(){
            var doc, head;
            this.window = this.editor.contentWindow;
            this.document = this.editor.contentDocument ? this.editor.contentDocument : this.window.document;
            doc = this.document;

            this.editor_root = doc.body;
            head = $(doc).find('head');
            doc.charset = document.charset;

            if(doc.head){
                if (this.settings.stylesheet) {
                    $('<link>', {
                        rel: "stylesheet",
                        href: this.settings.stylesheet,
                        type: "text/css"
                    }).appendTo(head);
                    $('<meta>', {
                        charset: 'utf-8'
                    }).appendTo(head);
                    $('<meta>', {
                        "http-equiv": 'http-equiv',
                        content: 'text/html; charset=UTF-8'
                    }).appendTo(head);
                }
            } else {
                // jQuery DOM manipulation fails in IE8; brute force works everywhere
                head.html(
                    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />' +
                        '<link rel="stylesheet" href="' + this.settings.stylesheet + '" type="text/css" />'
                );
            }

            this.editor_root.innerHTML = this.element_being_edited.html();
            convertToSpans(doc.body);
            $(doc.body).css({ // Mobile Safari
                '-webkit-transform': 'translate3d(0,0,0)'
            });

            this.makeEditable(true);
            this.initUndo();
            
            if( this.settings.callback ){ 
                this.settings.callback.apply(this); 
            }
        },
        edit_in_place: function(){
            this.editor = this.editor_root = this.element_being_edited[0];
            convertToSpans(this.editor);
            this.makeEditable(true);
            this.initUndo();
            $(this.editor)
                .before(this.toolbarElt).css({"outline": "none"});

            this.document = this.editor.ownerDocument;
            this.window = this.document.parentWindow || // all browsers
                this.document.defaultView; // except IE
            
            if( this.settings.callback ){ 
                this.settings.callback.apply(this); 
            }
        },
        makeEditable: function(editable){
            var self = this,
                root = $(this.editor_root),
                editable_list = false;

            var rootEvents = [
                'change','keydown','keyup','mousedown','mouseup','drop'
            ].map(function(type) {
                return type + '.editorEvents';
            }).join(' ');

            if( editable === undefined ){
                editable = !self.htmlMode;
            }

            if (root.find('.attachment-inline').length) {
                pn.editor_attachments.addResizeListeners(root.find('.attachment-inline'));
            }

            // using contentEditable vs. designmode to avoid inadvertently destroying body
            if( this.settings.editableSelector ){
                editable_list = root.find(".editable");
                editable_list
                    .attr({
                        contentEditable: editable,
                        draggable: false,
                        tabindex: 0
                    })
                    .css({
                        '-webkit-touch-callout': 'text',
                        '-webkit-user-select': 'text',
                        '-khtml-user-select': 'text',
                        '-moz-user-select': 'text',
                        '-ms-user-select': 'text',
                        'user-select': 'text'
                    })
                    .prop('spellcheck', false);
            } else {
                this.editor_root.contentEditable = editable;
                root.prop('spellcheck', false);
            }
            if(editable){
                $(this.window)
                    .off('scroll.editorEvents')
                    .on('scroll.editorEvents', function(evt){ self.handleEvent(evt); });

                root.off(rootEvents)
                    .on(rootEvents, function(evt){ self.handleEvent(evt); });

                root.off('paste')
                    .on('paste', function(evt){ self.paste(evt); })
                    .off('cut')
                    .on('cut', function(evt){ self.cut(evt); })
                    .off('copy')
                    .on('copy', function(evt){ self.copy(evt); });
                
                //TODO Move hint implementation inside editor, and put delete button for deletable elts in a hint-like element
            }
        },
        ready: function(){
            return !!this.editor_root;
        },
        close: function(){
            this.makeEditable(false);
            if(this.settings.iframe){
                this.element_being_edited.html( this.content() ).removeClass('editor-target').show();
                $(this.editor).closest('.editor').remove();
            }
            this.toolbarElt.empty();
            this.editor = false;
            this.editor_root = false;
            clearInterval( this.updateInterval );
            remove_editor(this);
        },
        createAddedSpan: function(evt, afterWhat, content){
            var inserted;
            evt.preventDefault();
            evt.stopPropagation();
            // we need to replace a space with an nbsp because otherwise the
            // space will be "eaten", the selection will go in the wrong place
            // and sadness will ensue.
            if(content === " "){
                content = nbsp;
            }
            /*
            if(evt.which === 13){
                afterWhat = $(afterWhat).closest(paragraphSelector);
                // note that it's not marked added, but if any content is entered
                // it will be inserted in a span. The downside is that empty paragraphs
                // might not be marked, but the upside is simplicity
                
                inserted = afterWhat
                                .closest(paragraphSelector)
                                .clone()
                                .empty()
                                .text(nbsp)
                                .insertAfter(afterWhat);
                this.selectNodeText(inserted, {where: 'all'});
            } else {
            */
                inserted = $('<span>')
                                .text(content)
                                .addClass('added')
                                .attr({user: this.settings.user})
                                .insertAfter(afterWhat);
                this.selectNodeText(inserted, {where: 'after'});
            /*}*/
            this.selection = this.selection_info();
        },
        createDeletedSpan: function(evt, selection, replacementText){        
            var deleted = styleSpan(selection, {}, {'class': 'deleted', attributes: {user: this.settings.user}});
            if( evt.which === 8 ){
                evt.stopPropagation();
                evt.preventDefault();
                this.selectNodeText($(deleted[0].previousSibling), {where: 'after'});
                this.selection = this.selection_info();
            } else {
                this.createAddedSpan(evt, deleted.last(), replacementText);
            }
        },
        // change tracking
        // ###TODO 
        // * forward delete
        // * more efficient single character deletion
        // * merging of text nodes
        trackEvent: function ( evt ){
            var changed, text;
            if( 
                evt.type === 'keydown' 
                    && this.settings.trackChanges 
                    && modifierKeys.indexOf(evt.which) === -1
                    && !evt.ctrlKey
                    && !evt.metaKey
                    && evt.which !== 13
            ){
                text = String.fromCharCode(evt.which);
                if(!evt.shiftKey){
                    text = text.toLowerCase();
                }
                if( this.selection.text !== '' && this.selection.text !== nbsp ){
                    this.createDeletedSpan(evt, this.selection, text);
                } else if ( $(this.selection.range.startContainer).closest('.deleted').length ){
                    // we're in a deleted block 
                    if(evt.which === 8){ // DELETE
                        // move selection point to before the deletion
                        this.selectNodeText($(this.selection.range.startContainer), {where:"before"});
                        // allow nature to take its course!
                    } else {
                        // insert keystroke AFTER the deletion
                        this.createAddedSpan(evt, $(this.selection.range.startContainer).closest('.deleted'), text);
                    }
                } else if ( $(this.selection.range.startContainer).closest('.added').length === 0 ){
                    if(evt.which === 8){ // DELETE
                        // if at start of block, let nature take its course
                        if( this.selection.range.startOffset === 0 ){
                            return;
                        } else {
                        /*
                            Approach to DELETE tracking
                            ---------------------------
                            
                            We start with this:
                            
                            before| after
                            
                            The user hits delete, so we want:
                            
                            befor|<span class="deleted>e</span> after
                            
                            TODO
                            ----
                            
                            This approach creates a new span for each deleted character
                            A more sophisticated approach would be to move the deleted characters to a
                            deleted span if this.selection.range.endOffset === 0 and next().is('.deleted')
                            
                            So in this case:
                            
                            before|<span class="deleted"> aft</span>er
                            
                            We'd like to end up with:
                            
                            befor|<span class="deleted">e aft</span>er
                        */
                            evt.preventDefault();
                            evt.stopPropagation();
                        // chop the node in two before the character we're going to delete
                            changed = this.selection.range.startContainer.splitText(this.selection.range.startOffset - 1);
                        // changed now = "e after", we want to split off the part after the "e" and ignore it
                            changed.splitText(1);
                        // we've got it all alone, so we select it
                            this.selectNodeText(changed, {where:"all"});
                        // and now we can delete it like we would a selection
                            this.createDeletedSpan(evt, this.selection_info(), text);
                        }
                    } else if(this.selection.range.startContainer.nodeType === 3){
                        this.selection.range.startContainer.splitText(this.selection.range.startOffset);
                        this.createAddedSpan(evt, this.selection.range.startContainer, text);
                    } else {
                        this.createAddedSpan(evt, this.selection.range.startContainer, text);
                    }
                }
            }
        },
        handleEvent: function(evt){
            var self = this,
                keyCode = evt.keyCode || parseInt(evt.which, 10);
            switch( evt.type ){
                case 'mouseup':
                case 'keydown':
                    active_editor = self;
                    break;
                default:
                    break;
            }
            this.selection = this.selection_info();
            
            // calling custom event handler
            if( this.settings.onEvent && this.settings.onEvent.call(this, evt, this.selection) === false ){
                return;
            }
            
            // TODO 
            // make sure that whenever the user is typing (other than in a textarea or input)
            // that the text lives inside a block.
            this.trackEvent(evt);

            if (evt.type === 'keydown') {
                // turn bare text nodes at the root of the document into paragraphs.
                if (this.settings.editableSelector && keyCode === 13) {
                    // TODO: handle arrow keys at start and end of editable blocks
                    // if( keyCode >= 37 && keyCode <= 40 ){ ... }

                    // ENTER in non-editable areas
                    if ($(this.selection.end).closest('.editable').length === 0){
                        var lastBlock,
                            node;

                        if (this.selection.blockList.length ){
                            lastBlock = $(this.selection.blockList[this.selection.blockList.length - 1]);
                            node = lastBlock.nextUntil('.editable').next();
                        }

                        if (!node || !node.length ){
                            node = this.settings.editableSelector
                                ? this.find('.editable').first()
                                : $(this.editor_root);
                        }

                        self.selectNodeText( node, {where: "before"} );
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                    else {
                        var base = this.settings.editableSelector ? this.find('.editable') : $(this.editor_root);
                        base.contents()
                            .filter(function(){ return this.nodeType === 3;} )
                            .wrap('<p>');
                    }
                }
            }

            if (this.selection){
                if( evt.type === 'keydown' && !this.shortcuts(evt) ){
                    this.updateUndo(keyCode);
                } else if (
                    evt.type === 'mousedown' 
                    || evt.type === "mouseup" 
                    || evt.type === "drop"
                ){
                    this.updateUndo(true);
                    this.updateControls();
                }
            }
        },
        shortcuts: function(evt){
            var self = this,
                done = false;
            
            if( evt.type !== 'keydown' || !this.hotkeys[evt.which] ){
                return false;
            }
            
            $.each(this.hotkeys[evt.which], function(idx, item){
                var control = item.control,
                    shortcut = control.shortcut;

                if(
                    (evt.ctrlKey || evt.metaKey) === shortcut.ctrlKey
                    && evt.shiftKey === shortcut.shiftKey
                    && evt.altKey === shortcut.altKey
                ){
                    item.element.trigger("click");
                    self.updateControls();
                    evt.stopPropagation();
                    evt.preventDefault();
                    done = true;
                    return false;
                }
            });
            
            return done;
        },
        updateControls: function(){
            if( !this.selection ){
                return;
            }

            // If the selection start or end has been orphaned during event processing
            // since the last time the selection was determined, negate the current
            // selection and stop attempting to update controls until
            // selection is assigned to a legitimate entry in the DOM.
            if (!this.selection.start || !this.selection.start.parentNode ||
                !this.selection.end || !this.selection.end.parentNode)
            {
                this.selection = false;
            }

            if( !$(this.editor_root).closest('body').length ){
                this.close();
            }

            var self = this;
            $.each(this.controls, function(idx, item){
                var control = item.control;
                if( typeof control.selection_changed === 'function' ){
                    if( control.selection_changed.call( self, control, self.selection, item.element ) ){
                        $(item.element).addClass('active-for-selection');
                    } else {
                        $(item.element).removeClass('active-for-selection');
                    }
                } else {
                    if( typeof control.command === "string" ){
                        try {
                            if (self.window.document.queryCommandState(control.command)) {
                                $(item.element).addClass('active-for-selection');
                            } else {
                                $(item.element).removeClass('active-for-selection');
                            }
                        } catch (e) {
                            console.error('selection_changed queryCommandState problem', { control: control, command: control.command }, e);
                        }
                    }
                }
            });
        },
        undoState: function(state){
            if( state ){
                if( this.settings.editableSelector ){
                    this.find('.editable').html( state.html );
                } else {
                    this.editor_root.innerHTML = state.html;
                }
                // this.setSelectionRange(state.range);
            } else {
                state = {
                    // range: this.getSelectionRange()
                };
                if( this.settings.editableSelector ){
                    state.html = this.find('.editable').html();
                } else {
                    state.html = this.editor_root.innerHTML;
                }
            }
            return state;
        },
        initUndo: function(){
            // console.log('initializing undo');
            this.undoBuffer = [ this.undoState() ];
            this.undoDepth = 0;
        },
        updateUndo: function(keyCode){
            // console.log(keyCode, this.lastKeyCode, this.undoDepth);
            var state = this.undoState();
            if(
                keyCode
                && this.undoDepth > 0
                && state.html !== this.undoBuffer[this.undoBuffer.length - this.undoDepth - 1].html
            ){
                this.undoBuffer.splice(-this.undoDepth - 1);
                // console.log('resetting undoDepth', this.undoBuffer, diff(content, this.undoBuffer[this.undoBuffer.length - this.undoDepth - 1]));
                this.undoDepth = 0;
                this.lastKeyCode = undefined;
            } else {
                if( keyCode === true
                    || this.lastKeyCode === undefined
                    || keyCode === 8
                    || keyCode === 13
                    || (
                               keyCode !== 37 // arrow keys
                            && keyCode !== 38
                            && keyCode !== 39
                            && keyCode !== 40
                            && keyCode !== this.lastKeyCode 
                        )
                ){
                    if(
                        this.undoBuffer.length === 0 
                        || state.html !== this.undoBuffer[this.undoBuffer.length - 1].html
                    ){
                        this.undoBuffer.push(state);
                        // console.log('pushing undo state', this.undoBuffer);
                    }
                }
                this.lastKeyCode = keyCode;
            }
        },
        topLevelElement: function(elt){
            while(
                elt.parentNode !== null
                && elt.parentNode !== this.editor_root
                && (!this.settings.editableSelector || !$(elt.parentNode).is('.editable'))
            ){
                elt = elt.parentNode;
            }
            return elt;
        },
        selection_info: function(){
            var range = this.getSelectionRange();

            if( range ){
                try{
                    var start,
                        end,
                        startTag,
                        endTag,
                        blockFormat,
                        blockList = [],
                        selectedElt,
                        startBlockElt,
                        endBlockElt;

                    start = range.startContainer; // TODO at this point IE8 will explode.
                    end = range.endContainer;

                    // in Firefox you can find yourself with the body being the entire selection
                    if (start === this.editor_root && $(this.editor_root).children(blockSelector).length) {
                        start = $(this.editor_root).children(blockSelector).get(0);
                        end = $(this.editor_root).children(blockSelector).get(-1);
                    }
                    if( $(start).closest(blockSelector).length === 0 ){
                        return false;
                    }
                    startTag = $(start).closest(blockSelector).get(0).tagName;
                    endTag = $(end).closest(blockSelector).get(0).tagName;
                    blockFormat = startTag === endTag ? startTag.toLowerCase() : false;

                    /*
                     BEWARE EDGE CASES:
                     * Triple-clicking a paragraph causes the next paragraph to be the end of range,
                     but the end offset will be zero
                     */
                    startBlockElt = this.topLevelElement(start);
                    endBlockElt = this.topLevelElement(end);

                    selectedElt = startBlockElt;
                    blockList.push(selectedElt);
                    while (selectedElt && selectedElt !== endBlockElt) {
                        selectedElt = $(selectedElt).next().get(0);
                        blockList.push(selectedElt);
                    }
                    return {
                        document: this.document,
                        root: this.editor_root,
                        blockFormat: blockFormat,
                        text: typeof range.text === 'string' ? range.text : range.toString(),
                        start: start,
                        end: end,
                        blockList: blockList,
                        range: range,
                        isEmpty: range.collapsed
                    };
                } catch(e){
                    console.error( 'selection problem', e);
                }
            }
            return false;
        },
        execWrapper: function (control, cmdArg) {
            if (cmdArg === '_donothing') {
                return;
            }
            if (typeof control === 'string') {
                control = editorControls[control];
            }
            if (! control) {
                console.error('Editor control is not defined for this command');
                return;
            }
            var editor = this;
            var command = control.command;
            var argument = typeof control.argument === 'function'
                ? control.argument(editor.settings)
                : control.argument;
            var canUndo = control.canUndo === undefined ? true : false;
            editor.exec(command, argument || cmdArg || '');
            if (canUndo) {
                editor.updateUndo(true);
            }
        },
        exec: function(command, argument){
            var doc = this.document;

            if( typeof command === 'function' ){
                command.call(this, argument, this.selection_info());
            } else {
                execCommandWrapper(doc, "styleWithCSS", false, false);
                execCommandWrapper(doc, command, false, argument);
            }

            // remove empty inline styles
            this.find('[style=""]').removeAttr('style');
            // remove spans serving no purpose
            this.find('span')
                .not('.elastic-input,.editable')
                .each(function(){
                    var elt = $(this);

                    // if the span is a Microsoft Word formatted spacing span then don't destroy it.
                    if($(this).attr('style') === 'mso-spacerun:yes') {
                        return false;
                    }

                    // If the span is not used for styling and is not used for contentEditable
                    // purposes then unwrap the contents of the span.
                    if( !elt.attr('style') && !elt.prop('contentEditable') ){
                        elt.contents().unwrap();
                    }

                    // remove empty spans (Firefox bug)
                    // apparently Firefox creates text nodes around carriage returns and styles them
                    if( elt.text().replace(/\s/g, '') === '' ){
                        elt.remove();
                    }

                });

            this.window.focus();
            $(this.editor_root).trigger('change');
            return false;
        },
        // given a list of dom elements and a style attribute
        // return the style associated with the elements if it's the same
        // return "mixed" if it's mixed
        // return false if there were no elements in the list
        elementsStyle: function( sel, styleAttribute ){
            if (!sel) {
                return;
            }

            var start = sel.start,
                end = sel.end;

            // If the selection start or end has been orphaned during event processing
            // since the last time the selection was determined, silently pass on
            // mortician styling concerns for this cadaver.
            if (!start || !start.parentNode || (!start.style && !start.parentNode.style) ||
                !end || !end.parentNode || (!end.style && !end.parentNode.style))
            {
                return;
            }
            start = start.style ? start.style : start.parentNode.style;
            end = end.style ? end.style : end.parentNode.style;

            if( start[styleAttribute] === end[styleAttribute] ){
                return start[styleAttribute];
            } else {
                return 'mixed';
            }
        },
        styleSpan: styleSpan,
        styleBlocks: styleBlocks,
        blocksStyle: function( sel, styleAttribute ){
            var setting;

            if( !sel ){
                return;
            }

            try {
                if( sel.blockList[0].style ){
                    setting = sel.blockList[0].style[styleAttribute];

                    $.each( sel.blockList, function(){
                        if( this.style[styleAttribute] !== setting ){
                            setting = "mixed";
                            return false;
                        }
                    });
                }
            } catch(e){
                console.error("blocksStyle problem", e);
            }
            return setting;
        },
        insert: function(nodes, options){
            options = $.extend({
                where: "insert"
            }, options);

            var target;
            
            expectNodes( nodes, 'editor.insert' );
            
            // early exit!
            if( !nodes.length ){
                return;
            }
            switch(options.where){
                case "append":
                    if( !this.settings.editableSelector ){
                        $(this.editor_root).append(nodes);
                        break;
                    }
                // otherwise
                /* falls through */
                case "insert": // after the editable containing the text insertion point
                    if( this.settings.editableSelector ){ // becomes inline otherwise
                        target = $(this.selection_info().blockList)
                            .last()
                            .closest('.editable');
                        if( target.length ){
                            target.first().append(nodes);
                        } else {
                            // if there's no insertion point, stick it after the last editable div
                            target = this.find('.editable');
                            if( target.length ){
                                target.last().append(nodes);
                            } else {
                                // only in desperation tack it on the end
                                $(this.editor_root).append(nodes);
                            }
                        }
                        break;
                    }
                // otherwise
                /* falls through */
                case "inline": // after the text insertion point
                    nodes = this.insertNodes(nodes);
                    // node = false; // do not focus this
                    break;
                case "block-insert":
                    // inserts content as a block at top level of editor
                    $(this.selection_info().blockList.pop()).after(nodes);
                    break;
                case "before":
                    target = this.find(options.target);
                    if( target.length ){
                        target.first().before(nodes);
                    } else {
                        $(this.editor_root).append(nodes);
                    }
                    break;
                default:
                    break;
            }
            this.dirty = true;
            this.makeEditable();
            $(this.editor_root).trigger('change');
            if( nodes ){
                this.focus( nodes );
            }
            return nodes;
        },
        scrollToShow: function(node){
            node = $(node);
            // tried scrollIntoView and it does not work as nicely
            if( this.settings.iframe && node.length && node.position ){
                var scrollPosition = $(this.editor_root).scrollTop(),
                    viewHeight = $(this.editor).height(),
                    top = node.offset().top,
                    height = node.height(),
                    scrollThreshold = 40;

                if( top - scrollPosition < scrollThreshold ){
                    $(this.editor_root).scrollTop(top - scrollThreshold);
                } else if ( top + height - scrollPosition > viewHeight - scrollThreshold ){
                    $(this.editor_root).scrollTop(top - viewHeight + height + scrollThreshold);
                }
            }
        },
        content: function( nodes ){
            if( nodes ){
                nodes = $(nodes);
                $(this.editor_root).empty();
                this.insert( nodes, {where: "append"});
                this.initUndo();
            } else {
                if( this.htmlMode ){
                    nodes = $($(this.editor_root).find('textarea').val());
                } else {
                    nodes = $(this.editor_root).contents().clone();
                }
            }
            return nodes;
        },
        // TODO Investigate whether we can remove this and only use selection_info
        getSelectionRange: function(){
            if(this.window.getSelection){
                var s = this.window.getSelection();
                if( s && s.getRangeAt && s.rangeCount === 1 ){
                    return s.getRangeAt(0);
                }
            } else if (this.document.selection && this.document.selection.createRange){
                return this.document.selection.createRange();
            }
            return false;
        },
        setSelectionRange: function(range){
            if( range ){
                if( this.window.getSelection ){
                    var s = this.window.getSelection();
                    s.removeAllRanges();
                    s.addRange(range);
                } else if (this.document.selection && range.select){
                    range.select();
                }
                // update stored selection
                this.selection = this.selection_info();
            }
        },
        selectedText: function(){
            // adapted from http://tinyurl.com/k3u8rkc
            var html = "",
                w = this.window,
                d = this.document;
            if (typeof w.getSelection !== "undefined") {
                var sel = w.getSelection();
                if (sel.rangeCount) {
                    var container = d.createElement("div");
                    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                        container.appendChild(sel.getRangeAt(i).cloneContents());
                    }
                    html = container.innerHTML;
                }
            } else if (typeof d.selection !== "undefined" && d.selection.type === "Text") {
                html = d.selection.createRange().htmlText;
            }
            return html;
        },
        // TODO: getters and setters?!
        getTempSelectionRange: function () {
            return this.tempSelectionRange;
        },
        setTempSelectionRange: function () {
            this.tempSelectionRange = this.getSelectionRange();
        },
        tempSelectionRange: {},
        clearMatch: function (node) {
            var parent = node.parentNode;
            parent.replaceChild(node.firstChild, node);
            parent.normalize();
        },
        clearMatches: function(){
            var me = this;
            this.find('.match').each(function () {
                me.clearMatch(this);
            }).end();
        },
        search: function(needle, terms){
            this.replace(needle, null, terms);
        },
        replace: function(needle, replacement, terms){
            this.clearMatches();
            if (pn.utils.isBlank(needle)) {
                return;
            }

            if( typeof needle === 'string' ){
                try {
                    needle = new RegExp( needle, "gi" );
                } catch(e) {
                    alert( "Bad search expression" );
                    return;
                }
            }

            // Recursive DOM walk to highlight needles on content only.
            var highlight = function (node) {
                var skip = 0,
                    idx = 0,
                    textLength,
                    text = node.data,
                    wrapper = $('<span class="match"></span>').get(0),
                    start,
                    clone;
                if (node.nodeType === 3) {
                    //TODO: Look into replacing both search/match with just a single Regex.exec, seems redundant to do two searches.
                    idx = text.search(needle);
                    if (idx >= 0) {
                        textLength = text.match(needle)[0].length;
                        if (typeof replacement === 'string') {
                            node.data = text.replace(needle, replacement);
                        } else {
                            start = node.splitText(idx);
                            start.splitText(textLength);
                            clone = start.cloneNode(true);
                            wrapper.appendChild(clone);
                            start.parentNode.replaceChild(wrapper, start);
                        }
                        skip = 1;
                    }
                } else if (node.nodeType === 1 && node.childNodes) {
                    for (idx = 0; idx < node.childNodes.length; idx += 1) {
                        idx += highlight(node.childNodes[idx]);
                    }
                }
                return skip;
            };
            
            // TODO: make more eleganter or fix problem at source
            // hack to remove incorrectly nested .editables
            this.find('.editable .editable').removeClass('editable');
            var blocks = this.settings.editableSelector
                ? this.find('.editable')
                : $(this.editor_root);

            $.each( blocks, function( idx, block ) {
                highlight(block);
            });
        },
        clip_trap: function( content ){
            var trap;
            this.makeEditable(false);
            this.activeElement = this.document.activeElement;
            trap = $("<div/>")
                .attr({contentEditable: true})
                .appendTo(this.editor_root)
                .append( content );
            trap.find('[contenteditable]').removeAttr('contenteditable');
            selectNodeTextWithOptions(trap);
            return trap;
        },
        remove_trap: function(trap){
            trap.remove();
            this.makeEditable(true);
            this.activeElement.focus();
        },
        selected_paragraphs: function(){
            return $(this.editor_root)
                .find('.editable.deletable')
                .has('.active-for-selection');
        },
        copy: function(evt, after){
            var selected_paragraphs = this.selected_paragraphs(),
                self = this;

            if( selected_paragraphs.length ){
                // private clipboard
                paragraph_clipboard = selected_paragraphs.clone();

                var content = $('<div>').append( paragraph_clipboard.clone() ),
                    copy_trap;

                // inserting magic class so we can recognize this when pasted
                content.prepend($('<span>')
                    .addClass('use-paragraph-clipboard')
                    .text(nbsp)
                );
                copy_trap = this.clip_trap( content.contents() );

                // setTimeout to tear down copy trap
                setTimeout( function(){
                    self.remove_trap( copy_trap );
                    if( typeof after === 'function' ){
                        after();
                    }
                }, 0);
                // allow event to proceed
            } else {
                paragraph_clipboard = false;
            }
        },
        cut: function(evt){
            var selected_paragraphs = this.selected_paragraphs();
            if( selected_paragraphs.length ){
                this.copy(evt, function(){
                    selected_paragraphs.remove();
                });
            }
        },
        // TODO
        // verify beforePaste still needed after image stuff is fixed
        // if not, delete all reference to beforePaste and afterPaste
        paste: function(evt){
            var self = this,
                pastemode = self.settings.pastemode,
                selection = self.selection_info(),
                activeElement = selection.document.activeElement,
                inField = $(activeElement).is('input,textarea'),
                range = selection ? selection.range : self.getSelectionRange(),
                scrollPosition = $(self.editor_root).scrollTop(),
                paste_trap;

            // TODO: IE compatibility of course
            if (!inField && selection && !self.htmlMode && pastemode !== 'preserve') {
                paste_trap = this.clip_trap();
                setTimeout(function(){
                    var new_text = $(paste_trap).html(),
                        dummyNode,
                        nodes,
                        css,
                        cssAttributes,
                        inheritedStyle,
                        attr,
                        i;

                    dummyNode = $('<div>').html(new_text);

                    if (dummyNode.has('.use-paragraph-clipboard').length) {
                        pastemode = 'paragraphs';
                    } else if (pastemode === 'merge') {
                        css = {};
                        // only care about font, font size, and color.
                        cssAttributes = [ 'font-family', 'font-size', 'color' ];
                        inheritedStyle = getComputedStyle(range.startContainer.parentElement);
                        for (i = 0; i < cssAttributes.length; i++) {
                            attr = cssAttributes[i];
                            css[attr] = inheritedStyle[attr];
                        }
                        nodes = mergeFormat(dummyNode, css).contents();
                    } else if (pastemode === 'remove') {
                        nodes = $(document.createTextNode( dummyNode.text() ) );
                    }

                    $(self.editor_root).scrollTop(scrollPosition);
                    self.remove_trap(paste_trap);
                    self.setSelectionRange(range);

                    if( pastemode === 'paragraphs' ){
                        self.insert(paragraph_clipboard.clone(), {where: 'append'});
                    } else if (!evt.isDefaultPrevented()) {
                        self.insertNodes(nodes);
                    }
                }, 0);
            }
        },
        /**
            inserts nodes into the editor (if no selection/focus, attempts to
            insert it at the end of the [last] editable region.)
        */
        insertNodes: function( nodes ){
            // document.execCommand( 'insertHTML' ... ) is not available in IE8
            var doc = this.document,
                success = false,
                html;

            function cannotBeInserted(selection) {
                var end = $(selection.end);
                return (end.closest('.editable').length === 0 &&
                    end.any('input').length === 0) ||
                    end.closest('.elastic-input').length > 0;
            }

            expectNodes( nodes, 'editor.insertNodes' );
            // put exactly one space before and after the inserted content
            // html.replace(/^(\s|&nbsp;)+|(\s|&nbsp;)+$/g, '')
            html = $('<div>').append(nodes).html();
            if( this.settings.editableSelector ){
                if( cannotBeInserted(this.selection) ){
                    this.selectNodeText( this.find('.editable').last(), {where: "after"} );
                }
            } else {
                if( !$(this.editor_root).text() ){
                    this.selectNodeText( $(this.editor_root), {where: "all"} );
                } else {
                    this.selectNodeText( $(this.editor_root), {where: "after"} );
                }
            }
            if (doc.queryCommandSupported('insertHTML')) {
                success = execCommandWrapper( doc, 'insertHTML', false, html );
            } else if (doc.selection && doc.selection.type != "Control") {
                // IE < 9
                success = doc.selection.createRange().pasteHTML(html);
            }
            if(!success){
                this.settings.error("Could not insert the content. Try clicking where you want to insert content and try again.");
                console.error("insertHTML failed", nodes);
            }
            return $(this.getSelectionRange().endContainer);
        },
        // TODO Allow the selection behavior to be overridden
        focus: function(elt, selector){
            var self = this,
                node;

            elt = selector ? $(elt).closest(selector) : $(elt);
            $(this.document.activeElement).blur();
            // TODO clever behavior (e.g. focus input if non-empty, select otherwise)
            node = elt.is('input,select')
                ? elt.focus()
                : elt.find('input,select').focus();
            
            if(elt.is('a')){
                elt.closest('[contenteditable]').attr('contenteditable', false);
                elt.focus();
                //elt.closest('[contenteditable]').attr('contenteditable', true);
            }
            
            if( elt.is('input') ){
                elt.get(0).select();
            }
            // TODO not working for some elements
            this.scrollToShow( $(elt).closest(blockSelector) );
            if (self.window) {
                setTimeout(function () { // restore focus to editor window
                    self.window.focus();
                }, 0);
            }
        },
        /**
            select the specified node
                        
            **options.window**: specifies the window, defaults to window
        
            **where**: "all"|"before"|"after" -- sets the selection to the entire node, before,
            or after it; defaults to "all".
        */
        selectNodeText: function( node, options ){
            if( this.find(node).is('.editable,input,textarea') || $(node).closest('.editable').length ){
                selectNodeTextWithOptions( node, $.extend({ window: this.window }, options));
            }
        },
        /**
            shorthand for $(editor.editor_root).find(*selector*)
        */
        find: function ( selector ) {
            return $(this.editor_root).find( selector );
        },
        print: function(){
            this.window.focus();
            this.window.print();
        }
    };

    pn.editor = function(target, settings){
        var editor = find_editor(target);
        return editor || new Editor( target, settings );
    };
    pn.editor_controls = editorControls;
    pn.editor_active = function(){
        return active_editor; 
    };
    pn.editor_class = 'editor';
    pn.editor_block_selectors = blockSelector;
    pn.find_editor = find_editor;
    
    $.fn.editor = function(settings){
        var self = this,
            editor;
        if( settings === undefined ){
            return pn.find_editor(this);
        }
        if( typeof settings === "object" ){
            if( this.length ){
                editor = pn.editor(this, settings);
                this.next().find('iframe').on('auto-save', function () {
                    self.trigger('auto-save');
                });
                return editor;
            } else {
                console.error('editor error: bad target element');
            }
        } else if( settings === false ){
            editor = pn.find_editor(this);
            if( editor ){
                editor.close();
            } else {
                console.error('editor error: no editor to close', this);
            }
        } else {
            console.error( 'editor error: bad settings', settings );
        }
    };
}(pn, jQuery));
/**
    Editor Common Controls
    ======================

    All editor commands are defined in the editorCommands object. In some cases these are 
    very thin wrappers for an execCommand command.

    ### Styles

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["styles"],height:100});
            </script>

    ### Justification

        !!!
            <div>
                <h2>Gettysburg Address</h2>
                <p>
                    Four score and seven years ago our fathers brought forth on this
                    continent a new nation, conceived in liberty, and dedicated to the
                    proposition that all men are created equal.
                </p>
                <p>
                    Now we are engaged in a great civil war, testing whether that nation,
                    or any nation, so conceived and so dedicated, can long endure. We are
                    met on a great battle-field of that war. We have come to dedicate a
                    portion of that field, as a final resting place for those who here
                    gave their lives that that nation might live. It is altogether
                    fitting and proper that we should do this.
                </p>
                <p>
                    But, in a larger sense, we can not dedicate, we can not consecrate,
                    we can not hallow this ground. The brave men, living and dead, who
                    struggled here, have consecrated it, far above our poor power to add
                    or detract. The world will little note, nor long remember what we say
                    here, but it can never forget what they did here. It is for us the
                    living, rather, to be dedicated here to the unfinished work which
                    they who fought here have thus far so nobly advanced. It is rather
                    for us to be here dedicated to the great task remaining before
                    us—that from these honored dead we take increased devotion to that
                    cause for which they gave the last full measure of devotion—that we
                    here highly resolve that these dead shall not have died in vain—that
                    this nation, under God, shall have a new birth of freedom—and that
                    government of the people, by the people, for the people, shall not
                    perish from the earth.
                </p>
            </div>
            <script>
                example.append(this);
                $(this).editor({
                    controls:[
                        "justify"
                    ],
                    height:400
                });
            </script>

    ### Fonts

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["fonts"],height:100});
            </script>

    ### Clipboard and Undo/Redo

    Note that clipboard copy/paste via execCommand does not work "out of the
    box" in Chrome or Firefox (but the usual keyboard shortcuts work fine). We
    can shim this behavior if required.

    Also note the use of a __separator__ control.

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({
                    controls:[
                        "cut",
                        "copy",
                        "paste",
                        "separator",
                        "undo",
                        "redo"],
                    height:100
                });
            </script>

    ### Bold, Italic, and Hilite

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["bold", "italic", "hilite"],height:100});
            </script>

    ### Bullet List and Ordered List

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["bulletList", "orderedList"],height:100});
            </script>

    ### Indent and Outdent

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["indent", "outdent"],height:100});
            </script>

    ### Superscript and Subscript

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["superscript", "subscript"],height:100});
            </script>

    ### Misc. Controls: lineheight, HTML Mode Toggle

        !!!
            <div>
                <h3>Miscellanea</h3>
                <p>
                    Now we are engaged in a great civil war, testing whether that nation,
                    or any nation, so conceived and so dedicated, can long endure. We are
                    met on a great battle-field of that war. We have come to dedicate a
                    portion of that field, as a final resting place for those who here
                    gave their lives that that nation might live. It is altogether
                    fitting and proper that we should do this.
                </p>
            </div>
            <script>
                example.append(this);
                $(this).editor({controls:["lineheight", "htmlToggle"],height:200});
            </script>

    ### Custom Control Example

    Simple example of implementing a custom control. There are two kinds of control
    (aside from separators) -- buttons and menus.

    The same mechanism can be used to override default controls globally.

        !!!
            <div>
                <h3>Heading</h3>
                <p>Some text</p>
            </div>
            <script>
                example.append(this);
                /// custom button control
                pn.editor_controls["strike"] = {
                    type: "button",
                    caption: "Strike",
                    command: "strikeThrough",
                    shortcut: {keycode: 8, altKey: true, ctrlKey: false}, // alt-delete}
                    selection_changed: function( control, sel, elt ){
                        // this will be the editor
                        // control is a reference to the original control
                        // return TRUE if you want the toolbar icon to appear active
                        return $(sel.start).closest('strike,del').length > 0;
                    }
                };
                $(this).editor({controls:["strike"],height:100});
            </script>

    __selection_changed__ callbacks will be passed three arguments (_this_ will point to
    the editor, control is the first parameter so you can refer to control.caption, etc.). 
    The second parameter is
    selection_info, and the third is the toolbar element (in case you need to do
    something to it).
    If selection_info returns "true" then the toolbar item will receive
    "active-for-selection" styling. The third parameter is the triggering event.
    
    __build__ lets you simply build out your editor control and hand it back to the
    editor to stick in its toolbar. This lets you do almost anything, including implementing
    custom menus.
    
    **TODO**: provide explicit support for snippet-based toolbar controls.

    __selection_info__ is an object containing all kinds of useful stuff (most of which
    you could get yourself from the selection object, but laid out conveniently).

    selection_info looks like this:

        {
            document: reference to the editor's document
            root: reference to the editor's editor_root
            blockFormat: <closest block level tagname>|false,
            text: <selected text>,
            selection: <the selection, i.e. window.getSelection()>,
            start: <startContainer from [first] range of selection>,
            end: <endContainer from [first] range of selection>,
            range: <[first] range from selection>
        };

    The word "first" is bracketed because browsers in general don't support multiple
    selection (IE does!) so in practice there's only one range.

    #### Shortcuts

    __Note__: the custom __shortcut__ implemented for the strike button in the preceding
    example.

    Toolbar buttons (not menu items, yet) can have shortcuts. By default, shortcuts
    assume you're using the control or command ("meta") modifier key, but you can
    override that. Shortcuts are specified using a simple object literal:

        {
            keycode: <number>,
            ctrlKey: true|false, // true by default, also matches metaKey (command on Mac)
            altKey: false|true, // false by default
            shiftKey: false|true // false by default
        }

    If you set __ctrlKey__ to __false__ then the default behavior of the keystroke will be
    blocked. In the example above the delete key has been mapped to strikeout if the
    alt modifier is down (overriding the default delete key behavior).
*/
/*global jQuery, pn */
/*jslint browser:true */

(function($, pn){
    "use strict";
    
    /**
        utility function to find smallest amount of leading space in a non-empty line
        and then remove that much leading space from all non-empty lines.
        
        Also removes leading and trailing empty lines.
    */
    function trimIndent(html){    
        var indent = -1;
        html = html.split('\n');
        for( var i = html.length - 1; i >= 0; i-- ){
            if(html[i].trim()){
                var matches = html[i].match(/^\s*/);
                if( indent < 0 || indent > matches[0].length ){
                    indent = matches[0].length;
                }
            }
        }
        $.each(html, function(idx, s){
            if( s.trim() ){
                html[idx] = s.substr(indent);
            }
        });
        
        while( !html[0].trim() ){
            html.shift();
        }
        
        while( !html[html.length-1].trim() ){
            html.pop();
        }
        
        html = html.join('\n');
        return html;
    }

    pn.editor_controls = $.extend( pn.editor_controls, {
        separator: {
            type: "separator"
        },
        bold: {
            type: "button",
            title: 'Bold',
            caption: "<b>B</b>",
            command: "bold",
            shortcut: {key: "B"}
        },
        italic: {
            type: "button",
            title: 'Italic',
            caption: "<i>I</i>",
            command: "italic",
            shortcut: {key: "I"}
        },
        hilite: {
            type: "button",
            title: 'Highlight',
            caption: "<span style='background-color: rgb(255,255,128)'>H</span>",
            /*
                In Chrome, at least,
                queryCommandValue and queryCommandState do not appear to work for hilitecolor
            */
            command: function(argument, sel){
                if( this.elementsStyle( sel, 'background-color' ) !== argument ){
                    this.styleSpan(sel, {"background-color": argument});
                } else {
                    this.styleSpan(sel, {"background-color": ''});
                }
            },
            selection_changed: function( control, sel /*, elt */ ){
                return( this.elementsStyle(sel, "background-color") === control.argument );
            },
            argument: "rgb(255, 255, 128)"
        },
        bulletList: {
            type: "button",
            caption: "Bullet List",
            command: "insertUnorderedList"
        },
        orderedList: {
            type: "button",
            caption: "Numbered List",
            command: "insertOrderedList"
        },
        list: {
            type: "group",
            caption: "List",
            items: [ 'bulletList', 'orderedList' ]
        },
        indent: {
            type: "button",
            caption: "Indent",
            command: "indent",
            shortcut: {keycode: 221, ctrlKey: true} // ctrl + ]
        },
        outdent: {
            type: "button",
            caption: "Outdent",
            command: "outdent",
            shortcut: {keycode: 219, ctrlKey: true} // ctrl + [
        },
        // no shortcuts needed for edit commands
        undo: {
            type: "button",
            caption: "Undo",
            shortcut: {key: "Z"},
            canUndo: false,
            command: function(){
                var bufferDepth;
                if( this.undoDepth === 0 ){
                    this.updateUndo(true);
                }
                bufferDepth = this.undoBuffer.length;
                if( this.undoDepth < bufferDepth - 1 ){
                    this.undoDepth += 1;
                    // console.log('undo!', this.undoDepth);
                    this.undoState(this.undoBuffer[bufferDepth - this.undoDepth - 1]);
                } else {
                    // console.log('cannot undo');
                }
            }
        },
        redo: {
            type: "button",
            caption: "Redo",
            shortcut: {key: "Y"},
            canUndo: false,
            command: function(){
                var bufferDepth = this.undoBuffer.length;
                if( this.undoDepth > 0 ){
                    this.undoState( this.undoBuffer[bufferDepth - this.undoDepth] );
                    this.undoDepth -= 1;
                    // console.log('redo!', this.undoDepth);
                } else {
                    console.log('cannot redo');
                }
            }
        },
        history: {
            type: "group",
            caption: "History",
            items: [ 'undo', 'redo' ]
        },
        cut: {
            type: "button",
            caption: "Cut",
            command: "cut"
        },
        copy: {
            type: "button",
            caption: "Copy",
            command: "copy"
        },
        paste: {
            type: "button",
            caption: "Paste",
            command: "paste"
        },
        trackChanges: {
            type: "button",
            caption: "Track Changes",
            command: function(){
                this.settings.trackChanges = !this.settings.trackChanges;
            },
            selection_changed: function(){
                return this.settings.trackChanges;
            }
        },
        print: {
            type: "button",
            caption: "Print",
            command: function(){
                this.print();
            }
        },
        htmlToggle: {
            type: "button",
            title: 'Toggle HTML',
            caption: "&lt;html&gt;",
            command: function( /* argument, sel, elt */ ){
                    var self = this,
                        content;
                    if( !this.htmlMode ){
                        this.makeEditable(false);
                        content = trimIndent(this.editor_root.innerHTML);
                        
                        $(this.editor_root).empty();
                        $('<textarea class="html-editor">')
                            .css({
                                position: 'absolute',
                                width: '100%',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0
                            })
                            .val( content )
                            .appendTo( this.editor_root );
                        this.htmlMode = true;
                    } else {
                        content = this.content();
                        this.htmlMode = false;
                        this.content(content);
                        this.makeEditable(true);
                    }

                    // TODO disable vs. hide and implement disable properly
                    this.toolbarElt.find("button,select,.tb-separator").each(function(){
                        if( !$(this).hasClass('tb-htmlToggle') ){
                            if( self.htmlMode ){
                                $(this).hide();
                            } else {
                                $(this).show();
                            }
                        }
                    });
                },
            selection_changed: function( /* control, sel */ ){
                    return this.htmlMode || false;
                }
        },
        justifyLeft: {
            type: "button",
            title: 'Justify left',
            caption: "Left",
            command: "justifyLeft",
            selection_changed: function( control, sel ){
                return this.blocksStyle(sel, "text-align") === "left" || !this.blocksStyle(sel, "text-align");
            }
        },
        justifyCenter: {
            type: "button",
            title: 'Justify center',
            caption: "Center",
            command: "justifyCenter",
            selection_changed: function( control, sel ){
                return this.blocksStyle( sel, "text-align" ) === "center";
            }
        },
        justifyRight: {
            type: "button",
            title: 'Justify right',
            caption: "Right",
            command: "justifyRight",
            selection_changed: function( control, sel ){
                return this.blocksStyle( sel, "text-align" ) === "right";
            }
        },
        justifyFull: {
            type: "button",
            title: 'Justify full',
            caption: "Justify",
            command: "justifyFull",
            selection_changed: function( control, sel ){
                return this.blocksStyle( sel, "text-align" ) === "justify";
            }
        },
        justify: {
            type: "group",
            caption: "Justification",
            items: [ 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull' ]
        },
        pastemode: {
            type: "menu",
            title: 'Paste mode',
            command: function(mode /*, sel */ ){
                this.settings.pastemode = mode;
            },
            canUndo: false
        },
        superscript: {
            type: "button",
            title: "Superscript",
            caption: "A<sup>2</sup>",
            command: "superscript",
            selection_changed: function( control, sel /*, elt */ ){
                return $(sel.start).closest('sup').length > 0;
            }
        },
        subscript: {
            type: "button",
            title: "Subscript",
            caption: "A<sub>2</sub>",
            command: "subscript",
            selection_changed: function( control, sel /*, elt */ ){
                return $(sel.start).closest('sub').length > 0;
            }
        },
        lineheight: {
            type: "menu",
            title: 'Line height',
            command: function(argument, sel){
                this.styleBlocks(sel, {
                    'line-height': argument === "100%" ? "" : argument
                });
            },
            selection_changed: function( control, sel, elt ){
                var menu = $(elt),
                    lineheight = this.blocksStyle( sel, "line-height" );

                menu.find('option').removeAttr('selected');

                if( sel.blockList && sel.blockList.length ){
                    if( lineheight === "mixed" ){
                        lineheight = "_donothing";
                    } else if (lineheight === ""){
                        lineheight = "100%";
                    }
                    if( lineheight ){
                        menu.find('[value="' + lineheight + '"]').prop('selected', true);
                    }
                }

                return false;
            }
        },
        styles: {
            type: "menu",
            title: 'Format',
            command: 'formatBlock',
            build: function(settings){
                if( settings.styles !== false ){
                    var styleMenu = $("<select/>",{
                            "class": "tb-style"
                        });
                    $("<option/>",{
                        value: "_donothing",
                        text: "(Mixed)"
                    }).appendTo(styleMenu);
                    $.each(settings.styles,function(i,style){
                        $("<option/>",{
                            value : style.tag,
                            text : style.caption
                        }).appendTo(styleMenu);
                    });
                    return styleMenu;
                }
            },
            selection_changed: function( control, sel, elt ){
                // return TRUE if you want to be marked "active-for-selection"$(range.startContainer)
                var menu = $(elt);

                menu.find('option').removeAttr('selected');

                if( sel.blockFormat ){
                    menu.find('[value=' + sel.blockFormat + ']').prop('selected', true);
                }

                return false;
            }
        },
        find: {
            type: "button",
            caption: "Find",
            command: function(){
                    var needle = prompt("Enter text to find (or use s/needle/replacement for replacement):");
                        
                    if( needle ){
                        if( needle.substr(0,2) === 's/' ){
                            needle = needle.split('/');
                            if( needle.length === 3 ){
                                this.replace( needle[1], needle[2] );
                            } else {
                                alert('Either bad input or insufficiently clever parsing.');
                            }
                        } else {
                            this.search(needle);
                        }
                    }
                },
            shortcut: {key: "F"}
        },
        fontsize: {
            type: "menu",
            title: 'Font size',
            command: function( argument, sel ){
                this.styleSpan(sel, {
                    "font-size": argument === 'Default' ? '' : argument + 'px'
                });
            },
            build: function(settings){
                if( settings.fonts !== false ){
                    var fontsize = $("<select/>",{
                        "class": "tb-fontsize"
                    });
                    $("<option/>",{
                        value: "_donothing",
                        text: "(Mixed)"
                    }).appendTo(fontsize);
                    $.each(settings.fontsizes,function(i,v){
                        $("<option/>",{
                            value : v,
                            text : v
                        }).appendTo(fontsize);
                    });

                    return fontsize;
                }
            },
            selection_changed: function( control, sel, elt ){
                // return TRUE if you want to be marked "active-for-selection"$(range.startContainer)
                var menu = $(elt);

                menu.find('option').removeAttr('selected');

                var fontsize = this.elementsStyle(sel, 'fontSize');

                if( fontsize !== 'mixed' ){
                    fontsize = fontsize ? fontsize.replace(/px/,'') : "Default";
                    menu.find('[value="' + fontsize + '"]').prop('selected', true);
                }

                return false;
            }
        }
    });
}(jQuery, pn));
/**
Form
====

Convenience functions for handling forms.

- TODO: an onchange handler attachable to the form

*/

pn.module('form', function (form, $) {
    var serializeMerge = function (element, data) {
        function buildDataObj(data, input) {
            var parts = input.name.split("."),
                parent = data,
                pl;
            pl = parts.length;

            //Create data structure for nested inputs IF NEEDED and assign values in their correct locations
            for(var i = 0; i < pl-1; i++){
                //Check if holder exists, otherwise create it
                if(typeof parent[parts[i]] === "undefined"){
                    parent[parts[i]] = {};
                }
                //Go down to next level
                parent = parent[parts[i]];
            }

            //If location has data, covert to array and add information there, otherwise just add data
            if (parent[parts[pl-1]]) {
                if (parent[parts[pl-1]].push) {
                    parent[parts[pl-1]].push(input.value);
                } else {
                    parent[parts[pl-1]] = [parent[parts[pl-1]], input.value];
                }
            } else {
                parent[parts[pl-1]] = input.value;
            }
            return parent; //Return completed object
        }
        
        $.each($(element).serializeArray(), function (i, input) {
            buildDataObj(data, input);
        });
        return data;
    };
    
    /**
    Serialize the input fields in the given form.  The serialized object behaves similarly to
    jQuery's [serializeArray](http://api.jquery.com/serializeArray/) but instead of an array, it
    returns form names and values as an `{name: value}` object. For all inputs where there is only
    one of that name in a form, the value contains a string. If the name occurs multiple times, the
    value will be an array.
    */
    form.serialize = function (element) {
        return serializeMerge(element, {});
    };


    /**
    Attach a submit handler to the form associated with the given element. The element may be a form
    or any descendent of a form.

    Unlike JavaScript's normal form onsubmit, this handler cancels the form submission if it returns
    any falsy value or throws an error.

    The callback recieves two arguments, the jQuery submit event and the form data serialized to a
    JavaScript object as described in `pn.form.serialize`. Unlike jQuery's serializeArray, this data
    object includes the control used to submit the form, if any.

        !!!
        <form>
            <label for="single">Single value</label>
            <input type="text" name="single"/>
            <label for="multi">Multi-value</label>
            <input type="checkbox" name="multi" value="first"/>
            <input type="checkbox" name="multi" value="second"/>
            <input type="submit" name="submitButton" value="Go"/>
        </form>
        <button>Submit by JavaScript</button>
        ---
        <script>
            pn.form.onsubmit(example.find('form'), function (event, data) {
                $('<pre></pre>').text(JSON.stringify(data)).appendTo(example);
            });
            example.find('button').on('click', function () {
                example.find('form').submit();
            })
        </script>

    > Unchecked checkboxes do not appear. Should consider serializing them to `false`.

    > Multi-select list boxes appear as arrays with multiple selections, but single items for single
    > selections. Make them always be arrays?

    */
    form.onsubmit = function (element, fn) {
        element = $(element);
        var submitControl;
        element.closest('form').on('submit', function (event) {
            // TODO: What? data = data !== undefined ? { data: data } : {};
            var data = {};
            if (submitControl) {
                // TODO: what happens if name undefined?
                data[submitControl.name] = submitControl.value || "Submit";
                submitControl = undefined;
            }
            try {
                return fn.call(this, event, serializeMerge(element, data)) || false;
            } catch (e) {
                console.error(e, e.stack);
                return false;
            }
        }).find('[type="submit"],[type="image"],button').on('click', function (event) {
            // TODO: where's a reference for all the ways forms may be submitted?
            // TODO: what about submit buttons, etc. outside the form but associated via form attr?
            if (event.target.tagName !== 'INPUT') {
                // Will be a <button>, but sometimes an element inside a button can be event target,
                // so do not just look for tagName === 'BUTTON'
                if (event.target.type && event.target.type.toLowerCase() !== 'submit') {
                    return;
                }
                // TODO: could you submit with something other than a button?
                submitControl = $(event.target).closest('button')[0];
            } else {
                submitControl = event.target;
            }
        });
    };

});
/*global pn */
/**
Toggle
======

Converts a `select` element to a button that cycles between its options.
*/

pn.module('toggle', function (toggle, $) {
    'use strict';

    var selectToRadio = function (select) {
        // TODO: decide how to handle <label for="foo"></label><select id="foo">...</select>
        select = $(select);
        var label = select.closest('label');
        if (label[0] === select[0]) {
            select = label.children('select');
        }
        pn.assert(select.length === 1 && select.is('select'),
            'toggle takes exactly one select element');
        var options = select.children('option');
        pn.assert(options.length, 'toggle requires at least one option');
        var fieldset = $('<fieldset></fieldset>');
        if (label.length) {
            $('<legend></legend>').appendTo(fieldset)
                .append(label.contents().filter(function () {
                    return !$(this).is('select');
                }));
        }
        var id = select.attr('name') || pn.uuid();
        fieldset[0].className = select[0].className + ' pn-toggle';
        fieldset[0].className += label.length ? ' ' + label[0].className : '';
        options.each(function () {
            var option = $(this);
            var radio = $('<input type="radio">')
                .attr({name: id, value: option.val()})
                .prop('checked', option.is(':selected'));
            radio[0].className = this.className;
            var label = $('<span></span>').text(option.text());
            $('<label></label>').append(label).append(radio).appendTo(fieldset);
        });
        var markLabel = function () {
            // TODO: "next" class should skip disabled radio buttons
            var selected = fieldset.children()
                .removeClass('pn-toggle-next')
                .removeClass('pn-toggle-checked')
                .find('input:checked')
                    .parent()
                    .addClass('pn-toggle-checked');
            var notDisabled = function () {
                return !$(this).children('input').is(':disabled');
            };
            var nextAll = selected.nextAll().filter(notDisabled);
            var next = nextAll.length && nextAll.first()
                || fieldset.children('label').filter(notDisabled).first();
            next.addClass('pn-toggle-next');
        };
        markLabel();
        fieldset.replaceAll(label.length ? label : select);
        var inputs = fieldset.find('input');
        inputs.on('change', markLabel);
        return {
            toggles: inputs.length && inputs || fieldset.children(),
            update: markLabel
        };
    };

    /**
    Change the given select element or label containing a single select element to a fieldset with a
    radio button group. This allows more styling flexibility and is more convenient than hand-
    creating a group of radio buttons because it takes less markup and auto-generates unique name
    for the radio group.

    Returns the jQuery bag of radio buttons just created, to make attaching a change handler
    convenient.

        !!!
        <select class="foo">
            <option>Turn on</option>
            <option value="off" class="bar">Turn off</option>
        </select>
        <script>
            pn.toggle(this).on('change', function () {
                $('<p></p>').text($(this).val()).appendTo(example)
            })
        </script>

    Generated markup follows this structure:

        fieldset.pn-toggle
            legend "present if select is labeled"
            label
                span "option text"
                input[type=radio][value="option value"]
            ...

    So that this can be styled as a stateful button, toggle adds a change handler that synchronizes
    classes on the labels with radio button state:

    - `pn-toggle-checked`: selected option
    - `pn-toggle-next`: next option the list after the selected one, wrapping around

    The application's CSS can then hide the other labels to give the appearance of a stateful
    button. See [Bones layout](#css/bones/layout.less) for styling examples.

    > - TODO: for accessibility, need a way to outline a focused group
    > - TODO: would be nice to copy classes from the option to the label
    */
    toggle = function (select) {
        return selectToRadio(select).toggles;
    };

    var eventNamespace = pn.uuid();
    var _toggleAll = function (master, slaves) {
        master = $(master).any('input, select');
        if (master.length === 0){
            console.warn('toggleAll called with no master');
            return;
        } else if (master.is('select')) {
            var masterToggle = selectToRadio(master);
            master = masterToggle.toggles;
            master.eq(1).attr('disabled', true); // user-selecting "indeterminate" makes no sense
            pn.assert(master.length === 3, 'select used as master checkbox must contain 3 options');
            master.closest('fieldset').addClass('pn-master-toggle');
        } else {
            master.closest('label').addClass('pn-master-toggle');
        }
        slaves = $(slaves).any('input');
        var update = function () {
            var mixed = false;
            var allOn = true;
            var first;
            slaves.each(function () {
                if (!this.checked) {
                    allOn = false;
                }
                if (first == null) {
                    first = this.checked;
                }
                if (first !== this.checked) {
                    mixed = true;
                }
            });
            if (master.is('[type=checkbox]')) {
                master.prop({checked: allOn, indeterminate: mixed});
            } else {
                if (mixed) {
                    master.eq(1).prop('checked', true);
                } else {
                    master.eq(allOn ? 0 : 2).prop('checked', true);
                }
                masterToggle.update();
            }
        };
        var change = 'change.' + eventNamespace;
        slaves.off(change).on(change, update);
        master.off(change).on(change, function () {
            // This does NOT fire a change event on the slaves. Perhaps it should, but that's not
            // entirely obvious
            if (master.is('[type=checkbox]')) {
                slaves.prop('checked', this.checked);
            } else {
                var checked = master.filter(':checked');
                if (checked[0] === master[0]) {
                    slaves.prop('checked', true);
                } else {
                    slaves.prop('checked', false);
                }
            }
        });
        update();
        return master;
    };

    /**
    Add "select all" behavior to the given master checkbox for a group of slave checkboxes.

        !!!
        <label><input type="checkbox"><span>Select all</span></label>
        <label><input type="checkbox"><span>Bacon</span></label>
        <label><input type="checkbox"><span>Eggs</span></label>
        <script>
            pn.toggle.toggleAll(this.first(), this.slice(1))
        </script>

    Calling more than once detaches handlers it previously attached to the nodes so you can add
    nodes to the slave group and call it again. This design needs reconsideration and may change in
    the future since it does not provide for removing slaves from a group.

    The master checkbox can also be a `<select>`, which would this would convert to radio buttons by
    running it through `toggle()`. If used this way, the select must contain exactly three options.
    The option values may be anything you like, but this treats the first as "checked", the middle
    as "indeterminate" and the last as "unchecked."

        !!!
        <label>
            <span>Toggle all</span>
            <select>
                <option value="checked">On</option>
                <option value="indeterminate">Indeterminate</option>
                <option value="">Off</option>
            </select>
        </label>
        <label><input type="checkbox"><span>Spam</span></label>
        <label><input type="checkbox"><span>Scrapple</span></label>
        <script>
            pn.toggle.toggleAll(this.first(), this.slice(1))            
        </script>

    For styling, this adds the class `pn-master-toggle` to the master label, or, if using a
    converted select, the fieldset.
    */
    toggle.toggleAll = function (master, slaves) {
        _toggleAll(master, slaves);
    };

    /**
    > Experimental - no error handling yet

    Add "collapsible" behavior to sections of a document. This hooks up the header button to the
    "expand" checkbox and gives the sections a class of `pn-inactive` when the expand checkbox is
    unchecked. CSS can then use that class to hide or show the content.

        !!!
        <label><input type="checkbox">Expand all</label>
        <section>
            <button><h5>Section one title</h5></button>
            <label><input type="checkbox" checked>Expand section</label>
            <div>Section one content</div>
        </section>
        <section>
            <button><h5>Section two title</h5></button>
            <label><input type="checkbox" checked>Expand section</label>
            <div>Section two content</div>
        </section>
        <script>
            pn.toggle.toggleSections(this.first(), this.slice(1))
        </script>
    
    See [mixins](#../css/mixins/mixins.less) for styling information.
    */
    toggle.toggleSections = function (master, sections) {
        var sectionParts = sections.map(function (i, section) {
            section = $(section);
            var breakdown = {
                header: section.children().first(),
                toggle: section.children().eq(1),
                content: section.children().slice(2),
                update: function () {
                    if (breakdown.toggle.find('input').is(':checked')) {
                        section.removeClass('pn-inactive');
                    } else {
                        section.addClass('pn-inactive');
                    }
                }
            };
            breakdown.toggle.find('input').attr('tabindex', -1);
            breakdown.update();
            breakdown.header.on('click', function () {
                breakdown.toggle[0].click();
            });
            breakdown.toggle.find('input').on('change', breakdown.update);
            return breakdown;
        });
        var toggles = $();
        $.each(sectionParts, function () {
            toggles = toggles.add(this.toggle);
        });
        var masterToggle = _toggleAll(master, toggles);
        masterToggle.on('change', function () {
            $.each(sectionParts, function () {
                this.update();
            });
        });
    };

    return toggle;
});
/**
Modal
-----

Add modal behavior to user interface elements.

This implements focus trapping 
*/

pn.module('modal', function (modal, $) {

    var trapNamespace = '.' + pn.uuid();

    /**
    Focus trapping as described similar to what is described in the
    [ARIA guidelines for modals](http://www.w3.org/WAI/PF/aria-practices/#modal_dialog). Unlike the
    implementation those guidelines describe, however, this injects a focus-trapping element at the
    end of the given container; *do not, therefore, append content to the container after giving it
    trap behavior.* It is safe, however, to call this multiple times on the same element; if a trap
    already exists, this reuses it.

    This normally would not be used alone, but in conjunction with another feature of modal user
    interface, such as menus or dialogs. Dialogs and menus add appropriate handlers to escape the
    focus trap, but if used standalone, the client code should generally provide an escape key
    handler that allows the user to exit:

        !!!
        <div class="trap">
            <p>Focus one of these buttons to enter the trap:</p>
            <button>Foo</button><button>Bar</button>
        </div>
        <p class="escape-target" tabindex="0">Cannot tab to here. Press escape.</p>
        <script>
            pn.modal.trap(example.find('.trap'))
            .on('keydown', pn.onkey(['escape'], function () {
                example.find('.escape-target').focus()
            }))
        </script>
    */
    modal.trap = function (container) {
        container = $(container);
        container.each(function () {
            // Use these focus trapping nodes because it seems more robust than the aria-suggested
            // method of keystroke trapping. That is, it should handle cases where the user moves
            // focus by mechanisms other than keystrokes, like that little wheel on the blackberry.
            var wrapper = $(this);
            var trap = wrapper.children('.pn-focus-trap');
            if (trap.length) {
                trap.off(trapNamespace);
                wrapper.off(trapNamespace);
            } else {
                trap = pn.newLegalChild(wrapper)
                    .addClass('pn-focus-trap')
                    .attr('tabindex', 0)
                    .css({
                        display: 'block',
                        position: 'absolute',
                        height: 0,
                        width: 0,
                        border: 'none',
                        margin: 0,
                        padding: 0
                    })
                    .appendTo(wrapper);
            }
            trap.on('focus' + trapNamespace, function () {
                    wrapper.focus();
                });
            wrapper.attr('tabindex', 0)
                .on('focus' + trapNamespace, function () {
                    // TODO: aria recommends that focus go to the control that would allow escaping,
                    //       but first control seems more natural. Handle that here?
                    wrapper.find(':focusable').not(trap).first().focus();
                });
        });
        return container;
    };

});/**
> In progress - don't use yet

Wrap some content in a nest of divs that allows default CSS to position it horizontally and
vertically centered within its container.

See [position style](#../css/position/popup.less) for the markup structure this creates.
*/

pn.module('center', function (center, $) {
    'use strict';
    /**
    Given some content, wrap the content in the necessary positioning structure and append it to the
    given container. This gives the container element a `pn-center-wrapper` class and the wrapper
    it creates as a direct parent of the content a `pn-centered` class.

    This returns `pn-centered` jQuery object.

    The container must be "positioned" in CSS parlance, for this to correctly center the content.
    That is, it's position set `relative`, `absolute` or `fixed`. Generally, the container's height
    will also be set to some explicit value.
    */
    center = function (content, container) {
        var wrapper = $('<div class="pn-center-wrapper"><div><div>' +
                            '<div class="pn-centered"></div>' +
                        '</div></div></div>');
        wrapper.append(content).appendTo(container);
        return wrapper.find('.pn-centered');
    };

    return center;
});/**
Menu
====

Menus that allow styling and arbitrary content.
*/

pn.module('menu', function (menu, $) {

    var cycleFocus = function (container, next, prev, items) {
        var containing = function (element) {
            return items().filter(function () {
                return $(this).any(element).length;
            });
        };
        var cycle = function (event, nextIndex) {
            var index = items().index(containing(event.target));
            items().eq(nextIndex(index)).any(':focusable').first().focus();
            event.preventDefault(); // Otherwise scrolling still happens
            // stopPropagation: for submenus, arg `container` is the options ul or ol.
            // prevent collapsing to root menu on keydown left or right.
            event.stopPropagation();
        };
        var focusNext = function (event) {
            cycle(event, function (index) {
                return items().length === index + 1 ? 0 : index + 1;
            });
        };
        var focusPrev = function (event) {
            cycle(event, function (index) {
                return index === 0 ? items().length - 1 : index - 1;
            });
        };
        container
            .on('keydown', pn.onkey([next], focusNext))
            .on('keydown', pn.onkey([prev], focusPrev))
            .on('focusnext', focusNext)
            .on('focusprev', focusPrev);
    };

    var toggleOptions = function (options, forceVisible, position) {
        if (options.is('.pn-menu')) {
            options = options.children('ul, ol');
        }
        pn.assert(options.is('ul, ol'), 'could not toggle options: invalid selector for options');

        var visible = forceVisible == null ? !options.is(':visible') : forceVisible;
        var opener = options.siblings('legend').find('button');
        var isSubmenu = !! options.closest('.pn-menu').parents('.pn-menu').length;
        var posRef = isSubmenu ? options.closest('.pn-menu').closest('li') : opener;

        if (visible) {
            if( !position ){
                position = posRef.offset();
                position.width = posRef.outerWidth();
                position.height = posRef.outerHeight();
            } else if ( position.width === undefined ){
                position.height = 0;
                position.width = 0;
            }
            
            // Positioning css with JavaScript because it's essential to correct behavior
            // show first to get dimension
            options.show();
            options.css({
                left: (function() {
                    var max = $(window).width() - options.outerWidth();
                    var ideal = position.left + (isSubmenu ? position.width : 0);
                    if (ideal < max) {
                        return ideal;
                    }
                    if (isSubmenu) {
                        return position.left - options.outerWidth();
                    }
                    return max < 0 ? 0 : max;
                })(),
                top: (function() {
                    var max = $(window).height() - options.outerHeight();
                    var refTop = position.top;
                    var refBtm = refTop + position.height;
                    var ideal = isSubmenu ? refTop : refBtm;
                    if (ideal < max) {
                        return ideal;
                    }
                    return max < 0 ? 0 : max;
                })()
            });
            options.focus();
        } else {
            // TODO: this should return focus to some sensible place. Probably something like look
            //      for the element(s) that control this menu, say first the "opener," then any
            //      aria-controls that target this, then focusable siblings, etc.
            options.hide();
        }
        opener.closest('fieldset').toggleClass('pn-menu-open', visible);
    };

    var createMenu = function (legend, options) {
        var ariaControlsId = pn.uuid();
        var isSubmenu = !! options.closest('.pn-menu').parents('.pn-menu').length;

        // type="button" is specified to avoid submit conflicts in forms
        var opener = $('<button type="button"></button>')
            .addClass('pn-menu-opener')
            .toggleClass('pn-menu-submenu-opener', isSubmenu)
            .append(legend.contents())
            .on('click', function() {
                toggleOptions(options);
            })
            .on('keydown', pn.onkey([(isSubmenu ? 'right' : 'down')], function (event) {
                event.preventDefault(); // prevent scrolling.
                event.stopPropagation(); // prevent focusing on opener (see below options.on('keydown'...) ).
                toggleOptions(options, true);
            }))
            .attr('aria-haspopup', true)
            .attr('aria-controls', ariaControlsId)
            .appendTo(legend);

        options
            .attr('id', ariaControlsId)
            .css({
                position: 'fixed'
            })
            .on('keydown', pn.onkey(['escape', 'left'], function (event) {
                event.stopPropagation(); // prevent collapsing to top level.
                opener.focus();
            }))
            .on('focusleave', function (event) {
                if (event.type === 'mousedown' && opener.any(event.target).length) {
                    // Exit early so clicking the opener for an open menu does not cause a blink
                    return;
                }
                toggleOptions(options, false);
            });
        if (!isSubmenu) {
            options
                .on('keydown', pn.onkey(['left'], function () {
                    opener.trigger('focusprev');
                }))
                .on('keydown', pn.onkey(['right'], function () {
                    opener.trigger('focusnext');
                }));
        }
        pn.modal.trap(options);
        cycleFocus(options, 'down', 'up', function () {
            return options.children('li').filter(function () {
                return $(this).any(':focusable').length;
            });
        });

        toggleOptions(options, false);

        createSubmenus(options);
    };
    var createSubmenus = function(options) {
        options.children('li')
            .filter(function() {
                return $(this).find('ul, ol').length;
            })
            .each(function() {
                fromLi($(this));
            });
    };

    var fromFieldset = function (fieldset) {
        var legend = fieldset.children().first();
        pn.assert(legend.length === 1 && legend.is('legend'),
            'First child of <fieldset> must be a <legend>');

        var options = fieldset.children('ul, ol');
        if (!options.length) {
            options = $('<ul></ul>').appendTo(fieldset);
        } else {
            pn.assert(options.length === 1, 'Fieldset for menu conversion contains too many lists');
        }

        fieldset.children().not('legend, ul, ol').each(function () {
            $('<li></li>').append(this).appendTo(options);
        });
        fieldset.addClass('pn-menu');
        createMenu(legend, options);
        return fieldset;
    };

    var fromSelect = function (label) {
        var labelInfo = label.children().not('select');
        var selects = label.children('select');
        pn.assert(labelInfo.length, 'select must be labeled by a parent label element to convert to menu');
        pn.assert(selects.length === 1, 'label must contain exactly one select to convert to menu');
        var fieldset = $('<fieldset></fieldset>')
            .addClass(label.attr('class')).addClass(selects.attr('class'))
            .append($('<legend></legend>').append(labelInfo));

        function getAttrs(elm) {
            var attrs = elm.attributes;
            attrs = Array.prototype.reduce.call(attrs, function(map, attr) {
                map[attr.name] = attr.value;
                return map;
            }, {});
            return attrs;
        }

        function convertOption (option) {
            return $('<li></li>')
                .append($('<button type="button"></button>')
                    .attr(getAttrs(option[0]))
                    .prop('disabled', option.prop('disabled'))
                    .append(option.contents())
                    .on('click', function () {
                        // auto close options
                        fieldset.find('legend button').focus();
                    }));
        }
        function convertSelChildren (selChildren, parentList) {
            selChildren.each(function() {
                var selChild = $(this);
                if (selChild.is('optgroup')) {
                    // even though optgroup is supposed to be a direct child, support nesting anyway.
                    convertSelChildren(
                        selChild.children(),
                        $('<ul></ul>').appendTo(
                            $('<li></li>')
                                .attr('label', selChild.attr('label'))
                                .appendTo(parentList)));
                } else if(selChild.attr('role') === 'separator') {
                    $('<hr>').addClass(selChild.attr('class')).appendTo(parentList);
                } else {
                    convertOption(selChild).appendTo(parentList);
                }
            });
        }
        convertSelChildren(selects.children(), $('<ul></ul>').appendTo(fieldset));

        label.replaceWith(fieldset);
        return fromFieldset(fieldset);
    };

    var fromLi = function (li) {
        var liInfo = li.attr('label');
        pn.assert(liInfo, 'Submenu <li> must have attr `label`, which becomes the legend.');
        var fieldset = $('<fieldset></fieldset>')
            .addClass(li.attr('class'))
            .append($('<legend></legend>').append(liInfo))
            .append(li.children())
            .appendTo(li); // append to DOM before `fromFieldset` so that `createMenu` can evaluate `isSubmenu` correctly.
        return fromFieldset(fieldset);
    };

    var refreshOptions = function (menus, label, optionsContents) {
        var optionsPerMenu = $(menus).map(function() {
            var menu = $(this);
            var options = label == null ?
                menu.children('ul, ol') :
                menu.find('ul[label="' + label + '"]');
            pn.assert(options.length <= 1, 'Can\'t find unique ' +
                (label == null ? 'top-level options' : 'option for label ' + label));

            options.children().remove();
            return options[0];
        });

        optionsContents = $(optionsContents).map(function() {
            var option = $(this);
            if (option.is('ul, ol')) {
                return option.children().toArray();
            }
            if (! option.is('li')) {
                option = $('<li></li>').append(option);
            }
            return option[0];
        });
        optionsContents.appendTo(optionsPerMenu); // clone into all menus, not just one

        optionsPerMenu.each(function(i, options) {
            options = $(options);
            pn.modal.trap(options);
            createSubmenus(options);
        });
    };

    /**
    Transform a `<fieldset>` or a `<select>` into a custom menu. This wraps all content but the `<legend>`
    content in a `<ul>` that is normally hidden, where each `<li>` is a menu option. The legend
    content gets wrapped in a button that shows the options.

    `pn.menu(...)` returns a jQuery object selecting nodes that contain all options, either a 
    `<ul>` or a `<ol>`, so that client code can then easily add event handlers.

        !!!
        <fieldset>
            <legend>Choose action</legend>
            <button>Foo</button>
            <hr>
            <button>Bar</button>
        </fieldset>
        <script>
            example.find('button').on('click', function () {
                alert($(this).text())
            })
            pn.menu(example.find('fieldset'))
        </script>

    Attach handlers to menu contents (buttons above), as normal, but *do not* override the arrow key
    or escape key handlers, since those have expected menu behavior.

    If the fieldset contains a `<ul>` or `<ol>`, this modifies that element instead of creating a 
    new one, making more complex menus possible:

        !!!
        <fieldset class="my-fieldset">
            <legend>Links menu</legend>
            <ol>
                <li>
                    <a href="https://google.com">Google</a>
                    <a href="https://duckduckgo.com">Duck Duck Go</a>
                </li>
                <li><span>Start next menu item (try down arrow)</span>
                    <a href="https://developer.mozilla.org">MDN</a></li>
            </ol>
        </fieldset>
        <script>
            pn.menu(example.find('fieldset'))
            .find('a').attr('target', '_blank')
            .on('click', function () {
                // Sending focus elsewhere closes the menu:
                example.find('fieldset legend button').focus()
            })
        </script>

    This can also transform ordinary `<select>` elements into menu `<fieldset>` elements. The select
    must be properly labeled with a parent `<label>` element.

    From `<label>` and `<select>`, classes are transferred to the generated `<fieldset>`.

    From each `<option>`, all attributes including `value` and `class`, as well as `disabled` property
    are transferred to the generated button.

    To represent an horizontal divider, use an `<option role="separator">`. `disabled` attr is not necessary.

    To find generated buttons, use either `button:not(.pn-menu-opener)` or `button[value]`.

        !!!
        <label class="my-label foobar-actions">
            <span>Choose action</span>
            <select class="my-select foobar-actions">
                <option value="foo">Option foo</option>
                <option role="separator"></option>
                <option value="bar"
                    class="bar-option the-best-option"
                    some-attr="some-value"
                    disabled>Option bar</option>
            </select>
        </label>
        <script>
            pn.menu(example.find('select'))
                .find('button[value]')
                .on('click', function () {
                    alert(this.value)
                })
        </script>

    When converted from a `<select>`, clicking on an option button auto-closes the menu.

    > Note that without using `pn.menu`, selects in this structure can also be styled for a somewhat
    > custom effect using, for example, the vanilla theme's "better-select" mixin.

    This converts select options into buttons, so select change handlers must become click handlers
    on the buttons, as shown previously.

    Though not entirely compatible with `<select>` since code handling a select must 

    Passing a list of elements creates a menu bar, its main characteristic being that left and right
    arrow keys navigate between the dropdowns.

        !!!
        <fieldset>
            <legend>Menu One</legend>
            <a href="http://www.google.com">Google</a>
            <a href="http://www.bing.com">Bing</a>
        </fieldset>
        <fieldset>
            <legend>Menu Two</legend>
            <a href="http://www.bbc.co.uk">BBC</a>
            <a href="http://www.cnn.com">CNN</a>
        </fieldset>
        <fieldset>
            <legend>Menu Three</legend>
            <a href="http://www.dailymail.co.uk/">Daily Mail</a>
            <a href="http://www.buzzfeed.com/">Buzzfeed</a>
        </fieldset>
        <script>
            example.find('a').attr('target', '_blank')
            pn.menu(example.find('fieldset'))
        </script>

    Nested lists and optgroups are converted to sub-menus.

    Nested `<ul>` and `<ol>` must be labelled with a `label` attribute, borrowing from
    the native html attribute of the same name belonging to `<optgroup>`.

    Menus and submenus attempt to align themselves horizontally and vertically to avoid spilling over 
    the window. To experiment, move the menus to the right, and scroll so that the menus are near the
    bottom of the window. The alignment logic is pretty crude; we could support scrolling, e.g.

        !!!
        <div class="menus">
            <fieldset>
                <legend>Links menu</legend>
                <ol>
                    <li>
                        <a href="https://google.com">Google</a>
                        <a href="https://duckduckgo.com">Duck Duck Go</a>
                    </li>
                    <li label="News">
                        <ul>
                            <li><a href="http://www.bbc.co.uk">BBC</a></li>
                            <li label="Sensationalist News">
                                <ul>
                                    <li><a href="http://www.dailymail.co.uk/">Daily Mail</a></li>
                                    <hr class="some-additional-class"></hr>
                                    <li><a href="http://www.buzzfeed.com/">Buzzfeed</a></li>
                                </ul>
                            </li>
                            <li label="Tech News">
                                <ul>
                                    <li><a href="//www.wired.com">Wired</a></li>
                                    <li><a href="//www.theverge.com">The Verge</a></li>
                                </ul>
                            </li>
                            <li><a href="http://www.cnn.com">CNN</a></li>
                        </ul>
                    </li>
                    <li label="Recipes">
                        <ul>
                            <li><a href="http://www.foodnetwork.com/">Food Network</a></li>
                            <li><a href="http://allrecipes.com/">All Recipes</a></li>
                        </ul>
                    </li>
                    <li><a href="https://developer.mozilla.org">MDN</a></li>
                </ol>
            </fieldset>
            <label>
                <span>Choose action</span>
                <select>
                    <option value="foo">Option foo</option>
                    <optgroup label="Good Options">
                        <option role="separator"></option>
                        <option value="baz">Option baz</option>
                        <option value="bam">Option bam</option>
                    </optgroup>
                    <option value="bar"
                        class="bar-option the-best-option"
                        some-attr="some-value"
                        disabled>Option bar</option>
                    <option role="separator" class="some-additional-class"></option>
                    <option value="bat">Option bat</option>
                </select>
            </label>
        </div>
        <button class="menus-move" style="display: block; clear: both;">Move Menus Left <-> Right</button>
        <script>
            example.find('a').attr('target', '_blank')
            example.find('.menus-move').on('click', function() {
                var menus = example.find('.menus');
                menus.css({
                    float: menus.css('float') === 'right' ? 'none' : 'right'
                })
            })

            pn.menu(example.find('fieldset, label'))
                .find('button[value]')
                .on('click', function () {
                    alert(this.value)
                })
        </script>
    */
    menu = function (element) {
        var fieldsets = $(element).map(function () {
            var container = $(this);
            if (container.is('fieldset')) {
                return fromFieldset(container)[0];
            } else if (container.is('select') || container.is('label')) {
                return fromSelect(container.closest('label'))[0];
            } else {
                throw 'Cannot convert ' + container[0].nodeName + ' to menu';
            }
        });
        var openers = fieldsets.children('legend').find('button');
        cycleFocus(openers, 'right', 'left', function() {
            return openers;
        });
        // Return just the group of buttons
        return fieldsets.children('ul, ol');
    };

    /**
    Open the menu that contains the given element. This may be used to subvert `pn.menu` for menus
    that open in ways other than clicking their opener. A context menu, for example:

        !!!
        <div style="display: inline-block; width: 300px; height: 200px; background-color: #ddd;">
            Right-click on this!
        </div>
        <fieldset>
            <legend>Context menu</legend>
            <button>Foo</button>
            <button>Bar</button>
        </fieldset>
        <script>
        example.find('button').on('click', function() {
            alert($(this).text())
        })
        var options = pn.menu(example.find('fieldset'))
        example.find('div')
            .on('contextmenu', function (event) {
                event.preventDefault();
                pn.menu.open( options,  // user can pass options or menu
                    {
                        left: event.pageX,
                        top: event.pageY
                    } 
                )
                
            })
        </script>
    */
    menu.open = function (element, position) {
        // TODO: recursive menu opening
        var container = $(element).closest('.pn-menu');
        toggleOptions(container.children().not('legend'), true, position);
    };

    /**
    Close the menu that contains the given element.
    */
    menu.close = function (element) {
        var container = $(element).closest('.pn-menu');
        toggleOptions(container.children().not('legend'), false);
    };

    /**
    You can replace the list of options in a top-level menu or a submenu using
    `pn.menu.refreshOptions`.
    To replace the top-level menu, provide `null` as the `label` arg.

    Replacement elements and their event handlers are copied to appropriate locations
    inside every menu selected.

        !!!
        <fieldset class="my-menu">
            <legend>Links menu</legend>
            <ol>
                <li>
                    <a href="https://google.com">Google</a>
                    <a href="https://duckduckgo.com">Duck Duck Go</a>
                </li>
                <li label="News">
                    <ul>
                        <li><a href="http://www.bbc.co.uk">BBC</a></li>
                        <li label="Sensationalist News">
                            <ul>
                                <li><a href="http://www.dailymail.co.uk/">Daily Mail</a></li>
                                <hr class="some-additional-class"></hr>
                                <li><a href="http://www.buzzfeed.com/">Buzzfeed</a></li>
                            </ul>
                        </li>
                        <li label="Tech News">
                            <ul>
                                <li><a href="//www.wired.com">Wired</a></li>
                                <li><a href="//www.theverge.com">The Verge</a></li>
                            </ul>
                        </li>
                        <li><a href="http://www.cnn.com">CNN</a></li>
                    </ul>
                </li>
                <li label="Recipes">
                    <ul>
                        <li><a href="http://www.foodnetwork.com/">Food Network</a></li>
                        <li><a href="http://allrecipes.com/">All Recipes</a></li>
                    </ul>
                </li>
                <li><a href="https://developer.mozilla.org">MDN</a></li>
            </ol>
        </fieldset>
        <label class="my-menu">
            <span>Choose action</span>
            <select>
                <option value="foo">Option foo</option>
                <optgroup label="News">
                    <option value="baz">Option baz</option>
                    <option value="bam">Option bam</option>
                </optgroup>
                <option value="bar"
                    class="bar-option the-best-option"
                    some-attr="some-value"
                    disabled>Option bar</option>
                <option role="separator" class="some-additional-class"></option>
                <option value="bat">Option bat</option>
            </select>
        </label>
        <div style="float: right; background-color: #ffa; padding: 3px;">
            <p>Click to refresh menu. To reset menu, reload this page.</p>
            <button class="technews" style="word-wrap: break-word; max-width: 100px;">'Tech News' submenu</button>
            <button class="news" style="word-wrap: break-word; max-width: 100px;">'News' submenu in both menus</button>
            <button class="top" style="word-wrap: break-word; max-width: 100px;">Both top-level menus</button>
        </div>
        <ul class="repl-news-submenu">
            <li><a href="//www.nbc.com" target="_blank">NBC</a></li>
            <li><a href="//www.aljazeera.com" target="_blank">Al Jazeera</a></li>
            <ul label="Fake News">
                <li><a href="//www.theonion.com">The Onion</a></li>
                <li><a href="//thecolbertreport.cc.com">Colbert Report</a></li>
            </ul>
            <button>poke me</button>
        </ul>
        <script>
            example.find('a').attr('target', '_blank')
            var replNewsSubmenu = example.find('.repl-news-submenu').remove();
            replNewsSubmenu.find('button').on('click', function() {
                alert('ow don\'t poke that hard!')
            });
            pn.menu(example.find('.my-menu'))
                .find('button[value]')
                .on('click', function () {
                    alert(this.value)
                })
            example.find('.technews').on('click', function() {
                pn.menu.refreshOptions(example.find('.my-menu'), 'Tech News', [
                    $('<a href="//techcrunch.com" target="_blank">Tech Crunch</a>'),
                    $('<a href="//arstechnica.com" target="_blank">Ars Technica</a>')
                ])
            })
            example.find('.news').on('click', function() {
                pn.menu.refreshOptions(example.find('.my-menu'), 'News', replNewsSubmenu)
            })
            example.find('.top').on('click', function() {
                pn.menu.refreshOptions(example.find('.my-menu'), null, [
                    $('<span>hey you</span>'),
                    $('<button>pull my finger</button>').on('click', function() {
                        alert('ow don\'t pull that hard!')
                    })
                ])
            })
        </script>
    */
    menu.refreshOptions = refreshOptions;

    return menu;
});/**
Popup
=====

Creates modal alerts and dialogs. Provides:

- Centering using css and a gaggle of wrapper divs
- Focus trapping, that is, modal behavior
- Form submission convenience

*/

/*global pn, DragDrop */

pn.module('popup', function (popup, $) {
    'use strict';

    var dialog = function (content, onsubmit) {
        content = $(content);
        if (content.length !== 1 || content.filter('form').length !== 1) {
            content = $('<form></form>')
                .append(content)
                .append(
                    // We want to standardize the class names of this div and its buttons, for styling purpose.
                    // If defining your own <form>, make sure to set the classes correctly.
                    // If using <input>s in lieu of <button>s, add class="btn" to each.
                    $('<div class="popup-bottom"></div>')
                        .append($('<label></label>').append(
                            $('<input name="cancel" class="btn" type="submit" data-no-label-needed>').prop('value', pn.s.cancel)
                                .on('click', function () {
                                $(this).closest('form').attr('novalidate', '');
                            }))
                        )
                        .append($('<label></label>').append(
                            $('<input name="ok" class="btn btn-primary" type="submit" data-no-label-needed>').prop('value', pn.s.ok)
                        ))
                )
            ;
        }
        pn.form.onsubmit(content, function () {
            // TODO: remove should happen after calling onsubmit so it can be used for validation
            // but not done now because existing code would cause duplicate element id
            pn.popup.close(content);
            return onsubmit.apply(this, arguments);
        });
        return content;
    }, draggable = function (handle, popup) {
        DragDrop.makeDraggable(handle, {
            drop: function (a, b, c, helper) {
                popup.css({
                    position: 'fixed',
                    top: helper.offset().top,
                    left: helper.offset().left
                });
            },
            helper_rect: {
                width: function () {
                    return popup.outerWidth();
                },
                height: function () {
                    return popup.outerHeight();
                }
            },
            // TODO: bound may not work as expected if you move the popup into something
            bound: $(window)
        });
    };

    /**
    Create a popup.

        !!!
        <button>Show with title</button>
        <button>Show without title</button>
        ---
        <div class="popup-example">
            <p>Hello, world</p>
        </div>
        <script>
            var content = this;
            example.find('button').first().on('click', function () {
                content.popup({title: 'Example'});
            });
            example.find('button').last().on('click', function () {
                content.popup();
            });
        </script>

    This returns a jQuery object that wraps the popup content. Extraneous wrapper divs allow css
    positioning for vertical and horizontal centering:

        .pn-popup-wrapper
            div (for css positioning only)
                div (for css positioning only)
                    .pn-popup
                        .pn-titlebar (optional)
                            h2 (title content)
                            button (close)
                        .pn-body
                            (content)
                        .pn-footer (traps focus - must not contain content)

    The .pn-titlebar div is only present if the title attribute is set in popup options.

    The .pn-popup div, and .pn-footer div are focusable, to allow keyboard navigation. After opening
    the popup, it receives focus as described by the `pn.popup.focus` function.

    If the content has a title attribute, the popup receives a titlebar.

        !!!
        <button>Show with default title</button>
        <button>Show without title</button>
        ---
        <div class="popup-example" title="Example">
            <p>Hello, world</p>
        </div>
        <script>
            var content = this;
            example.find('button').first().on('click', function () {
                pn.popup(content.clone());
            });
            example.find('button').last().on('click', function () {
                pn.popup(content.clone(), {title: null});
            });
        </script>

    ### Options

    - **title**: text to put in a title bar on the popup, overriding the content title attribute. If
    set to null, forces no titlebar. 
    - **onsubmit**: if defined, this treats the popup as a dialog. See dialog handling below.
    - **preventCloseOnClick**: if true will prevent the popup from closing when clicking outside the popup area.
    - **preventCloseOnEscape**: if true will prevent the popup from closing when the escape key is pressed. 

    > Avoid the preventClose parameters when possible, since they defeat keyboard navigation. They
    > are currently present just to allow using popup for its centering capability without modal
    > behavior. Eventually, we should break this into two modules, one that just does the centering
    > business and another that adds modal behavior.

    ### TODO
    - return focus to previous on close

    ### Dialog handling

    Setting the `onsubmit` option causes the popup to be treated as a dialog. Dialogs provide
    conveniences for form handling. If the content is not already wrapped in a single form element,
    this wraps it in a form and adds "OK" and "Cancel" buttons. It attaches the callback to the
    root form's submit event using `pn.form.onsubmit`. Submitting the form closes the dialog, but
    closing the dialog by another means does not submit the form.

        !!!
        <label>Single value
            <input type="text" name="single" required></input>
        </label>
        <label>Multi-value
            <input type="checkbox" name="multi" value="first"></input>
            <input type="checkbox" name="multi" value="second"></input>
        </label>
        <script>
            var content = this;
            $('<button>Show</button>').on('click', function () {
                content.popup({
                    title: 'Example dialog',
                    onsubmit: function (event, data) {
                        $('<pre></pre>').text(JSON.stringify(data)).appendTo(example);
                    }});
            }).appendTo(example);
        </script>

    Both the "OK" and "Cancel" buttons submit the form, but the cancel button disables HTML 5
    validation. The `onsubmit` handler should check for the presence of either an `ok` property or a
    `cancel` property in the data object to determine what to do next.
    */
    popup = function (content, options) {
        options = options || {};
        var title = options.title;
        if (content.attr('title')) {
            title = (title || title === null) ? title : content.attr('title');
            content.attr('title', null);
        }
        content = options.onsubmit ? dialog(content, options.onsubmit) : content;

        // Extra divs to allow css positioning hacks and focus
        var wrapper = $('<div class="pn-popup-wrapper"><div><div>' +
                            '<div class="pn-popup" tabindex="0"><div class="pn-body"></div></div>' +
                        '</div></div></div>');
        var innerWrapper = wrapper.find('.pn-popup');
        // TODO: consider how to make this more generic and orthogonal. This implementation
        //      introduces dependencies on pn.pane and relies on the snippet script doing the
        //      right thing
        if (options.onsubmit) {
            innerWrapper.attr('role', 'dialog');
        }
        if (!options.preventCloseOnClick) {
            wrapper.on('mousedown', function (event) {
                // Mousedown instead of click because in the background receives a click in IE after
                // drag end
                if (!$(event.target).closest('.pn-popup').length) {
                    popup.close(wrapper);
                }
            });
        }
        if (!options.preventCloseOnEscape) {
            wrapper.on('keydown', pn.onkey(['escape'], function () {
                if (wrapper.find('.pn-titlebar').attr('aria-grabbed') !== 'true') {
                    popup.close(wrapper);
                }
            }));
        }
        if (title) {
            $('<div class="pn-titlebar"></div>')
                .append($('<h1></h1>')
                    .text(title)
                    .aria().labelFor(innerWrapper))
                .append($('<button class="pn-close"></button>')
                    .append($('<span></span>').text(pn.s.close))
                    .on('click', function () {
                        pn.popup.close(this);
                    }))
                .prependTo(innerWrapper);
        }
        innerWrapper.children('.pn-body').append(content);
        $('<div class="pn-footer" tabindex="0"></div>')
            // The footer's sole job is to trap focus and send it back to the top. No content.
            .on('focus', function () {
                pn.popup.focus(wrapper);
            })
            .appendTo(innerWrapper);
        $('body').append(wrapper);
        draggable(innerWrapper.children('.pn-titlebar'), innerWrapper);
        wrapper.data('prevActiveElement', document.activeElement);
        var focusable = innerWrapper.find(':focusable');
        if (focusable.length) {
            focusable.first().focus();
        } else {
            popup.focus(wrapper);
        }
        return wrapper;
    };

    /**
    Close the popup associated with the given element. The popup may also be closed simply by
    removing its wrapper element from the dom.
    */
    popup.close = function (element) {
        var wrapper = $(element).closest('.pn-popup-wrapper');
        wrapper.data('prevActiveElement').focus();
        wrapper.remove();
    };

    /**
    Give the popup associated with the given element focus. If the popup is a dialog, the first
    input element receives focus. Otherwise, this focuses the popup container.
    */
    popup.focus = function (element) {
        $(element).closest('.pn-popup-wrapper').find('.pn-popup')[0].focus();
    };

    $.fn.popup = function (options) {
        return popup(this, options);
    };
    return popup;

});
/**
 PopupMenu -- Contextual Menu Implementation
 ===========================================

 **Legacy. Do not use.**

 TODO:
 * Documentation
 * Examples
 * Integrate with docs
 */

/*global pn, $, document*/

pn.module('PopupMenu', function () {
    "use strict";
    var PopupMenu;

    PopupMenu = function () {
        console.warn('pn.PopupMenu is bad. Avoid.');
        this.menuItems = [];
    };

    PopupMenu.prototype = {
        /**
         * Target is the dom element to bind the popup menu to.
         * targetEvent is the event that triggers the popup to be show.
         * @param {object} target dom element that triggers the popup menu.
         * @param {string} targetEvent name of event to listen to.
         * @param {Object} around node which the popupmenu will show next to.
         */
        bind: function (target, targetEvent, around, isSubMenu) {
            var self = this;
            $(target).on(targetEvent, function (e) {
                var html = $(target).closest('body');
                if (!isSubMenu) {
                    // Hide any other popupmenus
                    html.click();
                }
                // Then show the popupmenu
                self.show(e, around);
                e.stopPropagation();
                html.one('click', function () {
                    self.hide();
                });
                return false;
            });
            return self;
        },

        /**
         * Adds a new menu item with the specified label.
         * @param {String} label
         * @param {Object} handlers
         */
        add: function (label, handlers) {
            this.menuItems.push({
                label: label,
                handlers: handlers
            });
            return this;
        },

        /**
         */
        addSubMenu: function (label, items) {
            this.menuItems.push({
                label: label,
                items: items
            });
            return this;
        },

        /**
         * Adds a separator to the menu items. Separator is added in order so if you do:
         *     popupmenu.add('First', cb1);
         *     popupmenu.addSeparator();
         *     popupmenu.add('Second', cb2);
         * the resulting menu will have 'First' as the first option, followed by
         * a separator and then 'Second'.
         */
        addSeparator: function () {
            this.menuItems.push(0);
            return this;
        },

        /**
         * Creates new menu and appends to the dom.
         */
        show: function (e, around) {
            if (this.menu) {
                this.hide();
            }
            var menu = this.menu = this.createMenu();
            menu.appendTo(around ? around.closest('body') : document.body);
            this.position(menu, e, around);
            return this;
        },

        /**
         * Removes menu from dom.
         */
        hide: function () {
            if (this.menu) {
                this.menu.remove();
                delete this.menu;
            }
            return this;
        },

        /**
         * If around node is specified, positions the popupmenu next to the target element.
         * Otherwise places next to mouse cursor.
         */
        position: function (menu, e, around) {
            var $e = $(e.target),
                offset = $e.offset(),
                box = {
                    left: offset.left,
                    top: offset.top,
                    width: $e.outerWidth(),
                    height: $e.outerHeight()
                };

            if (around) {
                menu.follow(around, {arrowSize: 0, offset: 0});
            } else {
                menu.offset({top: box.top + box.height, left: box.left});
            }
        },

        /**
         * Creates new menu. returns jquery object representing the menu.
         */
        createMenu: function () {
            var self = this,
                menu = $('<div/>', {'class': 'popUpMenu'}),
                menuItem;

            $.each(self.menuItems, function (index, value) {
                if (value === 0) { // separators are identified as '0' in the menuItems array
                    menuItem = self.createSeparator();
                } else {
                    if (value.handlers) {
                        menuItem = self.createMenuItem(value.label, value.handlers);
                    } else {
                        menuItem = self.createSubMenu(value.label, value.items);
                    }
                }
                menu.append(menuItem);
            });

            return menu;
        },

        /**
         * Creates new menu item with the given label. Hooks up handlers to
         * events on the menu item.
         * @param {string} label
         * @param {object} handlers
         */
        createMenuItem: function (label, handlers) {
            var menuItem = $('<div/>', {'class': 'popup-item'})
                .append($('<span/>', {html: label}));

            $.each(handlers, function (event, callback) {
                menuItem.on(event, callback);
            });

            if (typeof handlers.contextmenu !== 'function' && typeof handlers.click === 'function') {
                menuItem.on('contextmenu',  function (e) {
                    handlers.click.apply(this, arguments);
                    e.preventDefault();
                });
            }

            return menuItem;
        },

        createSubMenu: function (label, items) {
            var subMenu = new PopupMenu(),
                menuItem = $('<div/>', {
                    'class': 'popup-item'
                }).append($('<span/>', {
                    html: label + '&#8230;'
                }).append($('<span/>', {
                    'class': 'content-menu-submenu-icon',
                    html: '&#x25B8;'
                })));

            subMenu.bind(menuItem, 'mouseover', menuItem, true);

            $.each(items, function (index, value) {
                if (value.length) { // zero is falsy
                    subMenu.addSubMenu(value[0], value[1]);
                } else if (value.length === 0) {
                    subMenu.addSeparator();
                } else if (value.label) {
                    subMenu.add(value.label, value.handlers);
                }
            });

            return menuItem;
        },

        createSeparator: function () {
            return $('<div/>', {'class': 'popup-menu-separator'});
        },

        /**
         easy handles the creation of popup menus with sub-menus and handles binding to an element.
         Don't provide a follower argument if it is the same as element.

         easy expects an array of items containing the following:
         [] is a 'separator',
         ['Label', {click: clickHandle}] is a 'menu item' (or a sub-menu item) with an object of events & functions,
         ['Label', []] is a 'sub-menu', the empty array contains any number of 'separators', 'menu items', or 'sub-menus'

         example:
         var addBtn = $('#button-add'), // single element
            cm = new pn.PopupMenu();

         function clickHandle() {
            console.log('click');
         }
         addCM.easy([
             ['Grab', {click: clickHandle}], // menu item
             ['GrabX', {click: clickHandle}],
             [], // separator
             ['subMenu', [ // sub-menu
                 ['Grab', {click: clickHandle}], // sub-menu item (same as menu item)
                 [],
                 ['GrabX', {click: clickHandle}],
                 ['subMenu', [
                     ['Grab', {click: clickHandle}],
                     [],
                     ['GrabX', {click: clickHandle}]
                 ]]
             ]],
             ['GrabY', {click: clickHandle}]
         ], addBtn, 'contextmenu');
         **/
        easy: function (array, element, event, follower) {
            var self = this;
            $.each(array, function (index, value) {
                if (value.length === 0) {
                    self.addSeparator();
                } else if (value[1] && $.isArray(value[1])) {
                    self.addSubMenu(value[0], self.easyConvert(value[1]));
                } else {
                    self.add(value[0], value[1]);
                }
            });
            self.bind(element, event, follower || element);
        },

        //converts ez formatted sub-menu items into properly formatted items at all depths
        easyConvert: function (array) {
            var self = this,
                items = [];
            $.each(array, function (index, value) {
                if (value.length === 0) { // separator
                    items.push(value);
                } else if (value[1] && $.isArray(value[1])) { // sub-menu
                    items.push(value.length === 0 ? value : [value[0], self.easyConvert(value[1])]);
                } else {
                    items.push(value[1] && value[1].label ? value : { // ez menu item or proper menu item
                        label: value[0],
                        handlers: value[1]
                    });
                }
            });
            return items;
        }
    };

    return PopupMenu;
});/**
> Chopping block. Will be removed.
*/

pn.module('urlUtils', function (urlUtils) {
    "use strict";
    /**
     Normalizes a given url by removing extra '..' and '.', and replacing multiple slashes with a single one
     >         pn.urlUtils.normalize('/Test/../Path/./MyPath//'); //  returns '/Path/MyPath/'
     */
    urlUtils.normalize = function (url) {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.href = anchor.href; // For Internet Explorer
        return anchor.pathname.replace(/^\/?/, '/');
    };

    /**
     Relativizes the given url, using the parent
     */
    urlUtils.relativize = function (url, parent) {
        if (url.match(/^\//)) {
            return url;
        }
        return (parent || 'anything') + '/../' + url;
    };
});
/*jslint browser: true*/
/*global ActiveXObject, XDate */

pn.module('utils',function (utils, $) {
    "use strict";

    /**
     Tells an array how to sort the objects by a single field in the object.

     >         theArray.sort(pn.utils.sort_by('field_name', false, parseInt);
     >         theArray.sort(pn.utils.sort_by('field_name', false, function (a) { return a.toUpperCase(); });

     __field__ - The field in the object to use for sorting  
     __reverse__ - true to sort in reverse order  
     __primer__ - A function to apply to the field value to make it sortable.  
     __returns__ a comparator function to pass for sorting an array.  
     */
    utils.sort_by = function (field, reverse, primer) {
        var key = function (x) {
            return primer ? primer(x[field]) : x[field];
        };
        reverse = (reverse) ? -1 : 1;
        return function (a, b) {
            var L = key(a), R = key(b),
                retVal;
            if (L < R) {
                retVal = reverse * -1;
            } else if (L > R) {
                retVal = reverse;
            } else {
                retVal = 0;
            }
            return retVal;
        };
    };

    /**
     Tells an array how to sort the objects by a multiple fields in the object.
     >         theArray.sort(pn.utils.sort_by_multiple(false, function (obj) {
      >            return obj["LastName"].toUpperCase() + obj["FirstName"].toUpperCase();
      >         });

     __reverse__ - true to sort in reverse order  
     __key__ - A function to apply to the value to make it sortable.  
     __returns__ a comparator function to pass for sorting an array.  
     */
    utils.sort_by_multiple = function (reverse, key) {
        reverse = (reverse) ? -1 : 1;
        return function (a, b) {
            var L = key(a), R = key(b),
                retVal;
            if (L < R) {
                retVal = reverse * -1;
            } else if (L > R) {
                retVal = reverse;
            } else {
                retVal = 0;
            }
            return retVal;
        };
    };

    utils.binary_search = function (srcArray, findVal, fld) {
        var high = srcArray.length - 1;
        var low = 0;

        if (findVal === srcArray[high][fld]) {
            return high;
        }

        if (findVal === srcArray[0][fld]) {
            return 0;
        }

        while (low < high) {
            var mid = parseInt(low + (high - low) / 2, 10);

            if (findVal < srcArray[mid][fld]) {
                high = mid;
            }
            else if (findVal > srcArray[mid][fld]) {
                low = mid + 1;
            }
            else {
                while (findVal === srcArray[mid - 1][fld]) {
                    mid = mid - 1;
                }
                return mid;
            }
        }
        return -1;
    };

    /**
     * modified version of http://stackoverflow.com/a/1144249/616713.
     * Changed so that we don't need to alter Object's prototype.
     */
    utils.isEqual = function (a, b) {
        var p;
        for(p in a) {
            if(b[p] === undefined) {
                return false;
            }
        }

        for(p in a) {
            if (a.hasOwnProperty(p)) {
                switch(typeof(a[p])) {
                case 'object':
                    if (!utils.isEqual(a[p], b[p])) {
                        return false;
                    }
                    break;
                case 'function':
                    if (b[p] === undefined || a[p].toString() !== b[p].toString()) {
                        return false;
                    }
                    break;
                default:
                    if (a[p] != b[p]) {
                        return false;
                    }
                }
            } else if (b.hasOwnProperty(p)) {
                return false;
            }
        }

        for(p in b) {
            if(a[p] === undefined) {
                return false;
            }
        }

        return true;
    };

    // The functions below are candidates for a "strings" library.
    
    /**
     This checks if the argument is undefined and returns true or false.

     __obj__ - object being checked
     __returns__ true or false
     */
    utils.isUndefined = function (obj) {
        return typeof obj === 'undefined';
    };

    /**
     This checks if the argument is undefined or null and returns true of false.

     __obj__ - object being checked
     __returns__ true or false
     */
    utils.isNullOrUndefined = function (obj) {
        return utils.isUndefined(obj) || obj === null;
    };

    /**
     * Tests a string, which may not be a string, to see if it contains nothing.
     */
    utils.isBlank = function (obj) {
        return utils.isNullOrUndefined(obj) || obj === "";
    };
    
    utils.stripNull = function (obj) {
        if(!utils.isBlank(obj)) {
            return obj;
        } else {
            return "";
        }
    };
    
    /**
     * This allows us to add newlines in a field, such as address,
     * in a injection safe manner.
     */
    utils.safeTextWithNewlines = function (text) {
        var htmlLines = [];
        var lines = text.split(/\n/);
        var tmpDiv = $('<div/>');
        for (var i=0; i < lines.length; i++) {
            htmlLines.push(tmpDiv.text(lines[i]).html());
        }
        return htmlLines.join("<br/>");
    };

    /**
     * Checks to see if date is on a weekend and advances the
     * day to Monday.
     */
    utils.skipWeekends = function (dt) {
        if (dt.getDay() === 0) {
            dt.addDays(1, true);
        }
        if (dt.getDay() === 6) {
            dt.addDays(2, true);
        }
        return dt;
    };
    
    /**
     * This gets us a string representation of a date in the
     * preferred format. Options are:
     * <ol>
     *     <li>D - Date</li>
     *     <li>T - Time</li>
     *     <li>TS - Timestamp</li>
     * </ol>
     * Default is D.
     * 
     * hh for 12 hour clock
     * HH for 24 hour clock
     * TT for AM/PM
     */
    utils.getDateString = function (dt, type, isFirstUse) {
        var lDate = (dt ? new XDate(dt) : new XDate());
        var use12HourFormat = true;
        
        if (isFirstUse && (dt.indexOf('13') === 0 ||
                           dt.indexOf('32') === 3 ||
                           dt.indexOf('9999') > 0)) {
            return (dt.substring(0,2) === '13' ? '00' : dt.substring(0,2)) + '/' + 
                   (dt.substring(3,5) === '32' ? '00' : dt.substring(3,5)) + '/' + 
                   (dt.substring(6,20) === '9999' ? '0000' : dt.substring(6,10));
        }
        
        if (!lDate.valid()) {
            return null;
        }
        if (!type || type === "D") {
            return lDate.toString("MM/dd/yyyy");
        } else if (type === "T") {
            if (use12HourFormat) {
                return lDate.toString("h:mm tt");
            } else {
                return lDate.toString("HH:mm");
            }
        } else if (type === "TS") {
            if (use12HourFormat) {
                return lDate.toString("MM/dd/yyyy h:mm tt");
            } else{
                return lDate.toString("MM/dd/yyyy HH:mm");
            }
        } else {
            return lDate.toString(type);
        }
    };

    utils.selectText = function (element) {
        // you can either send this function an id selector or a single jquery element via get(0)
        var doc = document,
            text = typeof element === "string" ? doc.getElementById(element) : element,
            range,
            selection;

        if (doc.body.createTextRange) { 
            //IE
            range = doc.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        } else if (window.getSelection) { 
            //all others
            selection = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };
});

/*
Supported formats output by util.getDateString

USP timestamp uses the same format, except the year is two-digit

- MM/dd/yyyy
- MM/dd/yyyy HH
- MM/dd/yyyy HH:mm
- MM/dd/yyyy HH:mm:ss
- MM/dd/yyyy HH:mm:ss tt
*/
if (window.XDate) {
    XDate.parsers.push(function(string) {
        'use strict';
        var parts = string.split(' ');
        var dateTokens;
        var timeTokens;
        var parsed;

        if(parts[0]) {
            dateTokens = parts[0].split('/');
            if(dateTokens.length === 3) {
                parsed = [
                    (function() {
                        var yr = parseInt(dateTokens[2], 10);

                        if(dateTokens[2].length === 4) {
                            return yr;
                        }

                        // Handle USP year. Otherwise XDate will make 13 into 1913.
                        return yr < 50 ? (yr + 2000) : (yr + 1900);
                    })(), // year
                    parseInt(dateTokens[0] ? dateTokens[0]-1 : 0, 10), // month
                    parseInt(dateTokens[1], 10) // day
                ];

                if(parts[1]) {
                    timeTokens = parts[1].split(':');

                    parsed = parsed.concat(
                        (function() {
                            var hr = parseInt(timeTokens[0], 10);

                            if(parts[2] && parts[2].toLowerCase() === 'pm') {
                                hr += 12;
                            }

                            return hr;
                        })()
                    ); // hours
                    parsed = parsed.concat(parseInt(timeTokens[1], 10) || []); // minutes
                    parsed = parsed.concat(parseInt(timeTokens[2], 10) || []); // seconds
                }

                return XDate.prototype.constructor.apply(null, parsed);
            }
        }
    });
}
/*global console, ts, schemanator: true */
/*jslint browser: true */
(function () {
    'use strict';
    if (window.schemanator) {
        console.error("schemanator already defined");
        return;
    }

    /**
      <div style="text-align:center">
          <p><img src="images/schemanator.jpg"/><p>
          <p><i>"Behold the power of my Schemanator!!!"</i></p>
      </div>
      An object that can generate a schema and compare objects. The compare method will output
      the differences in properties. 'Schemas' can be compared to determine if json service
      'contracts' have changed.

          !!!
          <script>
            var woopwoop = {
                moe: "hair",
                larry: "lots of hair",
                curly: "no hair"
            };
            var wiseguy = {
                moe: "less hair",
                larry: "thinning hair",
                shemp: "hair still looks pretty goo"
            };

            example.append($('<pre/>').text(JSON.stringify(
                schemanator.generate(woopwoop),
                null, 4)));
            
            example.append($('<pre/>').text(JSON.stringify(
                schemanator.schemaDiff(woopwoop, wiseguy)
                )));
          </script>

      Dependencies: console, ts.ok.eq (for deep equal)
     */
    window.schemanator = {};

    /**
     * Is an object enumerable?
     */
    function isEnumerable(object) {
        var prop;
        if (typeof object === 'object') {
            if (object) {
                for (prop in object) {
                    if (object.hasOwnProperty(prop)) {
                        return true;
                    }
                }

            }
        }
        return false;
    }

    function isEmpty(obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Is an object an array?
     */
    function isArray(val) {
        if (typeof val === 'object') {
            if (val) {
                if (Object.prototype.toString.call(val) === '[object Array]') {
                    return true;
                }
            }
        }
        return false;
    }

    function isAlreadyDefinedInArray(schema, schema_list) {
        for (var i = 0; i < schema_list.length; i += 1) {
            if (ts.ok.eq(schema_list[i], schema)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add a property to a object schema
     */
    function addObjectProperty(property, object, schema) {
        schema.properties = schema.properties || {};

        //add this property to the object of properties
        schema.properties[property] = {};
        schema.properties[property].id = property;

        if (isArray(object)) {
            schema.properties[property].type = 'array';
        } else {
            schema.properties[property].type = typeof object;
        }
    }

    function enumerate(object, schema) {
        if (isArray(object)) {
            if (object.length) {
                enumerateArray(object, schema);
            }
        } else if (isEnumerable(object)) {
            enumerateObject(object, schema);
        } else {
            schema.type = typeof object;
        }
        return schema;
    }

    /**
     * Enumerate over an object and create a schema for each property
     */
    function enumerateObject(object, schema) {
        var prop;

        if (!object || !schema) {
            console.error('Object or Schema is undefined/null');
        }

        //enumerate over properties
        for (prop in object) {
            if (object.hasOwnProperty(prop)) {
                addObjectProperty(prop, object[prop], schema);
                enumerate(object[prop], schema.properties[prop]);
            }
        }
        return schema;
    }

    // enumerate and add property to a array schema
    function enumerateArray(array, schema) {
        var temp_schema;

        if (!array) {
            console.error('Array or Schema is undefined/null');
        }
        //enumerate array properties
        schema.items = [];
        for (var i = 0; i < array.length; i += 1) {
            temp_schema = enumerate(array[i], {});

            //check to see if other item schemas the same
            if (!isAlreadyDefinedInArray(temp_schema, schema.items)) {
                temp_schema.id = schema.items.length + "";
                if (isArray(array[i])) {
                    temp_schema.type = 'array';
                } else {
                    temp_schema.type = typeof array[i];
                }
                schema.items.push(temp_schema);
            }
        }
    }

    /**
     * Do a deep comparision and return differences between two objects
     */
    function compare(o1, o2) {
        var prop, diff, ret = {};

        if (typeof o1 === 'object' && typeof o2 === 'object') {
            for (prop in o2) {
                //don't check against o2's prototype properties
                if (o2.hasOwnProperty(prop)) {
                    //see if the property exists in o1
                    if (o1.hasOwnProperty(prop)) {
                        //it does, compare values
                        if (typeof o2[prop] === 'object' && !isArray(o2[prop])) {
                            diff = compare(o1[prop], o2[prop]);
                            if (!isEmpty(diff)) {
                                ret[prop] = diff;
                            }
                        } else if (isArray(o1[prop]) && isArray(o2[prop])) {
                            if (!ts.ok.eq(o1[prop], o2[prop])) {
                                //TODO: Improve the way arrays are 'compared'
                                //ret[prop] = "ARRAYS are different";
                                ret[prop] = o2[prop];
                            }
                        } else if (!ts.ok.eq(o1[prop], o2[prop])) {
                            ret[prop] = o2[prop];
                        }
                    } else {
                        ret[prop] = o2[prop];
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Generate a "schema" from a json object. For now, not checking the prototype
     */
    schemanator.generate = function (object) {
        var schema = { id: '#' };
        return enumerate(object, schema);
    };

    /**
     * Compare two objects, two schemas, or an object and a schema. Objects will generate
     * a scheme which is then compared. Since a 'schema' is generated first, this method only
     * checks for differences in properties, not in their values.
     */
    schemanator.schemaDiff = function (arg1, arg2) {

        //helper function to convert to schema if not already a schema
        function prepArgs(arg) {
            return (arg.id === '#') ? arg : schemanator.generate(arg);
        }

        if (arg1 && arg2 && (typeof arg1 === 'object' && typeof arg2 === 'object')) {
            return compare(prepArgs(arg1), prepArgs(arg2));
        } else {
            console.error('Arguments were undefined or were not objects');
        }
    };

    /**
     * Output what's different in arg2 compared to arg1
     */
    schemanator.diff = function (arg1, arg2) {
        return compare(arg1, arg2);
    };

}());
/**
Media Support
=============

A simple way to get a viewer for some document or multimedia.

    !!!
    <script>
        example.append(pn.viewer('api/test-media/sintel.mp4', 'video/mp4', 'Sample video'))
    </script>
*/
/*global pn*/
pn.module('viewer', function (viewer, $) {
    'use strict';

    var browserSupportsMimeType = function (mimeType) {
        var result = false,
            type,
            m;

        if (typeof mimeType === 'string' && mimeType.indexOf('/') >= 0) {
            type = mimeType.split('/', 1)[0];

            if (type) {
                if (['audio', 'video'].indexOf(type) >= 0) {
                    // Mime type is video or audio.
                    if (type === 'video' && document.createElement('video').canPlayType) {
                        m = document.createElement('video');
                        console.log("Can play: " + mimeType + " : " + m.canPlayType(mimeType));
                        result = !!(m && m.canPlayType && m.canPlayType(mimeType).replace(/no/, ''));
                        $(m).remove();
                    } else if (type === 'audio' && document.createElement('audio').canPlayType) {
                        m = document.createElement('audio');
                        console.log("Can play: " + mimeType + " : " + m.canPlayType(mimeType));
                        result = !!(m && m.canPlayType && m.canPlayType(mimeType).replace(/no/, ''));
                        $(m).remove();
                    }
                } else {
                    // Mime type is something other than audio and video
                    result = true;
                }
            }
        }
        return result;
    };

    var flashEmbed = function (host, src) {
        var mUrl = 'lib/av.swf?media_url=' + pn.urlUtils.normalize(src);
        // Temporary div in place of the object tag
        // constructed further below.
        var f = $('<div>').append($('<param name="movie">').prop('value', mUrl)),
            e = $('<embed type="application/futuresplash">').attr('src', mUrl)
                .appendTo(f),
            html;
        var playerSettings = {
            'allowScriptAccess': 'sameDomain',
            'allowFullScreen'  : 'true',
            'scale'            : 'noscale',
            'salign'           : 'tl',
            'wmode'            : 'gpu',
            'bgcolor'          : '#ffffff'
        };
        // Create the rest of the param tags using the playerSettings and
        // append them to the temporary div tag. Also, add the playerSettings
        // properties to the embed tag's attributes.
        $.each(playerSettings, function (prop, val) {
            if (typeof val !== 'function') {
                $('<param>')
                    .attr({
                        'name': prop
                    })
                    .val(val)
                    .appendTo(f);

                // The "scale" attribute must be set in a particular order.
                // Therefore, the attribute is being set further down in the
                // flashEmbed method (below).
                if (prop !== 'scale') {
                    e.attr(prop, val);
                }
            }
        });

        // Copy the innerHTML in the temporary div element.
        html = f.html();

        // Clean up.
        f.remove();

        // Object tags do not allow appending of elements in IE (throws an invalid
        // argument exception). Therefore, we must, unfortunately, construct the
        // object tag using string concatenation here.
        f = $('<object>' + html + '</object>')
            .attr({
                // Having an ID on the object tag is required for IE,
                // otherwise, an error is thrown.
                'id': pn.uuid(),
                'classid': 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000',
                'codebase': 'http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0'
            });

        // The "scale" attribute must come before the "salign" attribute!
        // Getting this order correct must be done through string replacement as adding
        // the attributes through jQuery does not guarantee order.
        html = $('<div>')
            .append(f)
            .html()
            .replace('salign', 'scale="noscale" salign');

        // Clean up.
        f.remove();
        f = undefined;

        return html;
    };

    var replaceHtml5MediaTags = function (parentElt, host) {
        $('video, audio', parentElt || 'body').replaceWith(function () {
            return flashEmbed(host, $(this).attr('src'));
        });
    };

    var createAttachmentHTML = function (attachment, targetElt) {
        var mimeType = attachment.properties ? attachment.properties.mimeType : attachment.mimeType,
            aMimeType,
            mediaType,
            mediaElt,
            dimensions = attachment.properties ? attachment.properties.dimensions : attachment.dimensions;

        if (mimeType && mimeType.length > 0) {
            aMimeType = mimeType.split('/');

            if (aMimeType.length === 2) {
                mediaType = aMimeType[0];
                switch (mediaType) {
                case 'video':
                    mediaElt = $('<video>');
                    break;
                case 'audio':
                    mediaElt = $('<audio>');
                    break;
                case 'image':
                    mediaElt = $('<img>').attr('alt', attachment.properties
                        ? attachment.properties.name : (attachment.name || attachment.title));
                    break;
                case 'application':
                    // 12.06.13 Converted from embed to iframe to improve UX in Chrome when loading large pdf files.
                    mediaElt = $('<iframe>').attr('type', mimeType);
                    break;
                case 'text':
                    mediaElt = $('<iframe>');
                    break;
                }

                if (mediaElt) {
                    if (mediaType === "text") {
                        var xml;
                        $.ajax({type: 'get', url: attachment.paths[0], async: false, dataType: 'text'})
                        .done(function (data) {
                            xml = data.replace(new RegExp("http?:\/\/[^\/]+\/trademark\/",'gi'), '../');
                        });
                        mediaElt.attr('srcdoc', xml);
                    } else {
                        mediaElt.attr('src', attachment.paths[0]);
                    }
                    if (dimensions) {
                        if (dimensions.hasOwnProperty('width')) {
                            mediaElt.attr('width', dimensions.width);
                        }
                        if (dimensions.hasOwnProperty('height')) {
                            mediaElt.attr('height', dimensions.height);
                        }
                    }
                    if (mediaType !== 'image' && mediaType !== 'text') {
                        mediaElt.attr('type', mimeType).attr('controls', true);
                    }
                }
            }
        }

        if (mediaElt) {
            targetElt.append(mediaElt);
            if (!browserSupportsMimeType(mimeType) && (mediaType === 'video' || mediaType === 'audio')) {
                replaceHtml5MediaTags(targetElt);
            } else if ((mediaType === 'video' || mediaType === 'audio')) {
                mediaElt.on('click', function () {
                    $(this).load();
                });
            }
        } else {
            targetElt.empty().html('<p>(No Preview Available)<\/p>');
        }

        return mediaElt;
    };
    /**
     Given an url and a mime type, construct and return an appropriate viewer, if possible. Use the
     optional description to provide, for example, alt text for an image. If divClass is included
     it will be added to the div as its class for styling.
     */
    viewer = function (url, mime, description, divClass) {
        var target = $('<div></div>');
        if (divClass) {
            target.addClass(divClass);
        }
        
        if (mime == null || mime === "") {
            $.ajax({
                type: "HEAD",
                async: false,
                url: url,
                success: function (m, t, xhr) {
                    var ctype = xhr.getResponseHeader('Content-Type').split(";"); 
                    mime = /charset/i.test(ctype[1]) ? ctype[0] : ctype[1];
                }
            });
        }
        
        createAttachmentHTML({
            mimeType: mime,
            title: description,
            paths: [url]
        }, target);
        return target;
    };
    return viewer;
});
/**
    validation5
    ============
    Adds html5 form validation to unsupporting browsers (ie8)

    > In need of redesign.

    TODO
    ----
    * Tests
 */

pn.module("validation5", function (validation5, $) {
    var supportsHtml5Validation = $("<input>")[0].setCustomValidity;
    var validatibleElementSelector = "input, select";

    function performValidation (ele) {
        var valid = true;
        var pattern;
        var $this = $(ele);
        var value = $this.val();
        if (this.validationMessage) {
            valid = false;
        } else {
            // If there is a value, or the input is required, then process the regex
            if (value || typeof $this.attr("required") !== "undefined") {
                valid = !!value;
                pattern = this.pattern || $this.attr("pattern");
                if (pattern) {
                    var regex = new RegExp(pattern);
                    valid = regex.test(value);
                }
            }
        }
        return valid;
    }

    function getDefaultError(ele) {
        if (ele.nodeName.toLowerCase() === "select") {
            return "Please select an item in the list.";
        }
        return "Please match the requested format.";
    }

    function setCustomValidity_shim (message) {
        this.validationMessage = message;
        this.checkValidity();
    }

    function hideError (ele) {
        // Remove old error
        $('.validationError[data-vid="' + $(ele).attr('data-vid') + '"]', document.body).remove();
    }

    function showError(ele, message) {
        var error = $('<span class="validationError" data-vid="' + $(ele).attr('data-vid') + '">' + message + '</span>');
        hideError(ele);
        $(ele).after(error);
        error.follow(ele);
        error
            .delay(5000)
            .fadeOut(1000, function() { error.remove(); });
    }

    function checkValidity_shim (showMessage) {
        var valid = true;
        if (!this._checkingValidity) {
            this._checkingValidity = true;
            try {
                var $this = $(this);
                var oninvalid;

                this.validity = valid = performValidation(this);
                if (!valid) {
                    oninvalid = this.oninvalid || $this.attr("oninvalid");
                    if (oninvalid) {
                        if (typeof oninvalid === "string") {
                            /*jshint evil:true*/
                            this.oninvalid = oninvalid = new Function(oninvalid);
                        }
                        oninvalid.call(this);
                    }
                    $this.trigger("invalid");
                }

                $this
                    .toggleClass("valid", valid)
                    .toggleClass("invalid", !valid);

                if (!valid && showMessage) {
                    showError(this, getDefaultError(this) + (this.title ? "<br>" + this.title : ""));
                } else {
                    hideError(this);
                }
            } finally {
                this._checkingValidity = false;
            }
        }
        return valid;
    }

    function shimValidatingElement(inputEle) {
        var $inputEle = $(inputEle);
        inputEle.setCustomValidity = setCustomValidity_shim;
        inputEle.checkValidity = checkValidity_shim;
        inputEle.checkValidity(false);
        $inputEle
            .attr("data-vid", pn.uuid())
            .on('change.validation propertychange.validation keyup.validation', function(e) {
                var propName = e.originalEvent.propertyName;
                if (!propName || propName === "value") {
                    $inputEle.trigger("input");
                    inputEle.checkValidity();
                }
            })
            .on('destroy.validation', function () {
                $inputEle.off('.validation');
            });
    }

    function shimFormElement (formEle) {
        var submitEvents;
        var skipValidate = false;
        if (formEle) {
            if (!formEle.checkValidity) {
                formEle.checkValidity = function (showMessage) {
                    var valid = true;
                    $(validatibleElementSelector, formEle).each(function (i, ele) {
                        valid = valid && ele.checkValidity && ele.checkValidity(showMessage);
                        return valid;
                    });
                    return valid;
                };
                $(formEle)
                    .on('click.validation', function (e) {
                        var target = $(e.target);
                        skipValidate = target.attr("formnovalidate") && target.attr("type") === "submit";
                    })
                    .on('submit.validation', function (e) {
                        if (!skipValidate && formEle.checkValidity && !formEle.checkValidity(true)) {
                            e.stopImmediatePropagation();
                            return false;
                        }
                        skipValidate = false;
                    })
                    .on('destroy.validation', function () {
                        $(formEle).off('.validation');
                    });

                // Dirty hack to force this onsubmit to be called first
                submitEvents = $._data(formEle, "events").submit;
                submitEvents.unshift(submitEvents.pop());
            }
        }
    }

    /**
     Shims the given element(s) with html5 validation (if necessary)
     */
    validation5.shimmy = function (elements) {
        // $(this) is used when called via jquery plugin
        elements = elements ? $(elements) : $(this);
        if (!supportsHtml5Validation) {
            var selector = elements.is(validatibleElementSelector) ? elements : $(validatibleElementSelector, elements);
            selector.each(function (i, ele) {
                shimValidatingElement(ele);
                if (ele.form) {
                    shimFormElement(ele.form);
                }
            });
        }
    };

    $.fn.validation5 = validation5.shimmy;
});/**
Table
=====

pn.table can modify tables for a one-time change and convert them to allow live changes responding
to user interaction.

This is a sample syntax for making one-time change.

    pn.table.someChange('.my-table', changeOptions);
    pn.table('.my-table').someChange(changeOptions);

And for enabling user control.

    pn.table('.my-table', userControlOptions);

Both can be done in one line.

    pn.table('.my-table', userControlOptions).someChange(changeOptions);

The '.my-table' above can be replaced with any jquery selector for one or more `table` elements.

DOM requirements
----------------

pn.table works on conventionally structured tables only.

- Rows
    - The table may contain zero or one header row; if it contains one, it must be the sole `tr` in
      the sole `thead`.
    - The header row must contain only `th` elements and no `td` elements.
    - All data rows are in one `tbody`.
- Columns
    - The table may contain zero or one header column; if it contains one, all data rows need to
      contain exactly one `th` as their first cell.
- Cells
    - No cell may have a rowspan or colspan that does not equal one.
    - Each `tr` must contain the same number of cells.

All elements in the table are in either the header region or the data region. The data region
contains data used by functionalities that require data, namely sorting and grouping. The header
region is optional and serves as a location to contain user control interfaces.

Refer to the demo page to see all formats of table that are tested to work with pn.table.
*/

/*global pn XDate */

pn.module('table', function (table, $) {
    'use strict';

    var scrollParent = function() {
        // From jQuery UI source https://github.com/jquery/jquery-ui/blob/44b2180782df6ef3324789324fcf3f98b85784a0/ui/jquery.ui.core.js
        var position = this.css( "position" ),
            excludeStaticParent = position === "absolute",
            scrollParent = this.parents().filter( function() {
                    var parent = $( this );
                    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                        return false;
                    }
                    return (/(auto|scroll)/).test( parent.css( "overflow" )
                        // jQuery looked for overflow-x, but for now, only care about y
                        + parent.css( "overflow-y" ) /*+ parent.css( "overflow-x" )*/ );
            }).eq( 0 );
        /* The original from jQuery returned the document when no scrolling container found.
           Running this from snippet scripts and also loading pages the styles async puts
           us in a race with application of styles, so instead return the empty collection
           and try again on a timer.
        */
        return scrollParent;
    };

    var savedComparators = {
        date: function(firstCell, secondCell) {
            var getMillisSinceEpoch = function(cell) {
                // TODO: Arbitrarily splits around the epoch, ok for now, but should revisit
                return new XDate($(cell).text()).valueOf() || 0;
            };
            return getMillisSinceEpoch(firstCell) - getMillisSinceEpoch(secondCell);
        },
        number: function (firstCell, secondCell) {
            return parseFloat($(firstCell).text()) - parseFloat($(secondCell).text());
        }
    };
    var getSavedComparator = function(dataType) {
        return savedComparators[dataType] || function(firstCell, secondCell) {
            return $(firstCell).text().localeCompare($(secondCell).text());
        };
    };

    var applyOneOnOneOperationOnElements = function(callerElements, calledElements, jqueryMethodName) {
        pn.assert($.isArray(callerElements) && $.isArray(calledElements)
                && callerElements.length === calledElements.length,
            'Cannot call ' + jqueryMethodName + ' on ' + callerElements.length
            + ' elements against ' + calledElements.length
            + ' elements. Make sure the collections of elements are both arrays');
        $.each(callerElements, function(index, callerElement) {
            $(callerElement)[jqueryMethodName](calledElements[index]);
        });
    };

    var sort = function(rows, comparator, order) {
        var abort;
        $(rows).find('th,td').each(function (i, cell) {
            if ($(cell).attr('rowspan') && $(cell).attr('rowspan') !== "1") {
                // IE 8 sets rowspan to "1" even when the markup does not define it
                abort = true;
            }
        });
        if (abort) {
            console.warn('Cannot sort rowspans. Sort aborted.');
            return false;
        }
        order = order === 'desc' ? -1 : 1;
        pn.sortNodes(rows, function () {
            return comparator.apply(this, arguments) * order;
        });
        return true;
    };


    // The manager is a collection of functions. In order to avoid memory leak, all functions must
    // not keep a closure reference to dom objects.
    var getManagerForSingleTable = function(tableSelector) {
        if(! $(tableSelector).is('table')) {
            console.error('Aborted attempt to prepare a table. Selected node is not a <table> element.');
            console.error(tableSelector);
            return;
        }

        var table = $(tableSelector);

        // all functions return a dom object or an array of dom objects.
        var locate = (function() {
            var headerColumnExists = function() {
                // check is more lax than what documentation demands.
                return !! table.find('tbody th:first-child').length;
            };
            var headerRow = function () {
                return table.find('thead:first-child tr:first-child');
            };
            var colIndex = function (content) {
                var cell = $(content).closest('th, td');
                return cell.closest('tr').children().index(cell);
            };
            var sameCol = function(row, referenceCell) {
                var target = colIndex(referenceCell);
                var result;
                $(row).children().each(function (i, td) {
                    var spans = parseInt($(td).attr('colspan') || '1', 10);
                    target -= spans - 1;
                    if (i >= target) {
                        result = td;
                        return false;
                    }
                });
                return result;
            };

            return {
                row: {
                    header: function() {
                        return table.find('thead:first-child tr:first-child')[0];
                    },
                    body: function() {
                        return table.find('tbody tr').toArray();
                    }
                },

                col: {
                    byCell: function(cell) {
                        var cells = [];
                        table.find('tr').each(function(i, row) {
                            var next = sameCol(row, cell);
                            if(next) {
                                cells.push(next);
                            }
                        });
                        return cells;
                    }
                },
                cell: {
                    headersOnTop: function() {
                        var result = table.find('thead:first-child tr:first-child th');
                        if(headerColumnExists()) {
                            result = result.not(result.first());
                        }
                        return result.toArray();
                    },
                    headerOnTopLeft: function() {
                        if(headerColumnExists()) {
                            return table.find('thead:first-child tr:first-child th:first-child')[0];
                        }
                    },
                    sameCol: sameCol,
                    header: function (cell) {
                        return headerRow().children()[colIndex(cell)];
                    }
                }
            };
        })(); 
        // end of var locate

        var sorting = (function() {

            // Per requirement on function sort, arg getTargetDataRows must return an array.
            var getSortDataRows = function(getTargetDataRows) {
                return function(sortOptions) {
                    var cellInCol = table.find(sortOptions.targetSelector).first();
                    var defaultCell = table.find(sortOptions.defaultTargetSelector).first();
                    if(! cellInCol.length) {
                        return false;
                    }
                    var comparatorForCellsInCol;
                    var defaultComparator;
                    var comparatorForDataRows = function(firstDataRow, secondDataRow) {
                        var firstCell = locate.cell.sameCol(firstDataRow, cellInCol);
                        var secondCell = locate.cell.sameCol(secondDataRow, cellInCol);
                        // always move empty row, e.g. pn-bindomatic-insertion-point-zombie, to the end
                        if(! firstCell) {
                            return -1;
                        }
                        if(! secondCell) {
                            return 1;
                        }
                        comparatorForCellsInCol = comparatorForCellsInCol || (
                            typeof sortOptions.comparator === 'function' ?
                                sortOptions.comparator :
                                getSavedComparator([$(firstCell).attr('pn-table-data-type')])
                        );
                        var returnValue = comparatorForCellsInCol($(firstCell), $(secondCell));
                        if (!returnValue && defaultCell) {
                            firstCell = locate.cell.sameCol(firstDataRow, defaultCell);
                            secondCell = locate.cell.sameCol(secondDataRow, defaultCell);
                            defaultComparator = defaultComparator || (
                                typeof sortOptions.defaultComparator === 'function' ?
                                    sortOptions.defaultComparator :
                                    getSavedComparator([$(firstCell).attr('pn-table-data-type')])
                            );

                            return defaultComparator($(firstCell), $(secondCell));
                        }
                        return returnValue;
                    };
                    var headerCell = $(locate.cell.header(cellInCol));
                    var sortOrder = sortOptions.sortOrder
                        || (/ascending/i.test(headerCell.attr('aria-sort')) ? 'desc' : 'asc');
                    if (sort(getTargetDataRows(), comparatorForDataRows, sortOrder)) {
                        headerCell
                            .attr('aria-sort', sortOrder === 'desc' ? 'descending' : 'ascending')
                            .siblings().attr('aria-sort', null);
                        return true;
                    }
                };
            };

            var sortAllDataRows = getSortDataRows(function() {
                return locate.row.body();
            });

            var addSortTriggerBehavior = function(behavior) {
                table.data('sortTriggerBehaviors', 
                    $.extend(table.data('sortTriggerBehaviors'), behavior)
                );
            };

            var enableUserSorting = function(sortUserControlOptions) {
                sortUserControlOptions = $.extend({}, sortUserControlOptions);

                addSortTriggerBehavior({
                    allDataRows: function(sortOptions) {
                        return sortAllDataRows(sortOptions);
                    }
                });

                table.find('.pn-table-sort-trigger')
                    .attr('sort-target-type', 'allDataRows')
                    .on('click', function() {
                        var trigger = $(this);
                        var triggerContainingCell = trigger.closest('th,td');
                        var defaultSortCell = table.find('.pn-table-sort-default').closest('th,td');
                        var newSortOrder;
                        var wasSortSuccessful;

                        wasSortSuccessful = table.data('sortTriggerBehaviors')[trigger.attr('sort-target-type')] ({
                            targetSelector: triggerContainingCell,
                            defaultTargetSelector: defaultSortCell,
                            comparator: sortUserControlOptions.comparator,
                            defaultComparator: sortUserControlOptions.defaultComparator
                        });

                        if(wasSortSuccessful) {
                            table.find('.pn-table-sort-trigger').removeAttr('sort-order');
                            trigger.attr('sort-order', newSortOrder);
                        }
                    });
            };

            return {
                getSortDataRows: getSortDataRows,
                sortAllDataRows: sortAllDataRows,
                addSortTriggerBehavior: addSortTriggerBehavior,
                enableUserSorting: enableUserSorting
            };
        })(); 
        // end of var sorting

        var markLastVisible = function () {
            // After showing, hiding, or reordering columns, need to mark the last visible one so
            // it can be styled distinctly, particularly for the column selector
            $(locate.cell.headersOnTop())
                .removeClass('pn-last-visible')
                .filter(function () {
                    // Check css property because :visible would return false if the entire
                    // table is hidden, thus not giving the correct column its class
                    return !/none/i.test($(this).css('display'));
                })
                .last()
                .addClass('pn-last-visible');
        };
        pn.theme.ready(markLastVisible);

        var reordering = (function() {
            var getDropDestinationsGetter = function(selectDropDestinations, draggedHandle, beforeOrAfter) {
                return function() {
                    var dropDestinations = $(selectDropDestinations());
                    var dropDestinationExcludeIndex = dropDestinations.index(draggedHandle);
                    if(dropDestinationExcludeIndex >= 0) {
                        if(beforeOrAfter === 'before') {
                            dropDestinations = dropDestinations.slice(0, dropDestinationExcludeIndex);
                        } else if(beforeOrAfter === 'after') {
                            dropDestinations = dropDestinations.slice(dropDestinationExcludeIndex + 1);
                        }
                    }
                    return dropDestinations;
                };
            };

            var enableUserReorderingOnCol = function() {
                var selectDraggableHandles = locate.cell.headersOnTop;

                var getTableHeight = function() {
                    return table.height();
                };

                $.each(selectDraggableHandles(), function(i, draggableHandle) {
                    $(draggableHandle).drag({
                        lock_y: true,
                        drop: function(target, label, source){
                            var sourceCol, targetCol;
                            if(source[0] !== target[0]) {
                                sourceCol = locate.col.byCell(source);
                                targetCol = locate.col.byCell(target);

                                if(label === 'before') {
                                    applyOneOnOneOperationOnElements(sourceCol, targetCol, 'insertBefore');
                                }  else if(label === 'after') {
                                    applyOneOnOneOperationOnElements(sourceCol, targetCol, 'insertAfter');
                                }
                            }
                            markLastVisible();
                        },
                        targets: [
                            {
                                selector: getDropDestinationsGetter(selectDraggableHandles, draggableHandle, 'before'),
                                regions: [
                                    { label: 'before', left: "0-4", top: 0, width: "0+8", height: getTableHeight }
                                ]
                            },
                            {
                                selector: getDropDestinationsGetter(selectDraggableHandles, draggableHandle, 'after'),
                                regions: [
                                    { label: 'after', left: "1-4", top: 0, width: "0+8", height: getTableHeight }
                                ]
                            }
                        ]
                    });
                });
            };

            var enableUserReorderingOnRow = function() {
                var selectDraggableHandles = locate.row.body;

                $.each(selectDraggableHandles(), function(rowIndex, draggableHandle) {
                    $(draggableHandle).drag({
                        drop: function(target, label, source){
                            if( source[0] !== target[0] ){
                                if( label === "before"){
                                    source.insertBefore( target );
                                } else {
                                    source.insertAfter( target );
                                }
                            }
                        },
                        targets: [
                            {
                                selector: getDropDestinationsGetter(selectDraggableHandles, draggableHandle, 'before'),
                                regions: [
                                    { label: 'before', left: 0, top: "0-2", width: 1, height: "0+4"}
                                ]
                            },
                            {
                                selector: getDropDestinationsGetter(selectDraggableHandles, draggableHandle, 'after'),
                                regions: [
                                    { label: 'after', left: 0, top: "1-2", width: 1, height: "0+4" }
                                ]
                            }
                        ]
                    });
                });
            };

            var enableReordering = function(reorderUserControlOptions) {
                reorderUserControlOptions = $.extend({}, reorderUserControlOptions);
                var tableDirections = [].concat(reorderUserControlOptions.tableDirections);
                if(tableDirections.indexOf('row') >= 0) {
                    enableUserReorderingOnRow();
                }
                if(tableDirections.indexOf('col') >= 0) {
                    enableUserReorderingOnCol();
                }
            };

            return {
                enableUserReordering: enableReordering
            };
        })(); // end of var reordering

        var collapsing = (function() {
            var selectCellsRepresentingDataColumns = function() {
                var cellsRepresentingColumns = $(locate.cell.headersOnTop());
                if(! cellsRepresentingColumns.length) {
                    // TODO: does it really make sense to have a collapsible table without headers?
                    cellsRepresentingColumns = table.find('tr:not(.pn-table-group-title-row)').first().find('td');
                }
                cellsRepresentingColumns = cellsRepresentingColumns.not('.freeze-column, .pn-table-group-col-cell');
                return cellsRepresentingColumns;
            };
            var createPrompt = function() {
                var prompt = $('<div></div>')
                    .addClass('table-columns-popup')
                    .append([
                        $('<legend>Show & Hide Columns</legend>'),
                        $('<button type="button">Show/Hide all</button>')
                            .on('click', function() {
                                var button = $(this);
                                var checkboxes = button.parent().find('input');
                                var areAllSelectionsChecked = true;
                                checkboxes.each(function(i, checkbox) {
                                    if(! $(checkbox).prop('checked')) {
                                        areAllSelectionsChecked = false;
                                        return false;
                                    }
                                });
                                checkboxes.prop('checked', ! areAllSelectionsChecked);
                            })
                    ]);
                var selections = $('<div class="selections"></div>').appendTo(prompt);
                selectCellsRepresentingDataColumns().each(function(headerCellIndex, headerCell) {
                    headerCell = $(headerCell);
                    selections.append(
                        $('<div class="selection"></div>')
                            .append(
                                $('<label></label>')
                                    .append([
                                        $('<input type="checkbox" />')
                                            .attr('name', headerCellIndex)
                                            .prop('checked', headerCell.is(':visible')),
                                        headerCell.contents().not('button.pn-select-columns').text()
                                    ])
                            )
                    );
                });
                return prompt;
            };
            var enableUserCollapsing = function(collapseUserControlOptions) {
                collapseUserControlOptions = $.extend({
                    targetSelector: function () {
                        var buttons = $();
                        // Not using selectCellsRepresentingDataColumns() because this should
                        // include frozen columns.
                        $(locate.cell.headersOnTop()).each(function (i, headerCell) {
                            buttons = buttons.add(
                                $('<button class="pn-select-columns"><span>Select columns</span></button>')
                                    .appendTo(headerCell));
                        });
                        return buttons;
                    }
                }, collapseUserControlOptions);

                var prompter = 
                    typeof collapseUserControlOptions.targetSelector === 'function' ?
                    $(collapseUserControlOptions.targetSelector(table)) :
                    // select on document, not on table
                    $(collapseUserControlOptions.targetSelector);

                prompter
                    .on('click', function() {
                        pn.popup(createPrompt(), {
                            onsubmit: function(event, data) {
                                if (data.ok) {
                                    selectCellsRepresentingDataColumns()
                                    .each(function(headerCellIndex, headerCell) {
                                        $(locate.col.byCell(headerCell))
                                            .toggle(data[headerCellIndex] === 'on');
                                    });
                                    // The above toggle of each column in the table
                                    // wipes out any group header when the user
                                    // removes the last column from a table.
                                    // Re-enable the group header.
                                    table.find('tr.pn-table-group-title-row td').css({display: ''});
                                    markLastVisible();
                                }
                            }
                        });
                    });
            };

            var refresh = function () {
                selectCellsRepresentingDataColumns()
                    .each(function(headerCellIndex, headerCell) {
                        $(locate.col.byCell(headerCell))
                            .toggle($(headerCell).is(':visible'));
                    });
                // The above toggle of each column in the table
                // wipes out any group header when the user
                // removes the last column from a table.
                // Re-enable the group header.
                table.find('tr.pn-table-group-title-row td').css({display: ''});
                markLastVisible();
            };
            return {
                enableUserCollapsing: enableUserCollapsing,
                refresh: refresh
            };
        })(); 
        // end of var collapsing

        var grouping = (function() {

            var groupingRows = (function() {
                var sortDataRowsInEachGroup = function(sortOptions) {
                    var success = true;
                    table.find('.pn-table-grouped-rows-container').each(function(i, group) {
                        var sorter = sorting.getSortDataRows(function() {
                            return $(group).find('tr:not(.pn-table-group-title-row)').toArray();
                        });
                        success = success && sorter(sortOptions);
                    });
                    return success;
                };

                var group = function(groupOptions) {
                    var getGroupData = typeof groupOptions.getGroupData === 'function'
                        ? groupOptions.getGroupData
                        : function(groupDataCell) {
                                return $(groupDataCell).text();
                            };

                    var cellsInGroupCol;
                    var mapOfGroupDataToGroupTbody = {};

                    var createGroupedRowsContainer = function(groupData, groupDataCell) {
                        return $('<tbody class="pn-table-grouped-rows-container"></tbody>')
                            .append(
                                $('<tr class="pn-table-group-title-row"></tr>')
                                    .append(
                                        $('<td></td>')
                                            // below: allow correct sorting of groups. If a custom
                                            // group data getter was provided, the content is string,
                                            // so use default comparator.
                                            .attr('pn-table-data-type', 
                                                typeof groupOptions.getGroupData === 'function' ?
                                                    $(groupDataCell).attr('pn-table-data-type') :
                                                    null
                                            )
                                            .attr('colspan', '100%')
                                            .append(
                                                $('<button></button>')
                                                    .on('click', function () {
                                                        $(this)
                                                        .closest('.pn-table-grouped-rows-container', table[0])
                                                        .toggleClass('pn-inactive');
                                                    })
                                                    .text(groupData)
                                            )
                                    )
                            );
                        // Reordering and collapsing of columns do not need to be disabled if and
                        // only if we have only one td, allowing column selection to target the
                        // correct cells.
                    };

                    cellsInGroupCol = $(locate.col.byCell(table.find(groupOptions.targetSelector).first()))
                        .filter(function () {
                            // See supervisor docket for example (thead contains td)
                            return $(this).parent().parent().is('tbody');
                        });

                    if(cellsInGroupCol.length) {
                        //  prepare dom 
                        cellsInGroupCol.addClass('pn-table-group-col-cell');
                        cellsInGroupCol.not('th').each(function(i, groupDataCell) {
                                var groupData = '' + getGroupData($(groupDataCell));
                                var row = $(groupDataCell).closest('tr');

                                if(mapOfGroupDataToGroupTbody[groupData]) {
                                    mapOfGroupDataToGroupTbody[groupData].append(row);
                                } else {
                                    mapOfGroupDataToGroupTbody[groupData] = createGroupedRowsContainer(
                                        groupData, groupDataCell
                                    )
                                        .append(row)
                                        .appendTo(table);
                                }
                            });

                        table.find('.pn-table-group-col-cell').hide();

                        // Hide the header cell
                        table.find(groupOptions.targetSelector).addClass('pn-table-group-col-header').hide();
                        
                        // prepare sort handler 
                        sorting.addSortTriggerBehavior({
                            dataRowsInEachGroup: sortDataRowsInEachGroup
                        });

                        table.find('.pn-table-sort-trigger[sort-target-type=allDataRows]')
                            .attr('sort-target-type', 'dataRowsInEachGroup');

                        $(locate.cell.headerOnTopLeft())
                            .append(
                                table.find('.pn-table-sort-trigger').first().clone(true)
                                    .attr('sort-target-type', 'groups')
                            );
                        (scrollParent.call(table) || $()).trigger('scroll');
                    } else {
                        console.warn('Column to group by could not be selected or was empty.');
                    }
                }; 
                // end of var group

                var ungroup = function() {
                    // restore data rows in one existing or new tbody. If multiple <tbody>s existed
                    // before grouping, ungrouping does not restore rows to their original locations.
                    var ungroupedRowsContainer = table.find('tbody:not(.pn-table-grouped-rows-container)').first();
                    if(! ungroupedRowsContainer.length) {
                        ungroupedRowsContainer = $('<tbody></tbody>')
                            .appendTo(table);
                    }
                    ungroupedRowsContainer.append(table.find('tbody tr:not(.pn-table-group-title-row)'));

                    table.find('.pn-table-grouped-rows-container').remove();

                    table.find('.pn-table-group-col-cell')
                        .removeClass('pn-table-group-col-cell')
                        .show();

                    // Restore the header cell
                    table.find('th.pn-table-group-col-header').show();

                    // restore sort handler 

                    // do not bother removing sort behaviors, as cost of associating a dom with a few functions should be negligible.

                    table.find('.pn-table-sort-trigger[sort-target-type=dataRowsInEachGroup]').attr('sort-target-type', 'allDataRows');
                    table.find('.pn-table-sort-trigger[sort-target-type=groups]').remove();
                    (scrollParent.call(table) || $()).trigger('scroll');
                };

                return {
                    group: group,
                    ungroup: ungroup
                };
            })(); 
            // end of var groupingRows

            var ungroup = function() {
                if(table.attr('pn-table-grouped') === 'row') {
                    groupingRows.ungroup();
                    table.removeAttr('pn-table-grouped');
                }
            };

            var group = function(groupOptions) {
                groupOptions = $.extend({}, groupOptions);
                if(! table.attr('pn-table-grouped')) {
                    groupingRows.group(groupOptions);
                    table.attr('pn-table-grouped', 'row');
                }
            };

            var toggleGrouping = function(groupOptions) {
                if(table.attr('pn-table-grouped') === 'row') {
                    ungroup();
                } else {
                    group(groupOptions);
                }
            };

            return {
                ungroup: ungroup,
                group: group,
                toggleGrouping: toggleGrouping
            };
        })(); 
        // end of var grouping

        var resizing = (function() {
            var enableUserResizing = function() {
                // a resize handle is twice as many pixels wide centered at a column boundary.
                var resizeHandleMarginSize = 5;
                var minWidthPerCell = 50;

                var selectCells = function() {
                    return table.find('tr:not(.pn-table-group-title-row)').first().find('th,td');
                };

                // returns undefined if mouse location is not a resize handle.
                var getColIndexesToResize = function(evt) {
                    var cells = selectCells();
                    var colIndexesToResize = {};
                    var immediateRightColIndex;
                    var tempColIndex;

                    cells.each(function(colIndex, cell) {
                        if( Math.abs( evt.clientX - $(cell).offset().left ) < resizeHandleMarginSize ){
                            immediateRightColIndex = colIndex;
                            return false;
                        }
                    });
                    for(tempColIndex = immediateRightColIndex - 1; tempColIndex >= 0; tempColIndex --) {
                        if( $(cells.get(tempColIndex)).is(':visible') ) {
                            colIndexesToResize.left = tempColIndex;
                            break;
                        }
                    }
                    if(typeof colIndexesToResize.left === 'number') {
                        for(tempColIndex = immediateRightColIndex; tempColIndex < cells.length; tempColIndex ++) {
                            if( $(cells.get(tempColIndex)).is(':visible') ) {
                                colIndexesToResize.right = tempColIndex;
                                break;
                            }
                        }

                        if(typeof colIndexesToResize.right === 'number') {
                            return colIndexesToResize;
                        }
                    }
                };

                var trackMouse = function(colIndexesToResize, mousedownClientX){
                    var cells = selectCells(),
                        cell0 = $(cells[colIndexesToResize.left]),
                        cell1 = $(cells[colIndexesToResize.right]),
                        col0 = $(locate.col.byCell(cell0)),
                        col1 = $(locate.col.byCell(cell1));

                    var wInit0 = cell0.width(),
                        wInit1 = cell1.width();

                    var dw0Min = minWidthPerCell - wInit0;
                    var dw0Max = wInit1 - minWidthPerCell;

                    function restrict(x, min, max){
                        return x < min ? min : ( x > max ? max : x );
                    }

                    function adjustColumnWidths(evt){
                        var dw0 = Math.round(
                            restrict(
                                evt.clientX - mousedownClientX,
                                dw0Min, dw0Max
                            )
                        );
                        var w0 = wInit0 + dw0;
                        var w1 = wInit1 - dw0;
                        col0.width(w0);
                        col1.width(w1);
                    }

                    $(document)
                        .on('mousemove', adjustColumnWidths)
                        .on('mouseup', function(){
                            $(document).off('mousemove', adjustColumnWidths);
                        });
                };

                table
                    .on('mousemove', function(evt){
                        var colIndexesToResize = getColIndexesToResize(evt);
                        var isMouseOverResizeHandle = !! colIndexesToResize;
                        // for styling
                        table.toggleClass('mouse-over-resize-handle', isMouseOverResizeHandle); 
                    })
                    .on('mousedown', function(evt){
                        var colIndexesToResize = getColIndexesToResize(evt);
                        var isMouseOverResizeHandle = !! colIndexesToResize;
                        if(isMouseOverResizeHandle) {
                            trackMouse(colIndexesToResize, evt.clientX);
                        }
                    });
            };

            return {
                enableUserResizing: enableUserResizing
            };
        })(); 
        // end of var resizing


        return {
            sorting: sorting,
            reordering: reordering,
            collapsing: collapsing,
            grouping: grouping,
            resizing: resizing,
            markLastVisible: markLastVisible
        };
    }; 
    // end of var getManagerForSingleTable



    var useTableManagers = function(tablesSelector, useTableManager) {
        $(tablesSelector).each(function(i, table) {
            // do not recycle tableManager objects, since they are containers of functions only and
            // the cost of their creation should be negligible.
            var tableManager = getManagerForSingleTable(table);
            useTableManager(tableManager);
        });
    };


    var exposedOneTimeChanges = {
        /**
        Allows sorting for table rows. Can only sort by the data in a single column, that is, no
        sorting based on multiple columns. Takes an options object with properties:

        - **targetSelector**: selector or bag of nodes. Sort by text in the column that contains it.
        - **sortOrder**: one of `asc` or `desc.` Defaults to the opposite of the current sort
            direction or ascending if the table is not already sorted by the given column.
        - **comparator**: equivalent to `Array.prototype.sort` comparator function, it recieves as
            its arguments the jQuery object representing the table cells to compare.

        Remember that the table header row must live in a `thead` element.

        Sorting a table adds an appropriate [aria-sort](http://www.w3.org/TR/wai-aria/states_and_properties#aria-sort)
        attribute to the relevant table header. CSS can use the `[aria-sort=ascending]` or
        `[aria-sort=descending]` to target sorted header elements. See the
        [Bones theme table styles](#ui/../css/bones/table.less) for details.

        ### Default comparators

        If not provided, the default comparator sorts by cell text content in lexical order.

        Data cells marked with an attribute `pn-table-data-type=[type]` will sort using a predefined
        custom comparator. Two custom comparator are currently available:

        - `date`: attempts to parse the cell's content as a date and sort accordingly. The date
          comparator depends on XDate.
        - `number`: attempts to parse the cell's content as a number

        <!-- comment for markdown formatting -->

            !!!
            <button class="default">Default sort</button>
            <button class="custom">Custom sort</button>
            <button class="date">Date sort</button>
            <button class="number">Number sort</button>
            ---
            <table>
                <thead>
                    <tr><th>Default</th><th>Custom</th>
                        <th>Date</th><th>Number</th></tr>
                </thead>
                    <tr><td>Galahad</td><td>Knight of the round table</td>
                        <td pn-table-data-type="date">1970-01-01</td>
                        <td pn-table-data-type="number">3</td></tr>
                    <tr><td>Arthur</td><td>King of the Britons,
                            defeater of the Saxons, Sovereign of all England</td>
                        <td pn-table-data-type="date">2038-01-19</td>
                        <td pn-table-data-type="number">20</td></tr>
            </table>
            <script>
                var table = example.find('table')
                example.find('button.default').on('click', function () {
                    pn.table.sort(table, {
                        targetSelector: table.find('th').first() })
                })
                example.find('button.custom').on('click', function () {
                    pn.table.sort(table, {
                        targetSelector: table.find('th')[1],
                        comparator: function (a, b) {
                            return a.text().length - b.text().length }})
                })
                example.find('button.date').on('click', function () {
                    pn.table.sort(table, {
                        targetSelector: table.find('th')[2] })
                })
                example.find('button.number').on('click', function () {
                    pn.table.sort(table, {
                        targetSelector: table.find('th')[3] })
                })
            </script>

        Returns false if sorting fails, that is, the target is outside the table or for some other
        reason does not identify a table column.
        */
        sort: function(tablesSelector, sortOptions) {
            useTableManagers(tablesSelector, function(tableManager) {
                tableManager.sorting.sortAllDataRows(sortOptions);
            });
        },

        /**
            Used to reshow additional columns when refreshing a tbody by
            hollowing out the rows and rebinding.
         */
        refreshCols: function (tablesSelector) {
            useTableManagers(tablesSelector, function (tableManager) {
                tableManager.collapsing.refresh();
            });
        },
        
        /**
        Only rows can be grouped, and by data in one column only. Grouping breaks a table into
        multiple tbody elements. The first row of each tbody spans the entire table and contains a
        button that toggles the group `pn-inactive` class on and off.

        Applying grouping affects user-controlled changes (if enabled) in the following ways.

        - Sorting is now executed on rows within each group. Rows do not leave their groups.
        - Reordering of rows remains enabled. When the table is ungrouped, the rows will be arranged
          in the new order.
        - Reordering of columns remains enabled.
        - Collapsing of rows and columns remains enabled.

        The options parameter allows these properties:

        - **targetSelector**: cell or cell selector indicating the group by column
        - **getGroupData**: function called for each cell in the column that returns the cell's
            group name. Defaults to the cell's text content.

        <!-- this comment is just a placeholder to allow correct formatting in markdown -->
            !!!
            <select><!-- converts to toggle button -->
                <option>Ungroup</option>
                <option>Group</option>
            </select>
            ---
            <table>
                <thead>
                    <tr><th>Characteristic</th><th>Knight</th></tr>
                </thead>
                    <tr><td>Brave</td><td>Arthur</td></tr>
                    <tr><td>Brave</td><td>Lancelot</td></tr>
                    <tr><td>Cowardly</td><td>Robin</td></tr>
                    <tr><td>Wise</td><td>Bedevere</td></tr>
            </table>
            <script>
                var table = this
                pn.toggle(example.find('select')).on('change', function () {
                    var toggle = pn.table[$(this).val().toLowerCase()]
                    toggle(example.find('table'), {
                        targetSelector: example.find('th').first()
                    });
                })
            </script>
        */
        group: function(tablesSelector, groupOptions) {
            useTableManagers(tablesSelector, function(tableManager) {
                tableManager.grouping.group(groupOptions);
            });
        },
        /**
        Reverse a `group` operation.
        */
        ungroup: function(tablesSelector) {
            useTableManagers(tablesSelector, function(tableManager) {
                tableManager.grouping.ungroup();
            });
        },
        toggleGrouping: function(tablesSelector, groupOptions) {
            useTableManagers(tablesSelector, function(tableManager) {
                tableManager.grouping.toggleGrouping(groupOptions);
            });
        },

        /**
        Keep the table's thead visible when scrolled.

        Caveats:
        - Styling must go on the `th` elements, not the `thead`
        - If you add a column while the table is in a scrolled state, you must fire a scroll event
          at the table's scrolling parent, or the new header will be in the wrong position
        - If you change the scroll parent, e.g. by moving the table into a new container, this will
          not receive events from the new container
        - The scroll parent's `border-top-width` should be set in `px` units, or this cannot compute
          the content offset correctly.

        This adds some special classes to the shifted elements:

        - `pn-scrollend`: briefly present after a scroll stops. Allows, for example, hiding the
          `thead` so it can fade into place smoothly.
        - `pn-scrolled`: table content has scrolled

        Remember to apply all styles to the `td` or `th` elements, not the `thead` or `tr`.
        */
        fixHead: function (tablesSelector) {
            var translate = function (what, offset) {
                var translation = offset ? 'translateY(' + offset + 'px)' : '';
                what.css({
                    '-moz-transform': translation,
                    '-ms-transform': translation,
                    '-webkit-transform': translation,
                    '-o-transform': translation,
                    'transform': translation
                });
                if (offset > 0) {
                    what.addClass('pn-scrolled');
                } else {
                    what.removeClass('pn-scrolled');
                }
                return what;
            };
            var setup = function () {
                var table = $(tablesSelector);
                var stop;
                var scroller = scrollParent.call(table);
                var offset = function (what) {
                    var scrolled = scroller.offset().top - what.offset().top
                        // Would be nice if there's a way to calculate border width this without
                        // depending on dimensions being set in px, but I haven't found it.
                        + parseFloat(scroller.css('border-top-width'));
                    var max = table.innerHeight()
                            - (table.position().top - what.position().top) // table size above this
                            - what.outerHeight();
                    return Math.min(Math.max(0, scrolled), max);
                };
                if (scroller.length) {
                    var lastHeadOffset;
                    var scrolling = false;
                    scroller.on('scroll', function () {
                        if (!table.is(':visible')) {
                            // Cannot reasonably compute position of a `display: none` table, so do
                            // nothing. There's probably a more robust method that differentiates
                            // between `display: none` and `visibility: hidden`, but ok for now.
                            return;
                        }
                        var thead = table.children('thead');
                        var headers = thead.children('tr').children('th');
                        if (!scrolling) {
                            // Calculating offset is expensive in IE 10, causing jerky scrolling, so
                            // avoid it until required.
                            if (offset(thead) === lastHeadOffset) {
                                // Horizontal scroll
                                return;
                            }
                            translate(headers, 0);
                            scrolling = true;
                        }
                        clearTimeout(stop);
                        stop = setTimeout(function () {
                            var adjust = offset(thead);
                            lastHeadOffset = adjust;
                            translate(headers, adjust)
                                .removeClass('pn-scrolling').addClass('pn-scrollend');
                            setTimeout(function () {
                                // Timeout allows browser to render `pn-scrollend` styles. A bit of
                                // a race, but not crucial.
                                scrolling = false;
                                headers.removeClass('pn-scrollend');
                            }, 50);
                        }, 150);
                    });
                } else {
                    setTimeout(setup, 100);
                }
            };
            setup();
        },

        /**
        Place the `pn-last-visible` class on the correct column.

        When using "user collapsible," tables with default controls in the header cells, client code
        should invoke this when making changes that change table column visibility or columng order
        in ways other than via table module functions, otherwise styles that apply only to the last
        visible header cell will not take effect at the appropriate times.
        */
        markLastVisible: function (tablesSelector) {
            useTableManagers(tablesSelector, function(tableManager) {
                tableManager.markLastVisible();
            });
        }

    }; 
    // end of var exposedOneTimeChanges


    /**
    User Controls
    =============

    When used as a function `pn.table` can add controls to a table that allow sorting, column hiding,
    row and columng reordering by drag and drop and column resizing. The options object can take 
    any of these properties, which is each an object specifying the options for the given control.

    - sortable
    - reorderable
    - collapsible
    - resizable

    <!-- comment needed to parse markdown -->
        !!!
        <button>Select columns</button>
        <select>
            <option>Ungroup</option>
            <option>Group</option>
        </select>
        <script>
            pn.toggle(this.filter('select')).on('change', function () {
                var toggle = pn.table[$(this).val().toLowerCase()]
                toggle(example.find('table'), {
                    targetSelector: example.find('th').eq(1)
                });
            })
        </script>
        ---
        <table>
            <thead>
                <tr>
                    <th class="freeze-column"><label><input type="checkbox"></label></th>
                    <th><button class="pn-table-sort-trigger">Type</button></th>
                    <th><button class="pn-table-sort-trigger">Subtype</button></th>
                    <th><button class="pn-table-sort-trigger">Coconut capacity</button></th></tr>
            </thead>
                <tr><td class="row-selector"><label><input type="checkbox"></label></td><td>African</td><td>River Martin</td><td>1</td></tr>
                <tr><td class="row-selector"><label><input type="checkbox"></label></td><td>European</td><td>Barn Swallow</td><td>0</td></tr>
                <tr><td class="row-selector"><label><input type="checkbox"></label></td><td>African</td><td>Square Tailed Saw-wing</td><td>1</td></tr>
        </table>
        <script>
            pn.table(this, {
                sortable: {
                    comparator: false
                },
                collapsible: {
                    targetSelector: example.find('button').first()
                },
                reorderable: {
                    tableDirections: ['col']
                },
                resizable: true
            })
        </script>

    ### User-controlled sorting

    If enabled, pn.table looks for existing elements inside the tables with class
    `pn-table-sort-trigger` and adds a click event handler to them. The elements need to be
    clickable. When clicked, data rows are sorted based on data in the column to which the clicked
    element belongs.

    The sort options object can take a comparator function, which overrides the default comparators.

    User can also specify a default column which will act as a secondary sort.
    pn.table looks for 'pn-table-sort-default' class. When another column is sorted on, the
    table will use the default column as a secondary sort.

    ### User-controlled reordering

    The reorder options object `tableDirections` property should be an array containing one or
    more of `row` and `col.`

    ### User-controlled collapsing

    Generates a dialog that allows selecting columns in the table to show or hide. The options
    object can take on property `targetSelector`, which should be a function or a jQuery selector
    or bag of nodes.
    
    Checks the `<th>` for the `freeze-column` class.  If this class is present on a `<th>` the
    column will not appear in the dialog.

    If the targetSelector is a function, takes one argument of jquery object that selects one table.
    Returns the prompter element: dom object or jquery object.

    When not given a target selector, this injects a button into each header cell that opens the
    column selector dialog. The button gets a `pn-select-columns` class.

        !!!
        <table>
            <thead>
                <tr><th>First column</th><th>Second column</th></tr>
            </thead>
            <tbody>
                <tr><td>Foo</td><td>Bar</td>
            </tbody>
        </table>
        <script>
            pn.table(this, {
                collapsible: true
            })
        </script>

    In a table with collapsing enabled, the last visible cell receives a `pn-last-visible` class so
    it can be styled differently.

    ### User-controlled resizing

    Takes no options.
    */

    var tableApi = function(tablesSelector, userControlOptions) {
        userControlOptions = $.extend({}, userControlOptions);

        useTableManagers(tablesSelector, function(tableManager) {
            if(userControlOptions.sortable) {
                tableManager.sorting.enableUserSorting(userControlOptions.sortable);
            }
            if(userControlOptions.reorderable) {
                tableManager.reordering.enableUserReordering(userControlOptions.reorderable);
            }
            if(userControlOptions.collapsible) {
                tableManager.collapsing.enableUserCollapsing(userControlOptions.collapsible);
            }
            if(userControlOptions.resizable) {
                tableManager.resizing.enableUserResizing();
            }
        });

        return (function() {
            var curriedOneTimeChanges = {};
            $.each(exposedOneTimeChanges, function(name) {
                curriedOneTimeChanges[name] = function(oneTimeChangeOptions) {
                    exposedOneTimeChanges[name](tablesSelector, oneTimeChangeOptions);
                };
            });
            return curriedOneTimeChanges;
        })();
    };

    return $.extend(tableApi, exposedOneTimeChanges);

});
/**
<style>
    .testinator-success,
    .testinator-failure,
    .testinator-error,
    .testinator-progress {
        position: relative;
    }
    .testinator-success:after,
    .testinator-failure:after,
    .testinator-error:after,
    .testinator-progress:after {
        display: inline-block;
        position: absolute;
        background-color: white;
        border-radius: 2px;
        border: 1px solid rgba(0,0,0,0.5);
        top: -8px;
        padding: 4px 8px;
    }
    .testinator-error:after {
        color: white;
        background-color: red;
        content: "Error!";
    }
    .testinator-success:after {
        color: black;
        background-color: #af8;
        content: "Success";
    }
    .testinator-failure:after {
        color: black;
        background-color: #fa8;
        content: "Failure";
    }
    .testinator-progress:after {
        background: #ff8;
        font-size: 24px;
        line-height: 24px;
        padding: 0;
        width: 24px;
        height: 24px;
        content: "\2732";
        -webkit-animation:pulse 2s linear 0 infinite normal;
        border-radius: 100px;
    }
    @-webkit-keyframes pulse {
        0% {background: #ff8; -webkit-transform:  translate(10px, 0) rotate(0deg);}
        25% {background: #fa8;}
        50% {background: #ff8;}
        75% {background: #af8;}
        100% {background: #ff8; -webkit-transform:  translate(10px, 0) rotate(360deg);}
    }
    .testinator-end-sequence {
        display: block;
        width: 100%;
        border-top: 1px solid #aaa;
        color: #aaa;
    }
</style>

testinator
==========

Automated documentation, testing, and online help for web applications

Use
---

### Prerequisites

* jQuery (tested with 1.10.x and 2.0.x).
    
### Usage

For the default -- HTML created from markdown using em>code to find tests, you
can simply call:

    $(selector).testinator();

For more complex operations, you can create your own selector:

    $(selector).testinator( { selector: *selector*, mode: *mode* } );

###Options

**selector** is a function that finds em>code nodes and filters those which where the 
code node's text matches its parent's text.

####TODO:

**commands** allows you to add new commands to testinator or override existing commands.
Simply add new command functions and they will be available by name. A command function 
will be passed context as its first parameter, and the other parameters provided will
be passed to its parameters. If it returns true then it success, false it fails. If the
command function is asynchronous, it should be wrapped in an object: {async: fn}.

Here is an example options object with two custom commands. Note that the asynchronous 
function is passed wrapped in a simple object and accepts at least two parameters, the
second being the callback used to indicate success or failure (call it with truthy or
falsy values to indicate outcomes).

    {
       commands: {
           sync_command: function(context, ...){ ... },
           async_command: { async: function(context, callback, ...){ ... } }
       }
    }

**mode** affects the behavior of testinator. By default it runs in "docs" mode.

Testinator currently runs in "docs" (technical documentation) mode. Additional modes
("auto" and "help") are planned.

* **auto** will run all the tests automatically and then fire a callback
* **help** will suppress everything except **run sequence** buttons, which will
  halt on a failure, only perform one iteration in sequence, and be labeled "show me".

Basic Concepts
--------------

Testinator is intended to simplify the documentation and testing of web projects.
Testinator tests can be embedded in **markdown** (that looks like
perfectly ordinary markdown if you don't know about testinator) and easily be embedded
anywhere you like using custom selectors.

To turn testinator commands embedded in the DOM into interactive demos and tests:

    $(...).testinator();

By default, testinator will find any em>code nodes and filter them down to those
which have no text outside the inner node.

A testinator command looks like this:

    _` command arg1 arg2 `_

**Note**: right now the command parser is very primitive and requires a lot of things
to be passed as strings wrapped in double-quote marks ("foo"). If you pass a function
or object as a string, don't use escaped double-quotes inside it. Ultimately we can
swap out the command parser for a proper tokenizer and eliminate the need for most 
of the double-quotes.

Here's are two examples of a command:

_`assert function(){ return 1 + 1 === 2; }`_. (You can assert function definitions.)

_`assert "1 + 1 !== 2"`_. (You can also assert expressions wrapped in strings -- if you 
insert bare expressions they'll be evaluated immediately.)

And here is a command with an error in its expression:

_`assert "e = m * c * c"`_.

In vanilla markdown testinator commands will simply be rendered as `code` in _italics_.

Testinator Commands
-------------------

Most testinator commands effectively create a **button** (which may be hidden). The basic 
idea is that a testinator test will go through the buttons, pushing them, waiting for a 
result, and then pushing the next, until done.

If in test mode, then the tests will be fired automatically. Otherwise, every *sequence*
containing at least one testinator command will have a button inserted that runs the 
testinator commands in order.

    !!!
    <button id="testinator-click-me">Click Me</button>
    <label>Input field: <input id="testinator-type-in-me" value="Type Here"></label>
    <script>
        example
            .find('button')
            .on('click', function(){ alert("ouch"); });
    </script>

* **test** *number_of_trials*, "*sequential|random*", "*sync|async*" -- runs all the
  testinator commands up to the next test command OR the end of the document. The
  extra parameters allow you to specify that the tests should be performed more than once, 
  that the order of the tests be random, and to perform the tests asynchronously if
  desired. Each sequence is by default: <code>test 1, "sequential", "sync"</code>.
  Click here to run all the tests in this section: _`test`_
* **end_test** -- ends a sequence.
* **click** "*selector*" -- clicks on the selected element.
  _`click "#testinator-click-me"`_ (clicks the **Click Me** button).
  _`click "#foo-bar-baz"`_ (fails because #foo-bar-baz doesn't exist).
* **send** "*event*" [, "*selector*"] -- sends event to the selected element
  _`send "click", "#testinator-click-me"`_ (sends a click to the **Click Me** button).
* **context** *object_definition* -- all future expressions will be evaluated with
  the local variable *context* set to this value.
  _`context { msg: 'foo' }`_ sets context to `{ msg: 'foo' }`.
  _`context { msg: 'bar' }`_ sets context to `{ msg: 'bar' }`.
  _`assert "context.msg === 'foo'"`_
* **wait** *polling_function* | "*expression*",
  *timeout_seconds* (default === 5.0), *test_interval_seconds* (default = 0.1) -- at the
  specified interval, calls the polling function. If the polling function returns **true**
  then marks the button **testinator-success**; if the timeout is reached without the polling
  function returning true, marks the button **testinator-failure**.
  _`wait "$('#testinator-type-in-me').val() === 'done'"`_ (waits until the
  field above is changed to "done").
* **enter** "*selector*", "*text_to_enter*"[, "*text_prompt*"]
  -- enters the string into the targeted control. (Does NOT simulate typing it!)
  If *text_prompt* is provided, user will be asked to provide the string (with the
  default being *text_to_enter*).
  _`enter "#testinator-type-in-me", "done"`_ will enter "done" into the field.
  _`enter "#testinator-type-in-me", "type something here", "Well?"`_ 
  will prompt you for something to enter into the field.
* **focus** "*selector*" -- focuses the selected element.
  _`focus "#testinator-type-in-me"`_ should focus the text field.
* **assert** ["*description*",] "*expression*" | *function* -- creates a button
  which, if clicked, evaluates the expression / function and if it evaluates to true
  reports success, otherwise failure. (The reason you can assert "bare" functions but
  you need to wrap expressions in strings is that the arguments are evaluated
  *immediately*. an asserted function will be 
  treated as async if it takes two parameters (not an expression!). 
  The function's signature is fn(context, callback), with callback being the function 
  to call on completion (passing truthiness for success, and falsiness for failure).

  _`assert "user will enter foo", function(context, callback){ callback( prompt("please enter foo") === "foo" ); }`_
  This is an example of an async assert.
  
### Command To Do List

* **command** "name", *function*[, "async"] -- adds named command to the commands available
  to testinator. A synchronous command will be passed context, and the command line parameters,
  and will be executed when clicked. An async command will receive a callback as its second
  parameter (so: context, callback, other parameters...) which must be called with true/false
  when the outcome is known.

Sequences
---------

A testinator *sequence* comprises a series of commands from one "test" command,
until the next "test" command, the next "end_test" command, or the end of the document.
When you render a page containing testinator commands, you have the option of
automatically running each script in order automatically (i.e. test mode) or providing
the user with a button ("Show Me!") that runs the script if the user clicks it.

Click the button below to run the two tests below in random order five times.

_`test 5, "random"`_

_`assert "1 + 1 === 2"`_

_`assert "2 * 2 === 4"`_

_`end_test`_

*/

/*jshint evil: true */

(function ($) {
    "use strict";
    
    var context = {};
    
    function makeCommandButton( exp_string, async ){
        var elt = $('<button class="testinator-test">'),
            fn;
        
        function show_result( elt ){
            return function( success ){
                $(elt)
                    .removeClass( "testinator-progress" )
                    .addClass( success ? "testinator-success" : "testinator-failure" );
            };
        }
        
        try{
            if( typeof exp_string === 'function' ){
                fn = exp_string;
            } else {
                // jshint throws a bug here. Ignore it.
                fn = function(context){
                    return eval( "(" + eval(exp_string) + ")" );
                };
            }
            return elt
                        .on('click', function(){
                            try {
                                $(this).removeClass("testinator-success testinator-failure testinator-error");
                                if( async ){
                                    fn.call(this, context, show_result(this));
                                } else {
                                    show_result(this)(fn.call(this, context));
                                }
                            } catch(e){
                                console.error(e);
                                $(this).addClass("testinator-error");
                            }
                        });
        } catch(e){
            return elt.addClass('testinator-error')
                        .on('click', function(){
                            console.error( 'Could not evaluate ', exp_string );
                        });
        }
    }
    
    // this is what the !$#%&!@#% jQuery index function should do
    function indexOf(nodes, match){
        var index = -1;
        if( typeof match === "string"){           
            nodes.each(function(i){
                if( $(this).is(match) ){
                    index = i;
                    return false;
                }
            });
        } else {
            index = nodes.index(match);
        }
        return index;
    }
    
    function shuffle( deck ){
        var shuffled = [], i;
        for( i = 0; i < deck.length; i++ ){
            shuffled.splice(Math.random() * (1 + deck.length), 0, deck[i]);
        }
        return shuffled;
    }
    
    function makeTestSequence( tests_per_trial, trials, random ){
        var deck = [],
            i,
            testSequence = [];
        for( i = 0; i < tests_per_trial; i++ ){
            deck.push(i);
        }
        if( !random ){
            for( i = 0; i < trials; i++ ){
                testSequence = testSequence.concat( deck );
            }
        } else {
            for( i = 0; i < trials; i++ ){
                testSequence = testSequence.concat( shuffle(deck) );
            }
        }
        return testSequence;
    }
    
    // commands will be applied to context
    var commands = {
        test: function( trials, order, mode ){
            trials = trials || 1;
            order = order || "sequential";
            mode = eval( mode );
            
            return makeCommandButton( function(context, show_result){
                var tests = $('.testinator-test,.testinator-run-sequence,.testinator-end-sequence'),
                    self = $(this),
                    sequence,
                    end_of_sequence,
                    test_interval,
                    failures = 0,
                    current_test = false,
                    test_sequence;
                    
                // TODO: set context.iteration for repeated evaluations
                sequence = tests.slice( tests.index( self ) + 1 );
                end_of_sequence = indexOf(sequence, '.testinator-run-sequence,.testinator-end-sequence' );
                if( end_of_sequence > -1 ){
                    sequence = sequence.slice(0, end_of_sequence);
                }
                self
                    .removeClass('testinator-success testinator-failure testinator-error')
                    .addClass('testinator-progress');
                // TODO: kill tests that are in progress
                test_sequence = makeTestSequence( sequence.length, trials, order === "random" );
                test_interval = setInterval( function(){
                    if( !current_test ){
                        if( test_sequence.length ){
                            if( test_sequence.length % sequence.length === 0 ){
                                sequence.removeClass('testinator-success testinator-failure testinator-error testinator-progress');
                            }
                            current_test = $(sequence[ test_sequence.shift() ]);
                            current_test.click();
                        } else {
                            clearInterval( test_interval );
                            show_result( failures === 0 );
                            return;
                        }
                    }
                    if( current_test ){
                        if( current_test.is('.testinator-success') ){
                            current_test = false;
                        } else if ( current_test.is( '.testinator-failure' ) || current_test.is('.testinator-error' ) ){
                            failures++;
                            current_test = false;
                        }
                    }
                }, 250 );
            }, true).text( "Run Sequence" ).addClass("testinator-run-sequence");
        },
        end_test: function(){
            return $("<span>").addClass('testinator-end-sequence').text("End Test Sequence");
        },
        click: function( selector ){
            return makeCommandButton( function(){
                return $(selector).click().length;
            }).text( "Click " + selector );
        },
        context: function( new_context ){
            return makeCommandButton( function( context ){
                $.extend( context, new_context );
                console.log( "Testinator Context", context);
                return true;
            }).text("Context := " + JSON.stringify(new_context));
        },
        send: function( event, selector ){
            return makeCommandButton( function(){
                return $(selector).trigger(event).length;
            }).text( "Click " + selector );
        },
        assert: function( description, exp_string ){
            var fn,
                elt;
            if( !exp_string ){
                description = description.toString();
                exp_string = description;
            }
            fn = typeof exp_string === "function"
                 ? exp_string
                 : new Function('context', 'return (' + exp_string + ');' ); 
            elt = makeCommandButton( fn, fn.length === 2 );
            return elt
                .text('Assert ' + description);
        },
        enter: function( selector, text, text_prompt ){
            return makeCommandButton( function( context, show_result ){
                setTimeout( function(){
                    var entry_text = text;
                    if( text_prompt ){
                        entry_text = prompt(text_prompt, text );
                    }
                    if( typeof entry_text === 'string' ){
                        show_result( $(selector).val( entry_text ));
                    }
                }, 0 );
            }, true).text("Enter " + text + " into " + selector);
        },
        focus: function( selector ){
            return makeCommandButton( function(){
                return $(selector).focus().length;
            }).text("Focus " + selector);
        },
        wait: function( poll_fn, timeout, interval ){
            return makeCommandButton( function( context, show_result ){
                var poll_interval,
                    poll_timeout;
                if( typeof poll_fn === "string" ){
                    poll_fn = new Function("context", "return eval(" + JSON.stringify(poll_fn) + ");");
                }
                $(this).addClass('testinator-progress');
                poll_timeout = setTimeout( 
                    function(){
                        show_result(false);
                        clearTimeout( poll_timeout );
                        clearInterval( poll_interval );
                    },
                    ( timeout ? timeout * 1000 : 5000 )
                );
                poll_interval = setInterval(
                    function(){
                        if( poll_fn(context) ){
                            show_result(true);
                            clearTimeout( poll_timeout );
                            clearInterval( poll_interval );
                        }
                    },
                    ( interval ? interval * 1000 : 100 )
                );
            }, true).text("Wait " + poll_fn.toString());
        }
    };
    
    function createElement( context, command, args ){
        var fn = commands[command];
        if( typeof fn === 'function' ){
            try {
                if( args ){
                    return eval("(fn.call(context," + args + "))");
                } else {
                    return fn();
                }
            } catch(e){
                console.error("Testinator exception while creating element: ", context, command, args);
            }
        } else {
            console.error("Testinator cannot create element, bad method reference");
        }
    }
    
    function renderCommand( commandLine ){
        var parts, elt;
        try {
            // <START>[<spaces>]<command>[<spaces>][<arguments>]<END>
            parts = commandLine.match(/^\s*([^\s]+)\s*(.+$|$)/);
            elt = createElement( context, parts[1], parts[2] );
        } catch(e){
            console.error('Testinator exception: ', commandLine);
        }
        return elt;
    }
    
    function default_selector( target ){
        return target.find('em>code').filter( function(){
            return $(this).text() === $(this).parent().text();
        });
    }
    
    var testinator = function( target, options ){
        var tests;
        options = $.extend({mode:'docs', selector: default_selector}, options);
        if( typeof options.selector === 'function' ){
            tests = options.selector(target);
        } else {
            tests = target.find(options.selector);
        }
        tests.each( function(){
            $(this).parent().replaceWith( renderCommand($(this).text()) );
        });
    };
    
    $.fn.testinator = function(options){
        testinator(this, options);
    };
}(jQuery));/**
    Preferences
    ===========
    
    The goal of this module is to make persistent user preferences easy to implement.
    Two basic kinds of preferences are supported: explicit (those requiring a user to
    explicitly choose a setting) and implicit (those which automatically persist a user's
    choices).
    
    The preferences system exposes preferences as a javascript object, suitable for
    persisting to a service, but also persists settings to localStorage automatically.
    
    Usage
    -----
    
    In order to have a control's state governed by preferences you simply add the
    **data-pref** attribute to it. The value of the object determines where the setting is 
    stored in the preferences object, e.g. data-pref="foo" would use the value in
    prefs.get().foo, while data-pref="foo/bar" would use the value in
    prefs.get().foo.bar.
    
    **data-pref** allows a control's state to be governed by preferences.
    
    **data-pref-auto** works in much the same way except that if the user changes
    a control then its new state becomes the new default automatically. (No preferences
    dialog required.)
    
    ### Methods
    
    **prefs.get("some-name")** returns the specified preferences object, obtained from
    localStorage if available (We use names to allow multiple settings to coexist in a 
    single application or on localhost, say.)
    
    **prefs.get("some-name", obj)** returns the specified preferences object, extending
    the properties in the provided object (i.e. "defaults"). The object is also
    maintained internally (so prefs.get("some-name") called afterward will return the
    same object.
    
    **prefs.get("some-name", "path.name")** gets a specified preferences value from the 
    object.
    
    **prefs.getSettings("/path/to/file.html")** is a utility function for loading some html,
    and finding all the [default] values of all the named inputs, textareas, and 
    selects.
    
    **prefs.getSettings(nodes)** is the same utility applied to a chunk of the DOM. The
    difference here is that the values may not be defaults.
    
    **prefs.edit("some-name", nodes)** load preferences into the DOM.
    
    **prefs.save()** saves preferences to localStorage.
    
    **prefs.save("some-name", obj)** update preferences (overlaying the new settings on
    the old) and save as above.
    
    **prefs.set("some-name", obj)** sets or updates the internally maintained preferences
    object associated with the name.
    
    **prefs.set("some-name", "path.name", value)** sets or updates the specified value.
    
    **prefs.apply("some-name", nodes)** will apply preference settings to some collection 
    of DOM nodes. It will also *bind* automatic preferences to the object so that it is 
    updated automatically if the relevant settings are changed.
    
    **Note**: in variable references "." or "/" can be used interchangeably as a
    separator (so "path/name" or "path.name" will both find you <prefs-object>.path.name).
    
    Examples
    --------
    
        !!!
        <div>
            <div class="ui">
                <h2>UI with Preferences</h2>
                <p>
                    <label>
                        <select data-pref="selectDefault">
                            <option value="1">First</option>
                            <option value="2">Second</option>
                            <option value="3">Third</option>
                        </select>
                    <label>
                    <i>
                        the default value is a preference which you can 
                        explicitly set in the preferences dialog.
                    </i>
                </p>
                <p>
                    <label>
                        How Caring Are You?
                        <select data-pref="care">
                            <option value="yes">I care</option>
                            <option value="no">I don't care</option>
                            <option value="maybe">Eh...</option>
                        </select>
                    </label>
                    <i>This preference is controlled by radio buttons because they're a PITA</i>
                </p>
                <p>
                    <label>How Many? <input data-pref-auto="howMany"></label> 
                    <i>
                        the default value here is an "auto" preference but it is not 
                        saved unless you edit and save preferences.
                    </i>
                </p>
                <p>
                    <button class="edit">Edit Preferences...</button>
                </p>
            </div>
            <form class="prefs" style="display:none;" onsubmit="return false;">
                <h2>Preferences</h2>
                <p>
                    <label>
                        Default Menu Setting
                        <select name="selectDefault">
                            <option value="1">First</option>
                            <option value="2" selected>Second</option>
                            <option value="3">Third</option>
                        </select>
                    </label>
                </p>
                <p>
                    <fieldset>
                        <legend>Do you care?</legend>
                        <label>
                            <input type="radio" name="care" value="yes">
                            Yes
                        </label>
                        <label>
                            <input type="radio" name="care" value="no">
                            No
                        </label>
                        <label>
                            <input type="radio" name="care" value="maybe" checked>
                            Maybe
                        </label>
                    </fieldset>
                </p>
                <p>
                    <label>How Many? <input name="howMany" value="2"></label>
                </p>
                <p>
                    <button class="save">Save</button>
                    <i>
                        Refresh to see effect!
                    </i>
                </p>
            </form>
        </div>
        <script>
            var prefs = example.find('.prefs'),
                ui = example.find('.ui'),
                defaults = pn.prefs.getSettings(prefs);
                
            pn.prefs.get("demo", defaults);
            pn.prefs.apply("demo", ui);
            
            example.find('.edit').on('click', function(){
                pn.prefs.edit('demo', prefs);
                prefs.show();
            });
            
            example.find('.save').on('click', function(){
                pn.prefs.save("demo", pn.prefs.getSettings(prefs));
                prefs.hide();
            });
        </script>
    
    Advanced Usage
    --------------
    
    By default, this module assumes each control it is dealing with is an input, and the
    value being used is the input's val(). If you need some other behavior there are 
    some common options that can be obtained by adding parameters to the attribute value.
    
    * "foo/bar!class" -- the class of the object will be set to the specified value.
    * "foo/bar!toggleClass=className" -- if specified value is true, the class will be toggled on.
    * "foo/bar!prop=propName" -- sets the property *propName* to the specified value.
    * "foo/bar!attr=attrName" -- sets the attribute *attrName* to the specified value.
    * "foo/bar!callbackName" -- sets the name of a callback function that will be passed the
      node and the value when loading preferences
*/

pn.module('prefs', function (prefs, $) {
    var preferences = {};
    
    // simple functions for converting between paths and object hierarchies
    
    // value === null -> don't know
    function setValue( obj, path, value ){
        var p;
        
        if(value !== null){
            path = path.split(/[\/\.]/);
            while( path.length ){
                p = path.shift();
                if( path.length === 0 ){
                    obj[p] = value;
                } else {
                    if( obj[p] === undefined ){
                        obj[p] = {};
                    }
                }
                obj = obj[p];
            }
        }
    }
    
    function getValue( obj, path ){
        path = path.split(/\/|\./);
        while( path.length && obj !== undefined ){
            obj = obj[ path.shift() ];
        }
        return obj;
    }
    
    function get(name, defaults){
        if( typeof preferences[name] !== 'object' ){
            var data = localStorage[name + '-preferences'];
            // console.log('gettings prefs from localStorage', name, data);
            preferences[name] = data ? JSON.parse(data) : {};
        }
        if( typeof defaults === 'object' ){
            preferences[name] = $.extend( true, defaults, preferences[name] );
            return preferences[name];
        } else if ( typeof defaults === 'string' ){
            // console.log('returning setting', name, defaults, getValue( preferences[name], defaults ));
            return getValue( preferences[name], defaults );
        } else if ( defaults === undefined ){
            return preferences[name];
        }
    }
    
    function save(name, settings){
        var p = get(name);
        // TODO automatically capture updated settings in auto preferences
        if( typeof settings === 'object' ){
            if( settings !== p ){
                set( name, settings );
            }
        }
        // console.log('saving prefs to localStorage', name, preferences[name]);
        localStorage[name + '-preferences'] = JSON.stringify(p);
        return p;
    }
    
    function getSettings(what){
        var settings = {};
        if( typeof what === 'string' ){
            $.ajax({
                url: what,
                async: false
            })
            .done( function(html){
                settings = getSettings( $(html) );
            });
        } else if ( what instanceof $ ){
            what
                .find('[name]')
                .each( function(){
                    var elt = $(this),
                        name = elt.attr('name');
                    if( !name.match(/.*\-.*\-.*\-.*\-.*/) ){
                        setValue( settings, name, getEltVal(elt) );
                    }
                });
        } else {
            console.error('getSettings passed bad data source', what);
        }
        return settings;
    }
    
    function set(name, obj, val){
        var p = get(name);
        if( typeof obj === 'object' ){
            if( p !== obj ){
                $.extend(true, p, obj);
            } else {
                console.warn('No need to update prefs -- same object. A good thing!');
            }
        } else if ( typeof obj === 'string' ){
            setValue( p, obj, val );
        }
    }
    
    // note that if null is returned this is no information (to handle radio buttons)
    function getEltVal(elt){
        var val = elt.val();
        switch( elt.attr('type') ){
            case "checkbox":
                val = elt.prop('checked');
                break;
            case "radio":
                if( !elt.prop('checked') ){
                    val = null;
                }
                break;
        }
        return val;
    }
    
    function setEltVal(elt, setting){
        if( setting !== null ){
            switch( elt.attr('type') ){
                case "checkbox":
                    elt.prop('checked', !!setting);
                    break;
                case "radio":
                    elt.prop('checked', setting === elt.val());
                    break;
                default:
                    elt.val(setting);
            }
        }
    }
    
    function edit(name, nodes){
        var p = get(name);
        nodes.find('[name]').each( function(){
            var key = $(this).attr('name'),
                val = getValue( p, key );
            if( val !== undefined ){
                setEltVal($(this), val);
            }
        });
    }
    
    function apply(name, nodes){
        if( typeof name !== 'string' ){
            throw 'prefs.apply expects a string name';
        }
        
        var p = get(name);
        
        nodes.find('[data-pref]').each( function(){
            var val = getValue( p, $(this).attr('data-pref') );
            if( val !== undefined ){
                setEltVal($(this), val);
            }
        });
        
        nodes.find('[data-pref-auto]').each( function(){
            var elt = $(this),
                path = elt.attr('data-pref-auto'),
                val = getValue( p, path );
            if( val !== undefined ){
                setEltVal(elt, val);
            }
            elt
                .off('change.prefsAuto')
                .on('change.prefsAuto', function(){
                    setValue( p, path, getEltVal(elt));
                });
        });
    }
    
    // utility function to compare two objects (ignoring stuff in second argument that
    // isn't in the first)
    function compare(a, b, name){
        name = name ? name + '.' : '';
        $.each(a, function(key){
            if( typeof a[key] === 'object' ){
                if( typeof b[key] === 'object' ){
                    compare( a[key], b[key], name + key );
                } else {
                    console.log( key, 'not found in second argument' );
                }
            } else {
                if( a[key] !== b[key] ){
                    console.log( name + key, a[key], '!==', b[key] );
                }
            }
        });
    }
    
    function isDefault(defaultSettings, currentSettings){
        return pn.utils.isEqual(defaultSettings, currentSettings);
    }
    
    $.extend(prefs, {
        get: get,
        getSettings: getSettings,
        set: set,
        edit: edit,
        save: save,
        apply: apply,
        compare: compare,
        isDefault: isDefault
    });
});