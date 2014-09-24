// <copyright file="thotpod.js" company="Nebuleaf">
// Copyright (c) 2013 All Right Reserved, http://nebuleaf.com/

// All rights reserved.
//
// THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY
// KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Authors: Alan Pledger, Craig McCown

var thotpod = (function () {
    var /** holds major version number for IE or NaN for real browsers */
        toString          = Object.prototype.toString;

    function isArray(value) {
        return toString.apply(value) == '[object Array]';
    }
    function isDate(value){
        return toString.apply(value) == '[object Date]';
    }
    function isObject(value){return value != null && typeof value == 'object';}

    function copy(source, destination){
        if (!destination) {
            destination = source;
            if (source) {
                if (isArray(source)) {
                    destination = copy(source, []);
                } else if (isDate(source)) {
                    destination = new Date(source.getTime());
                } else if (isObject(source)) {
                    destination = copy(source, {});
                }
            }
        } else {
            if (source === destination) throw Error("Can't copy equivalent objects or arrays");
            if (isArray(source)) {
                while(destination.length) {
                    destination.pop();
                }
                for ( var i = 0; i < source.length; i++) {
                    destination.push(copy(source[i]));
                }
            } else {
                _.forEach(destination, function(value, key){
                    delete destination[key];
                });
                for ( var key in source) {
                    destination[key] = copy(source[key]);
                }
            }
        }
        return destination;
    }

    /** Utility Methods **/
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

    function Dimensions(dimensions) {
        var defaults = _.extend({
                title: "",
                discrete: {},
                range: {},
                visibleIds: [],
                idMap: [],
                excludedRangeMask: []
            }),
            discreteDefaults = {
                values: {},
                selected: 0,
                visibleIds: []
            },
            rangeDefaults = {
                excludeNA: false,
                high: null,
                low: null
            },
            self = this;

        copy(defaults, this);

        for (var attrID in dimensions.discrete) {
            if (dimensions.discrete.hasOwnProperty(attrID)) {
                var _attr = dimensions.discrete[attrID],
                    _discrete = _.extend(_attr, discreteDefaults);

                self.discrete[attrID] = {};
                copy(_discrete, self.discrete[attrID]);
            }
        }

        for (var attrID in dimensions.range) {
            if (dimensions.range.hasOwnProperty(attrID)) {
                var _attr = dimensions.range[attrID],
                    _range = _.extend(_attr, rangeDefaults);

                self.range[attrID] = {};
                copy(_range, self.range[attrID]);
            }
        }
    }

    Dimensions.prototype.pushDiscreteId = function (attrID, idPosition, value) {
        var _discrete = this.discrete[attrID];

        if (_discrete) {
            value = value || "Unknown";

            if (_discrete.values.hasOwnProperty(value)) {
                _discrete.values[value].ids = setBit(idPosition, _discrete.values[value].ids);
            } else {
                _discrete.values[value] = {
                    ids: [0],
                    title: value,
                    isSelected: false
                };
                _discrete.values[value].ids = setBit(idPosition, _discrete.values[value].ids);
            }
        }
    };

    Dimensions.prototype._resetDiscreteIds = function () {
        for (var discreteAttrKey in this.discrete) {
            if (this.discrete.hasOwnProperty(discreteAttrKey)) {
                var _discreteAttr = this.discrete[discreteAttrKey];

                for (var valueKey in _discreteAttr.values) {
                    if (_discreteAttr.values.hasOwnProperty(valueKey)) {
                        var _discreteAttrValue = _discreteAttr.values[valueKey];

                        _discreteAttrValue.ids = [0];
                    }
                }
            }
        }
    };

    Dimensions.prototype.load = function (search) {
        var self = this;

        var _search = _.extend({
            title: '',
            discrete: {},
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

        for (var discreteID in self.discrete) {
            // Check if discrete attribute exists on current attributes
            if (_search.discrete.hasOwnProperty(discreteID)) {
                for (var attrID in _search.discrete[discreteID].values) {
                    // If the saved search attribute exists
                    if (self.discrete[discreteID].values.hasOwnProperty(attrID)) {
                        // Check to see if marked as true
                        if (_search.discrete[discreteID].values[attrID].isSelected && !self.discrete[discreteID].values[attrID].isSelected) {
                            self.discrete[discreteID].values[attrID].isSelected = true;
                            self.discrete[discreteID].selected++;
                        } else if (!_search.discrete[discreteID].values[attrID].isSelected && self.discrete[discreteID].values[attrID].isSelected) {
                            self.discrete[discreteID].values[attrID].isSelected = false;
                            self.discrete[discreteID].selected--;
                        }
                    }
                }
            } else {
                if (self.discrete.hasOwnProperty(discreteID)) {
                    for (var attrID in self.discrete[discreteID].values) {
                        // If the saved search attribute exists
                        if (self.discrete[discreteID].values.hasOwnProperty(attrID)) {
                            // Check to see if marked as true
                            if (self.discrete[discreteID].values[attrID].isSelected) {
                                self.discrete[discreteID].values[attrID].isSelected = false;
                                self.discrete[discreteID].selected--;
                            }
                        }
                    }
                }
            }
        }
    };

    Dimensions.prototype.toArray = function () {
        var dimensionsArr = _.extend({}, this, {
            discrete: _.map(this.discrete, function (val) {
                return val
            }),
            range: _.map(this.range, function (val) {
                return val
            })
        });
        return dimensionsArr;
    };

    Dimensions.prototype.getDiscrete = function () {
        return  _.map(this.discrete, function (val) {
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
        this.discrete = {};
        this.range = {};

        return this;
    };

    function Market(Model, opts) {
        _.extend(this, {
            sortBy: {},
            subset: 'all'
        }, opts);

        this.Model = Model;
        this.dimensions = {};
        this.items = {};
        this.visibleIds = [];
        this.visibleItems = [];
        this.subsetIds = [];
        this.initialized = false;

        this.getItems = function () {
            return _.map(this.items, function (val) {
                return val;
            })
        };

        this.load = function (search) {
            this.dimensions.load(search);

            return this;
        }
    }

    Market.prototype._initializeModels = function (models) {
        for (var modelKey in models) {
            if (models.hasOwnProperty(modelKey)) {
                var model = models[modelKey];
                try {
                    var item = (model instanceof this.Model || !this.Model) ? model : new this.Model(model);
                    this._mapItem(item);
                } catch (e) {
                    console.log(e.message);
                }
            }
        }
    };

    Market.prototype._mapItem = function (_item) {
        var self = this,
            idPosition = self.dimensions.idMap.length,
            dimensions = self.dimensions;

        if (!_item.id) {
            throw new Error("Marketplace requires ID's", _item)
        } else {
            self.items[_item.id] = _item;
        }

        dimensions.idMap.push(_item.id);

        for (var _discreteKey in dimensions.discrete) {
            if (dimensions.discrete.hasOwnProperty(_discreteKey)) {
                var _discreteAttr = dimensions.discrete[_discreteKey];
                if (typeof _item[_discreteKey] !== 'undefined') {
                    // If multiple discrete values per item (tags) need to treat as intersect
                    // TODO: always loop over arrays, only use multi to check if should intersect or union
                    if (_discreteAttr.multi) {
                        if (_item[_discreteKey].length) {
                            for (var i = 0; i < _item[_discreteKey].length; i++) {
                                var _itemAttr = _item[_discreteKey][i] = _item[_discreteKey][i] || 'Unknown',
                                    _discreteVal;
                                // check restrict
                                if (_discreteAttr.restrict) {
                                    _discreteVal = _.contains(_discreteAttr.restrict, _itemAttr) ? _itemAttr : 'Other';
                                } else {
                                    _discreteVal = _itemAttr;
                                }
                                self.dimensions.pushDiscreteId(_discreteKey, idPosition, _discreteVal);
                            }
                        } else {
                            self.dimensions.pushDiscreteId(_discreteKey, idPosition, "None");
                        }
                    } else {
                        var _discreteVal;
                        _item[_discreteKey] = _item[_discreteKey] || 'Unknown';
                        // check restrict
                        if (_discreteAttr.restrict) {
                            _discreteVal = _.contains(_discreteAttr.restrict, _item[_discreteKey]) ? _item[_discreteKey] : 'Other';
                        } else {
                            _discreteVal = _item[_discreteKey];
                        }
                        self.dimensions.pushDiscreteId(_discreteKey, idPosition, _discreteVal);
                    }
                } else {
                    throw new Error("Cannot find discrete attribute: " + _discreteKey);
                }
            }
        }

        for (var _rangeKey in dimensions.range) {
            if (dimensions.range.hasOwnProperty(_rangeKey)) {
                var _rangeAttr = self.dimensions.range[_rangeKey],
                    _itemAttr;
                if (typeof _item[_rangeKey] !== 'undefined') {
                    _itemAttr = _item[_rangeKey] = isNaN(parseFloat(_item[_rangeKey])) ? 'NA' : parseFloat(_item[_rangeKey]);

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
                } else {
                    throw new Error("Cannot find range attribute: " + _rangeKey);
                }

            }
        }
    };

    Market.prototype.initialize = function (dimensions, models) {
        // Apply any tags to the path
        if (!dimensions && !this.dimensions) {
            throw new Error("Dimensions must be defined in order to initialize Marketplace");
        }
        this.items = {};
        this.dimensions = dimensions ? new Dimensions(dimensions) : this.dimensions;
        if (models) {
            this._initializeModels(models);
            this.apply();
            this.predict();
        }
        this.initialized = true;
        return this.items;
    };

    // TODO: allow option of ignore NA

    Market.prototype.apply = function (opts) {
        var dimensions = this.dimensions,
            items = this.items;

        this.subsetIds = [];
        this.visibleIds = [];
        this.visibleItems = [];
        dimensions.visibleIds = [];
        dimensions.excludedRangeMask = [];

        var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32),
            bitSet = [],
            i;

        for (i = 0; i < BIT_SET_LENGTH; i++) {
            bitSet.push(~0);
            dimensions.excludedRangeMask.push(~0);

            for (var attrId in dimensions.discrete) {
                if (dimensions.discrete.hasOwnProperty(attrId)) {
                    var _discrete = dimensions.discrete[attrId],
//                        union = _discrete.multi ? ~0 : 0;
                        union = 0;

                    for (var valueId in _discrete.values) {
                        if (_discrete.values.hasOwnProperty(valueId)) {
                            var _value = _discrete.values[valueId];

                            // TODO: fix this, hacking only for rentmetrics
                            if (_value.isSelected || _discrete.selected === 0) {
                                union = union | _value.ids[i];
                            }
                        }
                    }

                    _discrete.visibleIds[i] = union;
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
                                    _currItemAttr = _currItem[_rangeKey],
                                    _isWithinLow = (_currItemAttr >= _rangeAttr.lowSelected) || (_rangeAttr.lowSelected == _rangeAttr.lowBound),
                                    _isWithinHigh = (_currItemAttr <= _rangeAttr.highSelected) || (_rangeAttr.highSelected == _rangeAttr.highBound);

                                // CHeck if lowBound matches lowSelected

                                if ((_isWithinLow && _isWithinHigh) ||
                                    (_currItemAttr === 'NA' && !_rangeAttr.excludeNA)) {
                                    _currItem.isVisible = !!(1 & bitSet[i]);
                                } else {
                                    _currItem.isVisible = false;
                                    dimensions.excludedRangeMask[i] = dimensions.excludedRangeMask[i] & ~(1 << p);
                                    break;
                                }
                            }
                        }

                        // check if within subset
                        if (!this.subset || this.subset === 'all') {
                            _currItem.isVisible = _currItem.isVisible && !_currItem.isHidden;
                            if (!_currItem.isHidden) {
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

        return this.sortVisibleItems();
    };

    Market.prototype.predict = function () {
        var dimensions = this.dimensions;

        var BIT_SET_LENGTH = Math.ceil(dimensions.idMap.length / 32);

        for (var attrId in dimensions.discrete) {
            if (dimensions.discrete.hasOwnProperty(attrId)) {
                var _discrete = dimensions.discrete[attrId];

                for (var valueId in _discrete.values) {
                    if (_discrete.values.hasOwnProperty(valueId)) {
                        var _value = _discrete.values[valueId];

                        if (!_value.isSelected && _discrete.selected > 0) {
                            var predictLength = 0,
                                predictBitSet = [];

                            for (var i = 0; i < BIT_SET_LENGTH; i++) {
                                var predictedUnion = _discrete.visibleIds[i] | _value.ids[i];
                                predictBitSet.push(~0);

                                for (var predictAttrId in dimensions.discrete) {
                                    if (dimensions.discrete.hasOwnProperty(predictAttrId)) {
                                        var _predictDiscrete = dimensions.discrete[predictAttrId];
                                        if (predictAttrId === attrId) {
                                            predictBitSet[i] = predictBitSet[i] & predictedUnion;
                                        } else {
                                            predictBitSet[i] = predictBitSet[i] & _predictDiscrete.visibleIds[i];
                                        }
                                    }
                                }

                                // add length from intersected first int]
                                predictLength += popcount(predictBitSet[i] & _value.ids[i] & this.subsetIds[i] & dimensions.excludedRangeMask[i]);
                            }
                            if (predictLength) {
                                _value.badge = 'success';
                                _value.predict = "+" + predictLength;
                            } else {
                                _value.badge = null;
                                _value.predict = 0;
                            }
                        } else {
                            _value.predict = 0;

                            for (var i = 0; i < BIT_SET_LENGTH; i++) {
                                _value.predict += popcount(dimensions.visibleIds[i] & _value.ids[i]);
                            }

                            _value.badge = _value.predict ? 'info' : '';
                        }
                    }
                }
            }
        }
    };

    Market.prototype.sortVisibleItems = function (predicate, reverse) {
        var _predicate = predicate || this.sortBy.predicate,
            _reverse = typeof reverse == 'undefined' ? this.sortBy.reverse : reverse,
            _items = [],
            _naItems = [];

        if (!_predicate) {
            return this.visibleItems;
        }

        function compare(a, b) {

            var v1 = a[_predicate] || a[_predicate] || null;
            var v2 = b[_predicate] || b[_predicate] || null;
            var t1 = typeof v1;
            var t2 = typeof v2;

            if (t1 == t2) {
                if (t1 == 'string') v1 = v1.toLowerCase();
                if (t1 == 'string') v2 = v2.toLowerCase();
                if (v1 === v2) return 0;
                return v1 < v2 ? -1 : 1;
            } else {
                return v1 < v2 ? -1 : 1;
            }
        }

        for (var i = this.visibleItems.length - 1; i >= 0; i--) {
            var _item = this.visibleItems[i];
            var _attr = _item[_predicate] || _item[_predicate] || null;
            if (_attr == 'NA') {
                _naItems.push(_item);
            } else {
                _items.push(_item);
            }
        }
        _items.sort(_reverse ? compare : function (a, b) {
            return compare(b, a);
        });

        this.visibleItems = _items.concat(_naItems);

        this.sortBy = {
            predicate: _predicate,
            reverse: _reverse
        };

        return this.visibleItems;
    };

    Market.prototype.addItem = function (item) {
        var item = (item instanceof this.Model || !this.Model) ? item : new this.Model(item);
        this._mapItem(item);
        this.refresh();
    };

    Market.prototype.removeItem = function (item) {
        var item = (item instanceof this.Model || !this.Model) ? item : new this.Model(item);

        if (item.id) {
            // Remove from idMap
            this.dimensions.idMap.splice(this.dimensions.idMap.indexOf(item.id), 1);
            // Remove from items
            delete this.items[item.id];
            // Refresh
            this.refresh();
        }
    };

    Market.prototype.refresh = function () {
        var dimensions = this.dimensions,
            self = this;

        this.dimensions._resetDiscreteIds();

        for (var idPosition = 0; idPosition < dimensions.idMap.length; idPosition++) {
            var _item = self.items[dimensions.idMap[idPosition]];

            for (var _discreteKey in dimensions.discrete) {
                if (dimensions.discrete.hasOwnProperty(_discreteKey)) {
                    var _discreteAttr = dimensions.discrete[_discreteKey];
                    if (typeof _item[_discreteKey] !== 'undefined') {
                        // If multiple discrete values per item (tags) need to treat as intersect
                        // TODO: always loop over arrays, only use multi to check if should intersect or union
                        if (_discreteAttr.multi) {
                            if (_item[_discreteKey].length) {
                                for (var i = 0; i < _item[_discreteKey].length; i++) {
                                    var _itemAttr = _item[_discreteKey][i] = _item[_discreteKey][i] || 'Unknown',
                                        _discreteVal;
                                    // check restrict
                                    if (_discreteAttr.restrict) {
                                        _discreteVal = _.contains(_discreteAttr.restrict, _itemAttr) ? _itemAttr : 'Other';
                                    } else {
                                        _discreteVal = _itemAttr;
                                    }
                                    self.dimensions.pushDiscreteId(_discreteKey, idPosition, _discreteVal);
                                }
                            } else {
                                self.dimensions.pushDiscreteId(_discreteKey, idPosition, "None");
                            }
                        } else {
                            var _discreteVal;
                            _item[_discreteKey] = _item[_discreteKey] || 'Unknown';
                            // check restrict
                            if (_discreteAttr.restrict) {
                                _discreteVal = _.contains(_discreteAttr.restrict, _item[_discreteKey]) ? _item[_discreteKey] : 'Other';
                            } else {
                                _discreteVal = _item[_discreteKey];
                            }
                            self.dimensions.pushDiscreteId(_discreteKey, idPosition, _discreteVal);
                        }
                    } else {
                        throw new Error("Cannot find discrete attribute: " + _discreteKey);
                    }
                }
            }

        }

        this.apply();
        this.predict();

        return this;
    };

    Market.prototype.toggleDiscrete = function (discrete, value) {
        if (discrete && value) {

            // if discreet is string, use it as key

            // else if object select it
            value.isSelected = !value.isSelected;
            value.isSelected ? discrete.selected++ : discrete.selected--;
        }

        return this;
    };

    Market.prototype.applyRange = function (rangeKey, low, high) {

        // Check if null

        // If not null, make sure is a number

        if (this.dimensions.range.hasOwnProperty(rangeKey)) {
            var _range = this.dimensions.range[rangeKey];

            // parseFloat (null) = NaN
            // parseFloat ('String') = NaN
            // NaN is falsy
            _range.lowSelected = parseFloat(low) ? low : _range.low;
            _range.highSelected = parseFloat(high) ? high : _range.high;
        } else {
            throw new Error("Cannot find range dimension " + rangeKey);
        }

        return this;
    };

    Market.prototype.excludeNA = function (rangeKey) {
        this.dimensions.range[rangeKey].excludeNA = true;
        return this;
    };

    Market.prototype.includeNA = function (rangeKey) {
        this.dimensions.range[rangeKey].excludeNA = false;
        return this;
    };

    return {
        Marketplace: Market
    }
})();
