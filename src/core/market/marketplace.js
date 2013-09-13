/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:04 PM
 * File: /core/market/marketplace.js
 */

'use strict';
function setBit(idPos, bitSet) {
    var bitSetIndex = parseInt((idPos / 32), 10);
    bitSet = bitSet || [];
    while (bitSet.length <= bitSetIndex) {
        bitSet.push(0);
    }
    bitSet[bitSetIndex] = bitSet[bitSetIndex] | ( 1 << (idPos % 32) );
    return bitSet;
}

function popcount(x) {
    var m1 = 0x55555555;
    var m2 = 0x33333333;
    var m4 = 0x0f0f0f0f;

    x -= (x >> 1) & m1;
    x = (x & m2) + ((x >> 2) & m2);
    x = (x + (x >> 4)) & m4;
    x += x >> 8;
    x += x >> 16;
    return x & 0x7f;
}

angular.module('rescour.marketplace', ['rescour.config'])
    .service('Market', ['Dimensions',
        function (Dimensions, $q) {
            // Private items data
            var activeItem = null,
                prevActive = null;

            this.dimensions = {};
            this.items = {};
            this.visibleIds = [];
            this.visibleItems = [];
            this.subsetIds = [];


            this.getActive = function () {
                return activeItem;
            };

            this.setActive = function (id) {
                if (angular.isObject(id)) {
                    prevActive = activeItem;
                    activeItem = id;
                    activeItem.isActive = true;
                } else if (this.items[id]) {
                    prevActive = activeItem;
                    activeItem = this.items[id];
                    activeItem.isActive = true;
                } else {
                    activeItem = null;
                }

                if (prevActive) {
                    prevActive.isActive = false;
                }

                return activeItem;
            };

            this.getDimensions = function () {
                return this.dimensions;
            };

            this.initialize = function (models, dimensions, Model) {
                // Apply any tags to the path
                var self = this;
                this.items = {};
                this.dimensions = new Dimensions(dimensions);

                var idPosition = 0;
                for (var _model in models) {
                    if (models.hasOwnProperty(_model)) {
                        var model = models[_model];

                        try {
                            var _item = this.items[model.id] = (Model ? new Model(model) : model);
                            this.dimensions.idMap.push(model.id);

                            for (var _discreetKey in dimensions.discreet) {
                                if (dimensions.discreet.hasOwnProperty(_discreetKey)) {
                                    var _discreetAttr = dimensions.discreet[_discreetKey];
                                    if (_item.attributes) {
                                        // If items is in attributes {} format
                                        var _discreetVal = _item.attributes.discreet[_discreetKey] = (_item.attributes.discreet[_discreetKey] || 'Unknown');
                                        self.dimensions.pushDiscreetId(_discreetKey, idPosition, _discreetVal);
                                    } else if (typeof _item[_discreetKey] !== 'undefined') {
                                        if (angular.isArray(_item[_discreetKey])) {
                                            for (var i = 0; i < _item[_discreetKey].length; i++) {
                                                var _itemAttr = _item[_discreetKey][i] = _item[_discreetKey][i] || 'Unknown',
                                                    _discreetVal;
                                                // check restrict
                                                if (_discreetAttr.restrict) {
                                                    _discreetVal = _.contains(_discreetAttr.restrict, _itemAttr) ? _itemAttr : 'Other';
                                                } else {
                                                    _discreetVal = _itemAttr;
                                                }
                                                self.dimensions.pushDiscreetId(_discreetKey, idPosition, _discreetVal);
                                            }
                                        } else {
                                            var _discreetVal;
                                            _item[_discreetKey] = _item[_discreetKey] || 'Unknown';
                                            // check restrict
                                            if (_discreetAttr.restrict) {
                                                _discreetVal = _.contains(_discreetAttr.restrict, _item[_discreetKey]) ? _item[_discreetKey] : 'Other';
                                            } else {
                                                _discreetVal = _item[_discreetKey];
                                            }
                                            self.dimensions.pushDiscreetId(_discreetKey, idPosition, _discreetVal);
                                        }
                                    } else {
                                        throw new Error("Cannot find discreet attribute: " + _discreetKey);
                                    }
                                }
                            }

                            for (var _rangeKey in dimensions.range) {
                                if (dimensions.range.hasOwnProperty(_rangeKey)) {
                                    var _rangeAttr = self.dimensions.range[_rangeKey],
                                        _itemAttr;

                                    if (_item.attributes) {
                                        _itemAttr = _item.attributes.range[_rangeKey] = _.isNumber(_item.attributes.range[_rangeKey]) ? _item.attributes.range[_rangeKey] : 'NA';
                                    } else {
                                        _itemAttr = _item[_rangeKey] = _.isNumber(_item[_rangeKey]) ? _item[_rangeKey] : 'NA'
                                    }

                                    if (!_rangeAttr.highBound) {
                                        if (((_itemAttr >= _rangeAttr.high) || _rangeAttr.high == null) && _itemAttr !== 'NA') {
                                            _rangeAttr.high = _rangeAttr.highSelected = _itemAttr;
                                        }
                                    } else {
                                        _rangeAttr.high = _rangeAttr.highSelected = _rangeAttr.highBound;
                                    }

                                    if (!_rangeAttr.lowBound) {
                                        if (((_itemAttr <= _rangeAttr.low) || _rangeAttr.low == null) && _itemAttr !== 'NA') {
                                            _rangeAttr.low = _rangeAttr.lowSelected = _itemAttr;
                                        }
                                    } else {
                                        _rangeAttr.low = _rangeAttr.lowSelected = _rangeAttr.lowBound;
                                    }
                                }
                            }
                            idPosition += 1;
                        } catch (e) {
                            console.log(e.message);
                        }
                    }
                }
                this.apply();
                this.predict();
                console.log(this.items);
                console.log(this.dimensions);
                return this.items;
            };

            this.apply = function (discreet, value) {
                var dimensions = this.dimensions,
                    items = this.items;

                this.subsetIds = [];
                this.visibleIds = [];
                this.visibleItems = [];
                dimensions.visibleIds = [];

                if (discreet && value) {
                    value.isSelected = !value.isSelected;
                    value.isSelected ? discreet.selected++ : discreet.selected--;
                }

                var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32),
                    bitSet = [],
                    i;

                for (i = 0; i < BIT_SET_LENGTH; i++) {
                    bitSet.push(~0);

                    for (var attrId in dimensions.discreet) {
                        if (dimensions.discreet.hasOwnProperty(attrId)) {
                            var _discreet = dimensions.discreet[attrId],
                                union = 0;

//                            _discreet.excludedRangeIds = [];
                            for (var valueId in _discreet.values) {
                                if (_discreet.values.hasOwnProperty(valueId)) {
                                    var _value = _discreet.values[valueId];

                                    if (_value.isSelected || _discreet.selected === 0) {
                                        union = union | _value.ids[i];
                                    }
                                }
                            }
                            _discreet.visibleIds[i] = union;
                            bitSet[i] = bitSet[i] & union;
                        }
                    }

                    for (var p = 0; p < 32; p++) {
                        var itemIndex = (i * 32) + p;
                        if (dimensions.idMap[itemIndex]) {
                            var _currItem = items[dimensions.idMap[itemIndex]];
                            if (!_.isEmpty(dimensions.range)) {

                                // Check to see if within range
                                for (var _rangeKey in dimensions.range) {
                                    if (dimensions.range.hasOwnProperty(_rangeKey)) {
                                        var _rangeAttr = dimensions.range[_rangeKey],
                                            _currItemAttr = _currItem.attributes.range[_rangeKey];

                                        if ((_currItemAttr >= _rangeAttr.lowSelected &&
                                            _currItemAttr <= _rangeAttr.highSelected) || _currItemAttr === 'NA') {
                                            _currItem.isVisible = !!(1 & bitSet[i]);
                                        } else {
                                            _currItem.isVisible = false;
                                            for (var _discreetKey in dimensions.discreet) {
                                                if (dimensions.discreet.hasOwnProperty(_discreetKey)) {
                                                    var _discreetAttr = dimensions.discreet[_discreetKey],
                                                        _mask = ~(1 << p);
                                                    _discreetAttr.visibleIds[i] = _discreetAttr.visibleIds[i] & _mask;
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }

                                // check if within subset
                                if (!this.subset || this.subset === 'all') {
                                    _currItem.isVisible = _currItem.isVisible && !_currItem.hidden;
                                    if (!_currItem.hidden) {
                                        this.subsetIds = setBit(itemIndex, this.subsetIds);
                                    }
                                } else {
                                    _currItem.isVisible = _currItem.isVisible && _currItem[this.subset];
                                    if (_currItem[this.subset]) {
                                        this.subsetIds = setBit(itemIndex, this.subsetIds);
                                    }
                                }

                                if (_currItem.isVisible) {
                                    dimensions.visibleIds = setBit(itemIndex, dimensions.visibleIds);
                                    this.visibleIds.push(dimensions.idMap[itemIndex]);
                                    this.visibleItems.push(_currItem);

                                }
                            } else {
                                _currItem.isVisible = !!(1 & bitSet[i]);

                                if (_currItem.isVisible) {
                                    dimensions.visibleIds = setBit(itemIndex, dimensions.visibleIds);
                                    this.visibleIds.push(dimensions.idMap[itemIndex]);
                                    this.visibleItems.push(_currItem);
                                }
                            }
                        }

                        bitSet[i] = bitSet[i] >> 1;
                    }
                }

                return this.visibleItems;
            };

            this.predict = function () {
                var dimensions = this.dimensions;

                var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32);

                for (var attrId in dimensions.discreet) {
                    if (dimensions.discreet.hasOwnProperty(attrId)) {
                        var _discreet = dimensions.discreet[attrId];

                        for (var valueId in _discreet.values) {
                            if (_discreet.values.hasOwnProperty(valueId)) {
                                var _value = _discreet.values[valueId];

                                if (!_value.isSelected && _discreet.selected > 0) {
                                    var predictLength = 0,
                                        predictBitSet = [];

                                    for (var i = 0; i < BIT_SET_LENGTH; i++) {
                                        var predictedUnion = _discreet.visibleIds[i] | _value.ids[i];
                                        predictBitSet.push(~0);

                                        for (var predictAttrId in dimensions.discreet) {
                                            if (dimensions.discreet.hasOwnProperty(predictAttrId)) {
                                                var _predictDiscreet = dimensions.discreet[predictAttrId];
                                                if (predictAttrId === attrId) {
                                                    predictBitSet[i] = predictBitSet[i] & predictedUnion;
                                                } else {
                                                    predictBitSet[i] = predictBitSet[i] & _predictDiscreet.visibleIds[i];
                                                }
                                            }
                                        }

                                        // add length from intersected first int]
                                        predictLength += popcount(predictBitSet[i] & _value.ids[i] & this.subsetIds[i]);
                                    }
                                    if (predictLength) {
                                        _value.badge = 'badge-success';
                                        _value.predict = "+" + predictLength;
                                        console.log(typeof _value.predict);
                                    } else {
                                        _value.badge = null;
                                        _value.predict = 0;
                                    }
                                } else {
                                    _value.predict = 0;

                                    for (var i = 0; i < BIT_SET_LENGTH; i++) {
                                        _value.predict += popcount(dimensions.visibleIds[i] & _value.ids[i]);
                                    }

                                    _value.badge = _value.predict ? 'badge-info': '';
                                }
                            }
                        }
                    }
                }
            }

            this.load = function (search) {
                this.dimensions.load(search);

                return this;
            }
        }])
    .factory('Dimensions', ['$timeout',
        function ($timeout) {
            // Dimensions Constructor
            function Dimensions(dimensions) {
                var defaults = angular.extend({
                        title: "",
                        discreet: {},
                        range: {},
                        visibleIds: [],
                        idMap: []
                    }),
                    discreetDefaults = {
                        values: {},
                        selected: 0,
                        visibleIds: []
                    },
                    rangeDefaults = {
                        ids: [],
                        na: [],
                        high: null,
                        low: null
                    },
                    self = this;

                angular.copy(defaults, self);

                for (var attrID in dimensions.discreet) {
                    if (dimensions.discreet.hasOwnProperty(attrID)) {
                        var _attr = dimensions.discreet[attrID],
                            _discreet = angular.extend(_attr, discreetDefaults);

                        self.discreet[attrID] = {};
                        angular.copy(_discreet, self.discreet[attrID]);
                    }
                }

                for (var attrID in dimensions.range) {
                    if (dimensions.range.hasOwnProperty(attrID)) {
                        var _attr = dimensions.range[attrID],
                            _range = angular.extend(_attr, rangeDefaults);

                        self.range[attrID] = {};
                        angular.copy(_range, self.range[attrID]);
                    }
                }
            }

            Dimensions.prototype.pushDiscreetId = function (attrID, idPosition, value) {
                var _discreet = this.discreet[attrID];

                if (_discreet) {
                    value = value || "Unknown";

                    if (_discreet.values.hasOwnProperty(value)) {
                        _discreet.values[value].ids = setBit(idPosition, _discreet.values[value].ids);
                    } else {
                        _discreet.values[value] = {
                            ids: [0],
                            title: value,
                            isSelected: false
                        };
                        _discreet.values[value].ids = setBit(idPosition, _discreet.values[value].ids);
                    }
                }

            };

            Dimensions.prototype.load = function (search) {
                var self = this;

                var _search = angular.extend({
                    title: '',
                    discreet: {},
                    range: {}
                }, search);

                self.id = _search.id || undefined;
                self.title = _search.title || '';

                for (var rangeID in self.range) {
                    // Check if range attribute exists
                    if (_search.range.hasOwnProperty(rangeID)) {
                        var withinLowBound = (_search.range[rangeID].lowSelected >= self.range[rangeID].low),
                            withinHighBound = (_search.range[rangeID].highSelected <= self.range[rangeID].high);

                        // Then check if the selected on the save is still within bounds
                        if (withinLowBound && withinHighBound) {
                            self.range[rangeID].lowSelected = _search.range[rangeID].lowSelected;
                            self.range[rangeID].highSelected = _search.range[rangeID].highSelected;
                        } else if (!withinLowBound && withinHighBound) {
                            self.range[rangeID].lowSelected = self.range[rangeID].low;
                            self.range[rangeID].highSelected = _search.range[rangeID].highSelected;
                        } else if (withinLowBound && !withinHighBound) {
                            self.range[rangeID].lowSelected = _search.range[rangeID].lowSelected;
                            self.range[rangeID].highSelected = self.range[rangeID].high;
                        } else {
                            self.range[rangeID].lowSelected = self.range[rangeID].low;
                            self.range[rangeID].highSelected = self.range[rangeID].high;
                        }
                    } else {
                        if (self.range.hasOwnProperty(rangeID)) {
                            self.range[rangeID].lowSelected = self.range[rangeID].low;
                            self.range[rangeID].highSelected = self.range[rangeID].high;
                        }
                    }
                }

                for (var discreetID in self.discreet) {
                    // Check if discreet attribute exists on current attributes
                    if (_search.discreet.hasOwnProperty(discreetID)) {
                        for (var attrID in _search.discreet[discreetID].values) {
                            // If the saved search attribute exists
                            if (self.discreet[discreetID].values.hasOwnProperty(attrID)) {
                                // Check to see if marked as true
                                if (_search.discreet[discreetID].values[attrID].isSelected && !self.discreet[discreetID].values[attrID].isSelected) {
                                    self.discreet[discreetID].values[attrID].isSelected = true;
                                    self.discreet[discreetID].selected++;
                                } else if (!_search.discreet[discreetID].values[attrID].isSelected && self.discreet[discreetID].values[attrID].isSelected) {
                                    self.discreet[discreetID].values[attrID].isSelected = false;
                                    self.discreet[discreetID].selected--;
                                }
                            }
                        }
                    } else {
                        if (self.discreet.hasOwnProperty(discreetID)) {
                            for (var attrID in self.discreet[discreetID].values) {
                                // If the saved search attribute exists
                                if (self.discreet[discreetID].values.hasOwnProperty(attrID)) {
                                    // Check to see if marked as true
                                    if (self.discreet[discreetID].values[attrID].isSelected) {
                                        self.discreet[discreetID].values[attrID].isSelected = false;
                                        self.discreet[discreetID].selected--;
                                    }
                                }
                            }
                        }
                    }
                }
            };

            Dimensions.prototype.toArray = function () {
                var dimensionsArr = angular.extend({}, this, {
                    discreet: _.map(this.discreet, function (val) {
                        return val
                    }),
                    range: _.map(this.range, function (val) {
                        return val
                    })
                });
                return dimensionsArr;
            };

            Dimensions.prototype.getDiscreet = function () {
                return  _.map(this.discreet, function (val) {
                    return val
                });
            };

            Dimensions.prototype.getRange = function () {
                return _.map(this.range, function (val) {
                    return val
                })
            };

            Dimensions.prototype.reset = function () {
                this.title = "";
                this.id = undefined;
                this.discreet = {};
                this.range = {};

                return this;
            };

            return Dimensions;
        }]);


