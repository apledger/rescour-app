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
    var m1 = 0x55555555; //binary: 0101...
    var m2 = 0x33333333; //binary: 00110011..
    var m4 = 0x0f0f0f0f; //binary:  4 zeros,  4 ones ...

    x -= (x >> 1) & m1;             //put count of each 2 bits into those 2 bits
    x = (x & m2) + ((x >> 2) & m2); //put count of each 4 bits into those 4 bits
    x = (x + (x >> 4)) & m4;        //put count of each 8 bits into those 8 bits
    x += x >> 8;  //put count of each 16 bits into their lowest 8 bits
    x += x >> 16;  //put count of each 32 bits into their lowest 8 bits
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

            this.items = {};

            this.getItems = function () {
                return _.map(this.items, function (val) {
                    return val;
                });
            };

            this.getDimensions = function () {
                return this.dimensions.toArray();
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
//                            self.dimensions.visibleIds.push(model.id);
                        } catch (e) {
                            console.log(e.message);
                        }
                    }
                }
                this.apply();
                console.log(this.items);
                console.log(this.dimensions);
                return this.items;
            };

            this.render = function (subset) {
                var self = this,
                    dimensions = this.dimensions;
                self.visibleIds = [];
                self.subset = subset || self.subset;

                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        if (!self.subset || self.subset === 'all') {
                            this.items[id].isVisible = _.contains(dimensions.visibleIds, id) && !this.items[id].hidden;
                        } else {
                            this.items[id].isVisible = _.contains(dimensions.visibleIds, id) && this.items[id][self.subset];
                        }
                        this.items[id].isVisible ? self.visibleIds.push(id) : null;
                    }
                }
            };

            this.apply = function (discreet, value) {
                var dimensions = this.dimensions,
                    items = this.items;

                this.visibleIds = [];
                dimensions.visibleIds = [];
                dimensions.excludedRangeIds = 0;

                // apply is called on init, so we have to check whether args are passed in
                if (discreet && value) {
                    value.isSelected = !value.isSelected;
                    value.isSelected ? discreet.selected++ : discreet.selected--;
                }

                // determines how many integers we need to store n bits, if n is number of items
                var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32),
                    bitSet = [],
                    i;

                // each integer is first flattened into a single integer within each discreet category
                // by taking the union of all sets. Each of those flattened integers are
                for (i = 0; i < BIT_SET_LENGTH; i++) {
                    bitSet.push(~0);

                    for (var attrId in dimensions.discreet) {
                        if (dimensions.discreet.hasOwnProperty(attrId)) {
                            var _discreet = dimensions.discreet[attrId],
                                union = 0;

                            for (var valueId in _discreet.values) {
                                if (_discreet.values.hasOwnProperty(valueId)) {
                                    var _value = _discreet.values[valueId];

                                    _value.excludedRangeIds = [];
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
                        // index is (i * 32) + whatever bit number is flipped
                        var itemIndex = (i * 32) + p;
                        if (dimensions.idMap[itemIndex]) {
                            var _currItem = items[dimensions.idMap[itemIndex]];
                            if (!_.isEmpty(dimensions.range)) {
                                for (var _rangeKey in dimensions.range) {
                                    if (dimensions.range.hasOwnProperty(_rangeKey)) {
                                        var _rangeAttr = dimensions.range[_rangeKey],
                                            _currItemAttr = _currItem.attributes.range[_rangeKey];

                                        if ((_currItemAttr >= _rangeAttr.lowSelected &&
                                            _currItemAttr <= _rangeAttr.highSelected) || _currItemAttr === 'NA') {
                                            _currItem.isVisible = !!(1 & bitSet[i]);

                                            if (_currItem.isVisible) {
                                                dimensions.visibleIds = setBit(itemIndex, dimensions.visibleIds);
                                                this.visibleIds.push(dimensions.idMap[itemIndex]);
                                            }
                                        } else {
                                            _currItem.isVisible = false;

                                            for (var _discreetKey in dimensions.discreet) {
                                                if (dimensions.discreet.hasOwnProperty(_discreetKey)) {
                                                    var _discreetAttr = dimensions.discreet[_discreetKey];

                                                    _discreetAttr.excludedRangeIds = setBit(itemIndex, _discreetAttr.excludedRangeIds)
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                            } else {
                                _currItem.isVisible = !!(1 & bitSet[i]);

                                if (_currItem.isVisible) {
                                    this.visibleIds.push(dimensions.idMap[itemIndex]);
                                }
                            }
                        }

                        bitSet[i] = bitSet[i] >> 1;
                    }
                }

                this.predict();
            };

            this.predict = function () {
                var dimensions = this.dimensions;

                // determines how many integers we need to store n bits, if n is number of items
                var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32);

                console.log("start", dimensions);
                for (var attrId in dimensions.discreet) {
                    if (dimensions.discreet.hasOwnProperty(attrId)) {
                        var _discreet = dimensions.discreet[attrId];

                        for (var valueId in _discreet.values) {
                            if (_discreet.values.hasOwnProperty(valueId)) {
                                var _value = _discreet.values[valueId];

                                // If value is selected intersect with visible section
                                if (!_value.isSelected && _discreet.selected > 0) {
                                    // what would the values be if it were selected
                                    var predictLength = 0,
                                        predictBitSet = [];

                                    for (var i = 0; i < BIT_SET_LENGTH; i++) {
//                                        predictBitSet[i] = _discreet.visibleIds[i] | _value.ids[i];
                                        var predictedUnion = (_discreet.visibleIds[i] | _value.ids[i]) & ~_discreet.excludedRangeIds[i];
                                        predictBitSet.push(~0);

                                        // using that individual predictedUnion, intersect across, add predict value into predictLength

                                        for (var predictAttrId in dimensions.discreet) {
                                            // Dont intersect with self
                                            if (dimensions.discreet.hasOwnProperty(predictAttrId)) {
                                                var _predictDiscreet = dimensions.discreet[predictAttrId];

                                                if (predictAttrId === attrId) {
                                                    predictBitSet[i] = predictBitSet[i] & predictedUnion;
                                                } else {
                                                    predictBitSet[i] = predictBitSet[i] & _predictDiscreet.visibleIds[i] & ~_predictDiscreet.excludedRangeIds[i];
                                                }
                                            }
                                        }

                                        // add length from intersected first int
                                        predictLength += popcount(predictBitSet[i] & _value.ids[i] & ~_value.excludedRangeIds[i]);
                                    }
                                    _value.predict = predictLength - dimensions.excludedRangeIds;
                                } else {
                                    _value.predict = 0;

                                    for (var i = 0; i < BIT_SET_LENGTH; i++) {
                                        _value.predict += popcount(dimensions.visibleIds[i] & _value.ids[i]);
                                    }
                                }

                            }
                        }
                    }
                }
                console.log("end", dimensions);
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
                        visibleIds: [],
                        excludedRangeIds: []
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
//                        if (_discreet.values[value].ids.length < this.idMap.length / 32) {
//                            _discreet.values[value].ids.push(0);
//                        }
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

            Dimensions.prototype.reset = function () {
                this.title = "";
                this.id = undefined;
                this.discreet = {};
                this.range = {};

                return this;
            };

            return Dimensions;
        }])
    .directive('slider', ['Market', function (Market) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                function setupSlider() {
                    $(element).slider({
                        range: true,
                        min: 0,
                        max: 100,
                        // Calculate percentages based off what the low selected and high selected are
                        values: [
                            parseInt((((scope.range.lowSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100), 10),
                            parseInt((((scope.range.highSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100), 10)
                        ],
                        step: 1,
                        slide: function (event, ui) {
                            scope.$apply(function () {
                                scope.range.lowSelected = parseInt((((ui.values[0] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                                scope.range.highSelected = parseInt((((ui.values[1] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                            });
                        },
                        stop: function (event, ui) {
                            scope.$apply(function () {
                                Market.apply();
                            });

                            // WHY THE FUCK DO I NEED TO CALL THIS TWICE??
                            scope.$apply();
                        }
                    });
                }

                setupSlider();
            }
        };
    }]);


