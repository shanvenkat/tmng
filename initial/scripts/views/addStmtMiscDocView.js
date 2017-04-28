// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'text!templates/markStatementsTemplate.html'],


    function($, jqueryui, Backbone, additionalStatementsTemplate) {
        'use strict';

        var AddStmtMiscDocView = Backbone.View.extend({

            //tagName: 'li',

            render: function(sequence) {
                this.template = _.template($(additionalStatementsTemplate).filter("#addStmtMiscDoc").html(), {
                    model: this.model,
                    sequence: sequence
                });

                this.$el.html(this.template);
                this.ModelBindAndValidation(this.model, this.$el);

                return this;
              }

        });

        return AddStmtMiscDocView;
    }

);
