define([
    'jquery',
    'backbone',
    'models/baseRequestModel'
], function($, Backbone, BaseRequestModel) {

    helperModel = BaseRequestModel.extend({

        initialize: function() {
        },

        defaults: _.extend({}, BaseRequestModel.prototype.defaults, {
            shifts: '',
            inctr: '',
            periton: '',
            trng: '',
            isLocOrStateSearch: '',
            cmpFacilityNames: ""
        }),
        //later move these to a constant file
        constants: {
            stateSearch: 'stateSearch',
            zipSearch: 'zipSearch',
            st: 'ST',
            stateSort: '1|ASC',
            zipSort: '12|ASC'
        },

        updateLocationAttributes: function() {
            if (this.attributes.isLocOrStateSearch == this.constants.stateSearch) {
                this.attributes.loc = '',
                this.attributes.lat = '';
                this.attributes.lng = '';
                this.attributes.type = this.constants.st;
                this.attributes.sort = this.constants.stateSort;
            } else {
                this.attributes.state = '';
                this.attributes.county = '';
                this.attributes.sort = this.constants.zipSort;
            }
        },

        validation: _.extend({}, BaseRequestModel.prototype.validation, {}),

        assignValuesToRequestModel: function(_model) {
            this.updateLocationAttributes();
            _.extend(_model.attributes, this.attributes);
        },
        assignValuesFromRequestModel: function(_model) {
            _.extend(this.attributes, _model.attributes)
            if (_model.isZipOrCitySearch()) {
                this.attributes.isLocOrStateSearch = this.constants.zipSearch;
            } else {
                this.attributes.isLocOrStateSearch = this.constants.stateSearch;
                this.attributes.loc = '';
            };
        }

    });
    return helperModel;
});