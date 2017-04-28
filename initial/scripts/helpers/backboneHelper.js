define(['jquery', 'underscore', "backbone"],
    function($, _, BB) {
        'use strict';

        $.fn.serializeObject = function() {
            var o = {};
            var a = this.serializeArray();
            $.each(a, function() {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };

        //this function will bind the modelBinder and validation 
        Backbone.View.prototype.ModelBindAndValidation = function(model, rootEL, bindings) {
            Backbone.ModelBinder.SetOptions({
                modelSetOptions: {
                    validate: true,
                    validateAll: false
                }
            });
            Backbone.Validation.bind(this, {
                model: model
            });
            this._modelBinder = new Backbone.ModelBinder();
            this._modelBinder.bind(model, rootEL, bindings);
        };

        Backbone.View.prototype.pageNavigator = function(path, trigger) {
            Backbone.history.navigate(path, {
                trigger: trigger
            });
        };

        Backbone.View.prototype.close = function() {
            if (this.beforeClose) {
                this.beforeClose();
            }
            this.remove();
            this.unbind();
        };

    });