/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:04 PM
 * File: /core/market/market.js
 */

'use strict';

angular.module('rescour.market', [])
    .value('$dimensions', {
        discreet:{
            'broker':{
                title:'Broker',
                weight:10
            },
            'state':{
                title:'State',
                weight:9
            },
            'propertyStatus':{
                title:'Property Status',
                weight:8
            },
            'propertyType':{
                title:'Property Type',
                weight:7
            }
        },
        range:{
            'numUnits':{
                title:'Number of Units',
                bound:500,
                weight:10
            },
            'yearBuilt':{
                title:'Year Built',
                weight:9
            }
        }
    })
    .factory('Item', ['$_api', '$q', '$http', 'Attributes', 'Comment', 'Finance',
    function ($_api, $q, $http, Attributes, Comment, Finance) {

        // Item constructor
        var Item = function (data) {
            if (data.hasOwnProperty('id')) {
                this.id = data.id;
            } else {
                throw new Error("Cannot find id in " + data);
            }
            var defaults = {
                    attributes:{
                        discreet:{},
                        range:{}
                    },
                    address:{
                        street1:'No address listed'
                    },
                    isVisible:true
                },
                opts = angular.extend({}, defaults, data),
                self = this;

            angular.copy(opts, this);
            this.title = this.title || 'Untitled Property';
            this.description = this.description || 'No description provided.';
            this.thumbnail = this.thumbnail || '/img/apt0.jpg';
            this.location = (data.address.latitude && data.address.longitude) ? [data.address.latitude, data.address.longitude] : null;

            angular.forEach(this.attributes.discreet, function (value, key) {
                if (!value) {
                    self.attributes.discreet[key] = 'Unknown'
                }
            });

            angular.forEach(this.attributes.range, function (value, key) {
                if (_.isNaN(parseInt(value, 10)) || !value) {
                    self.attributes.range[key] = 'NA'
                }
            });

            // Populate Attributes id stacks during construction of each item object
            this._mapAttributes();
        };

        Item.query = function () {
            var defer = $q.defer(),
                config = angular.extend({
                    transformRequest:function (data) {
                        return data;
                    }
                }, $_api.config);

            $http.get($_api.path + '/properties/', config).then(function (response) {
                defer.resolve(response);
            }, function (response) {
                defer.reject(response);
            });

            return defer.promise;
        };

        Item.prototype._mapAttributes = function () {
            for (var attrID in this.attributes.discreet) {
                if (this.attributes.discreet.hasOwnProperty(attrID)) {
                    Attributes.pushDiscreetId(attrID, this.id, this.attributes.discreet[attrID]);
                }
            }
            for (var attrID in this.attributes.range) {
                if (this.attributes.range.hasOwnProperty(attrID)) {
                    Attributes.pushRangeId(attrID, this.id, this.attributes.range[attrID]);
                }
            }
        };

        Item.prototype.getDetails = function () {
            var self = this,
                defer = $q.defer(),
                config = angular.extend({
                    transformRequest:function (data) {
                        self.details.$spinner = true;
                        return data;
                    }
                }, $_api.config),
                locals = {
                    defaultFinances:[
                        {
                            name:'Valuation',
                            valueFormat:'currency'
                        },
                        {
                            name:'Cap Rate',
                            valueFormat:'percentage'},
                        {
                            name:'IRR',
                            valueFormat:'percentage'
                        },
                        {
                            name:'Price / Unit',
                            valueFormat:'currency'
                        }
                    ]
                };

            self.details = self.details || {};

            $http.get($_api.path + '/properties/' + this.id, config).then(function (response) {
                angular.copy(response.data, self.details);
                self.details.$spinner = false;
                try {
                    if (angular.isArray(self.details.comments)) {
                        locals.comments = self.details.comments;
                        self.details.comments = [];
                        for (var i = 0, len = locals.comments.length; i < len; i++) {
                            self.addComment(locals.comments[i]);
                        }
                    } else {
                        throw new Error("Comments are not an array");
                    }

                    if (angular.isArray(self.details.finances)) {
                        locals.finances = self.details.finances;
                        self.details.finances = [];
                        for (var i = 0, len = locals.defaultFinances.length; i < len; i++) {
                            var _finance = _.find(locals.finances, function (val) {
                                return val.name === locals.defaultFinances[i].name;
                            });
                            // If can't find default value in current finances, create it
                            if (!_finance) {
                                self.addFinance(locals.defaultFinances[i]);
                            } else { // Otherwise it's found, just add it
                                self.addFinance(_finance);
                                // Remove it from locals after adding
                                locals.finances = _.reject(locals.finances, function (val) {
                                    return angular.equals(val, _finance);
                                });
                            }
                        }

                        // Loop through remaining and add them
                        for (var i = 0, len = locals.finances.length; i < len; i++) {
                            self.addFinance(locals.finances[i]);
                        }
                    } else {
                        throw new Error("Finances are not an array");
                    }
                    defer.resolve(self);
                } catch (e) {
                    defer.reject(response);
                    console.log(e.message);
                }

            }, function (response) {
                self.details.$spinner = false;
                defer.reject(response);
            });

            return defer.promise;
        };

        Item.prototype.addComment = function (comment) {
            var newComment = new Comment(comment, this);

            newComment.propertyId = newComment.propertyId || this.id;

            if (angular.isArray(this.details.comments)) {
                this.details.comments.push(newComment);
            } else {
                this.details.comments = [newComment];
            }

            return newComment;
        };

        Item.prototype.deleteComment = function (comment) {
            var self = this;

            self.details.comments = _.reject(self.details.comments, function (value) {
                return angular.equals(value, comment);
            });
        };

        Item.prototype.addFinance = function (finance) {
            var newFinance = new Finance(finance, this);

            newFinance.propertyId = newFinance.propertyId || this.id;

            if (angular.isArray(this.details.finances)) {
                this.details.finances.push(newFinance);
            } else {
                this.details.finances = [newFinance];
            }

            return newFinance;
        };

        Item.prototype.deleteFinance = function (finance) {
            var self = this;

            if (finance.id) {
                finance.$delete().then(function (response) {
                    self.details.finances = _.reject(self.details.finances, function (value) {
                        return angular.equals(value, finance);
                    });
                });
            } else {
                self.details.finances = _.reject(self.details.finances, function (value) {
                    return angular.equals(value, finance);
                });
            }
        };

        Item.prototype.toggleFavorites = function () {
            var defer = $q.defer(),
                self = this,
                config = angular.extend({
                    transformRequest:function (data) {
                        self.$spinner = true;
                        return data;
                    }
                }, $_api.config),
                body = JSON.stringify({value:(!self.favorites).toString()});

            $http.post($_api.path + '/properties/' + this.id + '/favorites/', body, config).then(
                function (response) {
                    self.$spinner = false;
                    self.favorites = !self.favorites;
                    defer.resolve(response);
                },
                function (response) {
                    self.$spinner = false;
                    defer.reject(response);
                }
            );
        };

        Item.prototype.toggleHidden = function () {
            var defer = $q.defer(),
                self = this,
                config = angular.extend({
                    transformRequest:function (data) {
                        self.$spinner = true;
                        return data;
                    }
                }, $_api.config),
                body = JSON.stringify({value:(!self.hidden).toString()});

            $http.post($_api.path + '/properties/' + this.id + '/hidden/', body, config).then(
                function (response) {
                    self.$spinner = false;
                    self.hidden = !self.hidden;
                    defer.resolve(response);
                },
                function (response) {
                    self.$spinner = false;
                    defer.reject(response);
                }
            );
        };

        Item.prototype.getAttribute = function (name) {
            if (this.attributes.discreet.hasOwnProperty(name)) {
                return this.attributes.discreet[name];
            } else if (this.attributes.range.hasOwnProperty(name)) {
//                    var parsed = parseInt(this.attributes.range[name], 10);
                return this.attributes.range[name];
            } else {
                return "Not Available";
            }
        };

        Item.prototype.getStatusClass = function (type) {
            var suffix = (type === 'solid' || type === 'gradient') ? '-' + type : '';

            switch (this.getAttribute('propertyStatus')) {
                case 'Marketing':
                    return 'status-marketing' + suffix;
                case 'Under Contract':
                    return 'status-under' + suffix;
                case 'Under LOI':
                    return 'status-under' + suffix;
                case 'Expired':
                    return 'status-expired' + suffix;
                default:
                    return 'status-unknown' + suffix;
            }

        };

        Item.prototype.getAddress = function () {
            var addressStr = '';

            if (this.address.street1) {
                addressStr += this.address.street1;
            }
            if (this.address.state) {
                addressStr += ', ';
                addressStr += this.address.city ? this.address.city + ', ' + this.address.state : this.address.state;
            }
            if (this.address.zip) {
                addressStr += ' ';
                addressStr += this.address.zip;
            }

            return addressStr;
        };

        Item.prototype.getImages = function () {
            return this.details ? _.map(this.details.images, function (value) {
                return value;
            }) : undefined;
        };
        return Item;
    }])
    .service('Items', ['Attributes', 'Item',
    function (Attributes, Item) {
        // Private items data
        var active = null;
        this.items = {};
        this.visibleIds = [];

        this.setActive = function (item) {
            active = item;
            return active;
        };

        this.getActive = function () {
            return active;
        };

        this.toArray = function () {
            return _.map(this.items, function (val) {
                return val;
            });
        };

        this.initialize = function (products) {
            this.items = {};
            for (var id in products) {
                if (products.hasOwnProperty(id)) {
                    try {
                        this.items[id] = new Item(products[id]);
                    } catch (e) {
                        console.log(e.message);
                    }
                }
            }
            Attributes.initialize().apply().predict();
            this.render();
        };

        this.reload = function () {
            for (var id in this.items) {
                if (this.items.hasOwnProperty(id)) {
                    this.items[id]._mapAttributes(Attributes);
                }
            }
            Attributes.initialize();
        };

        this.render = function (subset) {
            this.visibleIds = [];

            if (!subset || subset === 'all') {
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].isVisible = (_.contains(Attributes.visibleIds, id) && !this.items[id].hidden);
                        this.items[id].isVisible ? this.visibleIds.push(id) : null;
                    }
                }
            } else if (subset === 'notes') {
                for (var i = 0, len = Attributes.visibleIds.length; i < len; i++) {
                    var _id = Attributes.visibleIds[i];
                    if (this.items.hasOwnProperty(_id)) {
                        this.items[_id].isVisible = this.items[_id].hasComments || this.items[_id].hasFinances;
                        this.items[_id].isVisible ? this.visibleIds.push(_id) : null;
                    }
                }
            } else {
                for (var i = 0, len = Attributes.visibleIds.length; i < len; i++) {
                    var _id = Attributes.visibleIds[i];
                    if (this.items.hasOwnProperty(_id)) {
                        this.items[_id].isVisible = this.items[_id][subset];
                        this.items[_id].isVisible ? this.visibleIds.push(_id) : null;
                    }
                }
            }
        };
    }])
    .factory('Attributes', ['$timeout', '$dimensions',
    function ($timeout, $dimensions) {
        // Attributes Constructor
        function Attributes() {
            var defaults = angular.extend({
                    title:"",
                    discreet:{},
                    range:{},
                    visibleIds:[]
                }, $dimensions),
                discreetDefaults = {
                    values:{},
                    selected:0,
                    visibleIds:[]
                },
                rangeDefaults = {
                    ids:[],
                    na:[],
                    high:null,
                    low:null
                },
                self = this;

            angular.copy(defaults, this);

            angular.forEach(this.discreet, function (value, key) {
                var _discreet = angular.extend({}, discreetDefaults, value);
                angular.copy(_discreet, self.discreet[key]);
            });

            angular.forEach(this.range, function (value, key) {
                var _range = angular.extend({}, rangeDefaults, value);
                angular.copy(_range, self.range[key]);
            });
        }

        Attributes.prototype.pushDiscreetId = function (attrID, itemID, value) {
            // Only add if dimension already exists
            if (_.has(this.discreet, attrID)) {
                var _discreet = this.discreet[attrID];
                value = value || "Unknown";

                if (_.has(_discreet.values, value)) {
                    _discreet.values[value].ids.push(itemID);
                } else {
                    _discreet.values[value] = {
                        ids:[itemID],
                        title:value,
                        isSelected:false
                    };
                }
            }
        };

        Attributes.prototype.pushRangeId = function (attrID, itemID, value) {
            if (_.has(this.range, attrID)) {
                var _range = this.range[attrID],
                    parsedVal = parseInt(value, 10),
                    boundedVal = _.isNaN(parsedVal) ? "NA" : ($dimensions.range[attrID].bound ? (parsedVal > $dimensions.range[attrID].bound ? $dimensions.range[attrID].bound : parsedVal) : parsedVal);
                if (boundedVal === "NA") {
                    _range.na.push(itemID);
                }
                else {
                    _range.ids.push({
                        id:itemID,
                        value:boundedVal
                    });

                    // Check to see if current value is the low bound value
                    if (_range.low === null || parsedVal <= _range.low) {
                        _range.low = boundedVal;
                    }

                    // Check to see if the current value is the high bound value
                    if (_range.high === null || parsedVal >= _range.high) {
                        _range.high = boundedVal;
                    }
                }
            }
        };

        Attributes.prototype.initialize = function () {
            var attrID;
            // Set selected to the bounds of high and low
            if (this.range !== {}) {
                _.each(this.range, function (r) {
                    r.highSelected = r.highSelected || r.high;
                    r.lowSelected = r.lowSelected || r.low;
                });
            }

            // Sort
            for (attrID in this.range) {
                if (this.range.hasOwnProperty(attrID)) {
                    this.range[attrID].ids = _.sortBy(this.range[attrID].ids, function (i) {
                        return i.value;
                    });
                }
            }

            return this;
        };

        Attributes.prototype.apply = function () {
            this.visibleIds = this._calcRangeVisible()._calcDiscreetVisible()._intersectVisible();
            return this;
        };

        Attributes.prototype.predict = function () {
            var self = this;
            angular.forEach(self.discreet, function (parent) {
                angular.forEach(parent.values, function (value) {
                    $timeout(function () {
                        var len;
                        if (parent.selected > 0 && !value.isSelected) {
                            // Calculate length
                            value.compare = true;
                            len = (self._calcDiscreetVisible()._intersectVisible()).length - self.visibleIds.length;
                            delete value.compare;

                            if (len > 0) {
                                value.badge = "badge-success";
                                value.predict = "+" + len;
                            } else {
                                value.badge = ""; // Otherwise leave gray
                                value.predict = 0;
                            }
                        } else { // Means that there is nothing selected in this attribute section,
                            // or this value is the one selected

                            // Calculate intersection of this value and what current visible is
                            len = _.intersection(value.ids, self.visibleIds).length;

                            // Make the badge blue if greater than 0
                            value.badge = len ? "badge-info" : "";

                            // Return the value
                            value.predict = len;
                        }
                    }, 0);
                });
            });

            return this;
        };

        Attributes.prototype.load = function (search) {
            var self = this;
            if (search) {
                this.id = search.id || undefined;
                this.title = search.title || undefined;
                // error handling here
                for (var rangeID in search.range) {
                    try {
                        // Check if range attribute exists
                        if (_.has(self.range, rangeID)) {
                            var withinLowBound = (search.range[rangeID].lowSelected >= self.range[rangeID].low),
                                withinHighBound = (search.range[rangeID].highSelected <= self.range[rangeID].high);
                            // Then check if the selected on the save is still within bounds
                            if (withinLowBound && withinHighBound) {
                                self.range[rangeID].lowSelected = search.range[rangeID].lowSelected;
                                self.range[rangeID].highSelected = search.range[rangeID].highSelected;
                            } else if (!withinLowBound && withinHighBound) {
                                self.range[rangeID].lowSelected = self.range[rangeID].low;
                                self.range[rangeID].highSelected = search.range[rangeID].highSelected;
                            } else if (withinLowBound && !withinHighBound) {
                                self.range[rangeID].lowSelected = search.range[rangeID].lowSelected;
                                self.range[rangeID].highSelected = self.range[rangeID].high;
                            } else {
                                self.range[rangeID].lowSelected = self.range[rangeID].low;
                                self.range[rangeID].highSelected = self.range[rangeID].high;
                            }
                        } else {
                            throw new Error(rangeID + " not found in range");
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                }

                for (var discreetID in search.discreet) {
                    try {
                        // Check if discreet attribute exists on current attributes
                        if (_.has(self.discreet, discreetID)) {
                            for (var attrID in search.discreet[discreetID].values) {
                                // If the saved search attribute exists
                                if (_.has(self.discreet[discreetID].values, attrID)) {
                                    // Check to see if marked as true
                                    if (search.discreet[discreetID].values[attrID].isSelected && !self.discreet[discreetID].values[attrID].isSelected) {
                                        self.discreet[discreetID].values[attrID].isSelected = true;
                                        self.discreet[discreetID].selected++;
                                    } else if (!search.discreet[discreetID].values[attrID].isSelected && self.discreet[discreetID].values[attrID].isSelected) {
                                        self.discreet[discreetID].values[attrID].isSelected = false;
                                        self.discreet[discreetID].selected--;
                                    }
                                }
                            }
                        } else {
                            throw new Error(discreetID + " not found in discreet");
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                }
            } else {
                this.id = undefined;
                this.title = undefined;
                // error handling here
                for (var rangeID in self.range) {
                    if (self.range.hasOwnProperty(rangeID)) {
                        self.range[rangeID].lowSelected = self.range[rangeID].low;
                        self.range[rangeID].highSelected = self.range[rangeID].high;
                    }
                }

                for (var discreetID in self.discreet) {
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

        Attributes.prototype.toArray = function () {
            var attributesArr = angular.extend({}, this, {
                discreet:_.map(this.discreet, function (val) {
                    return val
                }),
                range:_.map(this.range, function (val) {
                    return val
                })
            });
            return attributesArr;
        };

        Attributes.prototype._reset = function () {
            this.title = "";
            this.id = undefined;
            this.discreet = {};
            this.range = {};
        };

        Attributes.prototype._calcRangeVisible = function () {
            var self = this;

            for (var rangeID in self.range) {
                if (self.range.hasOwnProperty(rangeID)) {
                    var endpointArray = [],
                        _range = self.range[rangeID];

                    // Iterate from bottom to find low bound on sorted id array
                    for (var j = 0; j < _range.ids.length; j++) {
                        if (_range.ids[j].value >= _range.lowSelected) {
                            endpointArray.push(j);
                            break;
                        }
                    }

                    if (_range.highSelected >= _range.bound) {
                        endpointArray.push(_range.ids.length - 1);
                    } else {
                        // Iterate from top to find high bound on sorted id array
                        for (var i = _range.ids.length - 1; i > 0; i--) {

                            if (_range.ids[i].value <= _range.highSelected) {
                                endpointArray.push(i);
                                break;
                            }
                        }
                    }

                    endpointArray[1] = endpointArray[1] || endpointArray[0];

                    // Remove ids from id, value objects

                    self.range[rangeID].visibleIds = _.union(
                        _range.na, // concat
                        _.map(_range.ids.slice(endpointArray[0], endpointArray[1] + 1),
                            function (idPair) {
                                return idPair.id;
                            })
                    );
                }
            }

            return this;
        };

        Attributes.prototype._calcDiscreetVisible = function () {
            var unionArray = [],
                self = this;

            for (var discreetID in self.discreet) {
                if (self.discreet.hasOwnProperty(discreetID)) {
                    unionArray = [];
                    var _discreet = self.discreet[discreetID];
                    _discreet.selected = 0;
                    for (var attrID in _discreet.values) {
                        if (self.discreet[discreetID].values.hasOwnProperty(attrID)) {
                            var _value = self.discreet[discreetID].values[attrID];
                            if (_value.isSelected || _value.compare) {
                                unionArray = unionArray.concat(_value.ids);
                            }
                            _value.isSelected ? _discreet.selected += 1 : null;
                        }
                    }
                    self.discreet[discreetID].visibleIds = unionArray;
                }
            }

            return this;
        };

        Attributes.prototype._intersectVisible = function () {
            var self = this, _range, _discreet,
                intersectArray = [];

            for (var rangeID in self.range) {
                if (self.range.hasOwnProperty(rangeID)) {
                    _range = self.range[rangeID];
                    if (_range.visibleIds.length === 0) {
                        continue;
                    }
                    if (intersectArray.length === 0) {
                        intersectArray = _range.visibleIds;
                    } else {
                        intersectArray = _.intersection(intersectArray, _range.visibleIds);
                    }
                }
            }

            for (var rangeID in self.discreet) {
                if (self.discreet.hasOwnProperty(rangeID)) {
                    _discreet = self.discreet[rangeID];
                    if (_discreet.visibleIds.length === 0) {
                        continue;
                    }
                    if (intersectArray.length === 0) {
                        intersectArray = _discreet.visibleIds;
                    } else {
                        intersectArray = _.intersection(intersectArray, _discreet.visibleIds);
                    }
                }
            }
            return intersectArray;
        };

        return new Attributes();
    }])
    .factory('SavedSearch', ['$_api', '$http', '$q', '$dialog',
    function ($_api, $http, $q, $dialog) {
        var dialog = $dialog.dialog({
            backdrop:true,
            keyboard:true,
            backdropClick:true,
            dialogFade:true,
            backdropFade:true,
            templateUrl:'/app/market/desktop/views/partials/saved-search-dialog.html?' + Date.now(),
            controller:"SaveSearchDialogController"
        });

        var SavedSearch = function (data, id) {
            var self = this;
            this.title = data.title || undefined;
            this.id = id || data.id;
            this.discreet = {};
            this.range = {};

            if (data.discreet) {
                for (var discreetID in data.discreet) {
                    if (data.discreet.hasOwnProperty(discreetID)) {
                        self.discreet[discreetID] = {
                            values:{}
                        };

                        for (var valueID in data.discreet[discreetID].values) {
                            if (data.discreet[discreetID].values.hasOwnProperty(valueID)) {
                                self.discreet[discreetID].values[valueID] = {
                                    isSelected:data.discreet[discreetID].values[valueID].isSelected
                                };
                            }
                        }
                    }
                }
            }

            if (data.range) {
                for (var rangeID in data.range) {
                    if (data.range.hasOwnProperty(rangeID)) {
                        if (data.range.hasOwnProperty(rangeID)) {
                            self.range[rangeID] = {
                                highSelected:data.range[rangeID].highSelected,
                                lowSelected:data.range[rangeID].lowSelected
                            };
                        }
                    }
                }
            }
        };

        SavedSearch.dialog = dialog;

        SavedSearch.query = function () {
            var searches = [];
            $http.get($_api.path + '/search/', $_api.config).then(function (response) {
                angular.forEach(response.data.resources, function (value, key) {
                    try {
                        searches.push(new SavedSearch(angular.fromJson(value.savedSearch), value.id));
                    } catch (e) {
                        console.log(e.message);
                    }
                });
            });
            return searches;
        };

        SavedSearch.prototype.$save = function () {
            var defer = $q.defer(),
                self = this;
            if (self.id) {
                $http.put($_api.path + '/search/' + self.id, JSON.stringify({savedSearch:JSON.stringify(self)}), $_api.config).then(function (response) {
                    defer.resolve(response.data);
                }, function (response) {
                    defer.reject(response.data);
                });
            } else {
                $http.post($_api.path + '/search/', JSON.stringify({savedSearch:JSON.stringify(self)}), $_api.config).then(function (response) {
                    self.id = response.data.id;
                    defer.resolve(response.data);
                }, function (response) {
                    defer.reject(response.data);
                });
            }

            return defer.promise;
        };

        return SavedSearch;
    }])
    .controller('SaveSearchDialogController', ['$scope', 'dialog',
    function ($scope, dialog) {
        $scope.searchSettings = {};
        $scope.close = function () {
            dialog.close();
        };

        $scope.save = function (settings) {
            dialog.close({
                action:'save',
                settings:settings
            });
        };
    }])
    .factory('Comment', ['$_api', '$q', '$http', 'User',
    function ($_api, $q, $http, User) {

        var Comment = function (data, property) {
            data = data || {};
            this.text = data.text || "";
            this.id = data.id || undefined;
            this.propertyId = data.propertyId || undefined;
            this.property = property;
            this.timestamp = data.timestamp || new Date().getTime();
            this.userEmail = data.userEmail || (User.profile ? User.profile.email : "You");
        };

        Comment.query = function (itemID) {
            var config = angular.extend({
                    transformRequest:$_api.loading.none
                }, $_api.config),
                defer = $q.defer();

            if (typeof itemID !== 'undefined') {
                $http.get($_api.path + '/properties/' + itemID + '/comments/', config).then(function (response) {
                    defer.resolve(response.data.items);
                }, function (response) {
                    defer.reject(response);
                });
            } else {
                throw new Error("Comment.query received undefined itemID");
            }

            return defer.promise;
        };

        Comment.prototype.$save = function () {
            var defer = $q.defer(),
                self = this,
                config = angular.extend({
                    transformRequest:function (data) {
                        self.$spinner = true;
                        return data;
                    }
                }, $_api.config),
                propertyId = self.propertyId,
                body = JSON.stringify({
                    text:self.text
                });

            if (typeof propertyId !== 'undefined') {
                $http.post($_api.path + '/properties/' + propertyId + '/comments/', body, config)
                    .then(function (response) {
                        if (self.property) {
                            self.property.hasComments = true;
                        } else {
                            throw new Error('Comment property has not been defined');
                        }
                        self.$spinner = false;
                        defer.resolve(response);
                    }, function (response) {
                        self.$spinner = false;
                        defer.reject(self);
                    });
            } else {
                throw new Error("Comment does not have propertyId");
            }

            return defer.promise;
        };

        return Comment;
    }])
    .factory('Finance', ['$_api', '$q', '$http',
    function ($_api, $q, $http) {

        var Finance = function (data, property) {
            data = data || {};
            this.id = data.id || undefined;
            this.propertyId = data.propertyId || undefined;
            this.property = property;
            this.name = data.name || '';
            this.valueFormat = data.valueFormat || 'currency';
            this.value = data.value ? parseFloat(data.value) : undefined;
        };

        Finance.valueFormats = [
            {icon:'$', valueFormat:'currency', selected:true},
            {icon:'%', valueFormat:'percentage', selected:false},
            {icon:'0.0', valueFormat:'number', selected:false}
        ];

        Finance.fields = [
            "Valuation",
            "IRR",
            "Cap Rate",
            "Price / Unit"
        ];

        Finance.query = function () {
            var config = angular.extend({
                    transformRequest:$_api.loading.none
                }, $_api.config),
                defer = $q.defer(),
                propertyId = self.propertyId;

            if (typeof propertyId !== 'undefined') {
                $http.get($_api.path + '/properties/' + propertyId + '/finances/', config).then(function (response) {
                    defer.resolve(response.data.items);
                }, function (response) {
                    defer.reject(response);
                    //throw new Error("HTTP Error: " + response);
                });
            } else {
                throw new Error("Finance.query received undefined itemID");
            }

            return defer.promise;
        };

        Finance.prototype.$save = function () {
            var defer = $q.defer(),
                self = this,
                config = angular.extend({
                    transformRequest:function (data) {
                        self.$spinner = true;
                        return data;
                    }
                }, $_api.config),
                body = JSON.stringify({
                    name:self.name,
                    value:self.value,
                    valueFormat:self.valueFormat
                }),
                propertyId = self.propertyId;

            if (typeof propertyId !== 'undefined') {
                if (self.id) {
                    $http.put($_api.path + '/properties/' + propertyId + '/finances/' + self.id, body, config)
                        .then(function (response) {
                            if (self.property) {
                                self.property.hasFinances = true;
                            } else {
                                throw new Error('Finance property has not been defined');
                            }
                            self.$spinner = false;
                            defer.resolve(response);
                        }, function (response) {
                            self.$spinner = false;
                            defer.reject(response);
                        });
                } else {
                    $http.post($_api.path + '/properties/' + propertyId + '/finances/', body, config)
                        .then(function (response) {
                            if (self.property) {
                                self.property.hasFinances = true;
                            } else {
                                throw new Error('Finance property has not been defined');
                            }
                            self.$spinner = false;
                            self.id = response.data.id;
                            defer.resolve(response);
                        }, function (response) {
                            self.$spinner = false;
                            defer.reject(response);
                        });
                }
            } else {
                throw new Error("Finance.$save received undefined itemID");
            }

            return defer.promise;
        };

        Finance.prototype.$delete = function () {
            var defer = $q.defer(),
                self = this,
                propertyId = self.propertyId;

            if (typeof propertyId !== 'undefined') {
                $http({
                    method:'DELETE',
                    url:$_api.path + '/properties/' + propertyId + '/finances/' + self.id,
                    headers:{'Content-Type':'application/json'},
                    withCredentials:true,
                    transformRequest:function (data) {
                        self.saving = true;
                        return data;
                    }
                }).then(function (response) {
                        defer.resolve(response);
                    }, function (response) {
                        defer.reject(response);
                    });
            } else {
                throw new Error("Finance.$delete has no propertyId");
            }

            return defer.promise;
        };

        return Finance;
    }])
    .factory('PropertyDetails', ['$dialog', '$q', 'Items', 'BrowserDetect',
    function ($dialog, $q, Items, BrowserDetect) {
        var panes = [
                {heading:"Details", active:true},
                {heading:"Pictures", active:false},
                {heading:"Contact", active:false},
                {heading:"Comments", active:false},
                {heading:"Finances", active:false}
            ],
            view = $dialog.dialog({
                backdrop:false,
                keyboard:false,
                backdropClick:true,
                dialogClass:'property-details ' + BrowserDetect.platform,
                dialogFade:true,
                backdropFade:false,
                templateUrl:'/app/market/' + BrowserDetect.platform + '/views/partials/market-details.html?' + Date.now(),
                controller:"DetailsController",
                resolve:{
                    activeItem:function (Items, $q, $location) {
                        var deferred = $q.defer();

                        var item = Items.getActive() || {};
                        if (!item.hasOwnProperty('details') || _.isEmpty(item.details)) {
                            item.getDetails().then(function (_item) {
                                deferred.resolve(_item);
                            });
                        } else {
                            deferred.resolve(item);
                        }

                        return deferred.promise;
                    }
                }
            });

        return {
            isOpen:function () {
                return view.isOpen();
            },
            open:function (item, resolveCb) {
                if (!item && !view.isOpen()) {
                    Items.setActive(null);
                } else if (!item && view.isOpen()) {
                    view.close();
                } else {
                    Items.setActive(item);
                    view.setConditionalClass(item.getStatusClass());
                    view
                        .open()
                        .then(function () {
                            Items.setActive(null);
                        })
                        .then(resolveCb);
                }

                return this;
            },
            close:function (result) {
                view.close();
                return this;
            },
            panes:panes,
            selectPane:function (paneHeading) {
                paneHeading = (paneHeading && _.find(panes, function (val) {
                    return val.heading.toLowerCase() === paneHeading.toLowerCase();
                })) ? paneHeading : panes[0].heading;

                angular.forEach(panes, function (pane) {
                    if (pane.heading.toLowerCase() === paneHeading.toLowerCase()) {
                        pane.active = true;
                    } else {
                        pane.active = false;
                    }
                });
                return this;
            }
        };
    }])
    .directive('slider', function () {
        return {
            restrict:'A',
            link:function (scope, element, attr) {
                function setupSlider() {
                    element.find('.slider').slider({
                        range:true,
                        min:0,
                        max:100,
                        // Calculate percentages based off what the low selected and high selected are
                        values:[
                            parseInt((((1.0 * (scope.range.lowSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10),
                            parseInt((((1.0 * (scope.range.highSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10)
                        ],
                        step:1,
                        slide:function (event, ui) {
                            scope.$apply(function () {
                                scope.range.lowSelected = parseInt((((ui.values[0] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                                scope.range.highSelected = parseInt((((ui.values[1] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                            });
                        },
                        stop:function (event, ui) {
                            scope.$apply(function () {
                                scope.filter();
                            });
                        }
                    });
                }

                // Watch when the slider low or high selected changes, update slider accordingly.

                scope.$on('rangesDefined', function () {
                    setupSlider();
                });

                setupSlider();
            }
        };
    })
    .directive('imgViewer', ['$window', function ($document) {
    return{
        restrict:'EA',
        transclude:true,
        replace:true,
        templateUrl:'template/img-viewer/img-viewer.html',
        controller:'viewerCtrl',
        scope:{
            images:'='
        },
        link:function (scope, element, attr, viewerCtrl) {
            if (scope.images.length > 0) {
                scope.images[0].isActive = true;
            }
            
            viewerCtrl.setSlides(scope.images);
            viewerCtrl.element = element;

        }
        
                
    }
}])
    .controller('viewerCtrl', ['$scope', '$timeout',
    function ($scope, $timeout) {
        var self = this;
        $scope.current = 0;
        self.setSlides = function (slides) {
            $scope.slides = slides;
        }

        $scope.prev = function () {
            $scope.slides[$scope.current].isActive = false;
            $scope.current = $scope.current == 0 ? $scope.slides.length - 1 : $scope.current -= 1;
            $scope.slides[$scope.current].isActive = true;
        }

        $scope.next = function () {
            $scope.slides[$scope.current].isActive = false;
            $scope.current = $scope.current == $scope.slides.length - 1 ? $scope.current = 0 : $scope.current += 1;
            $scope.slides[$scope.current].isActive = true;
        }
        
        $scope.getClass = function(image){
            var newImg = new Image;
            newImg.src = image.link;
            if(image.isActive){
                return (newImg.width/newImg.height) < (self.element[0].clientWidth/self.element[0].clientHeight) ?  "active-portrait" :  "active-landscape";
            } else {
                return "";
            }
        }

    }])
    .filter('checkBounds', function () {
        return function (input, limit, e) {

            return input == limit ? input + "+" : input;
        }
    });
