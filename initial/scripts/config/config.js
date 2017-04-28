// Require.js Configurations
// -------------------------
require.config({

    // Sets the js folder as the base directory for all future relative paths
    //~~baseUrl: "/app/",

    paths: {

        // Core Libraries
        // ---------------
        backbone: '../vendor/backbone/backbone',

        bootstrap: '../vendor/bootstrap/bootstrap',

        jpanel: '../vendor/jpanelmenu/jquery.jpanelmenu',

        jquery: '../vendor/jquery/jquery',

        jqueryui: '../vendor/jqueryui/jquery-ui',

        underscore: '../vendor/lodash/lodash',

        respond: '../vendor/respond/respond.src',

        // Plugins
        // ---------------
        backboneModelBinder: "../vendor/Backbone.ModelBinder/Backbone.ModelBinder",

        backboneValidateAll: '../vendor/Backbone.validateAll/Backbone.validateAll',

        backboneValidation: './helpers/backboneValidation',

        jqueryequalheights: '../vendor/jqueryequalheights/jquery.equalheights',

        text: '../vendor/requirejs-plugins/text',

        sinon: '../vendor/sinonjs/sinon',

        customInput: '../vendor/jquery.customInput/custominput',

        equalize: '../vendor/equalize/equalize',

        editable: '../vendor/xeditable/bootstrap-editable',

        textEditor: '../vendor/textEditor/summernote.min',

        codeMirror: '../CodeMirror',

        moment: '../vendor/moment/moment.min'

    },

    // Sets the configuration for your third party scripts that are not AMD compatible
    shim: {

        // Twitter Bootstrap jQuery plugins
        bootstrap: ['jquery'],

        sinon: {

            // Depends on underscore/lodash and jQuery
            'deps': ['jquery'],

            // Exports the global window.Backbone object
            'exports': 'sinon'

        },

        customInput: ['jquery'],

        equalize: ['jquery'],

        CodeMirror: { 'exports': 'CodeMirror' },

        textEditor: {
            // Depends on jquery
            'deps':['jquery', 'CodeMirror'],

            'exports': 'textEditor'
        },

        // Backbone
        backbone: {

            // Depends on underscore/lodash and jQuery
            'deps': ['underscore', 'jquery'],

            // Exports the global window.Backbone object
            'exports': 'Backbone'

        },

        // Backbone.validateAll plugin that depends on Backbone
        backboneValidateAll: {
            "deps": ["jquery", "underscore", "backbone"],
            "exports": "backboneValidateAll"
        },

        // Backbone.ModelBinder plugin that depends on Backbone
        backboneModelBinder: {
            "deps": ["jquery", "underscore", "backbone"],
            "exports": "backboneModelBinder"
        },

        backboneValidation: {
            "deps": ["jquery", "underscore", "backbone", "backboneValidateAll"],
            "exports": "backboneValidation"
        },


        // jQuery Panel Menu plugin that depends on jQuery
        jpanel: ['jquery'],

        //jqueryequalheights: ['jquery'],
        jqueryequalheights: ['jquery'],

        // jQuery UI
        jqueryui: ['jquery'],

        //xeditable
        editable: {

            // Depends on  jQuery
            'deps': ['jquery'],

            // Exports the editable
            'exports': 'editable'

        }

    }

});