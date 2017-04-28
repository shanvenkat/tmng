// SearchView.js
// -------
define(['jquery', 'jqueryui', 'backbone', 'views/addStmtMiscDocView'],

    function($, jqueryui, Backbone, AddStmtMiscDocView) {
        'use strict';

        var AddStmtMiscDocCollectionView = Backbone.View.extend({

            //tagName: 'ul',

            initialize: function() {

            },
            render: function() {
                var c = 0;

                this.collection.each(function(doc){
                    if (!doc.get('isDeleted')) {
                        var docView = new AddStmtMiscDocView({ model: doc });
                        this.$el.append(docView.render(c).el);
                    }
                    c++;
                }, this);
                return this;
            }

        });

        return AddStmtMiscDocCollectionView;
    }


);
