/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:04 PM
 * File: /core/market/market.js
 */

'use strict';

angular.module('rescour.market', [])
    .factory('Item', ['$_api', '$q', '$http', 'Attributes', 'Comment', 'Finance',
        function ($_api, $q, $http, Attributes, Comment, Finance) {

            // Item constructor
            var Item = function (data) {
                if (data.hasOwnProperty('id')) {
                    this.id = data.id;
                } else {
                    throw new Error("Cannot find id in " + data);
                }

                // Check to see if object contained attributes variable
                if (data.hasOwnProperty('attributes')) {
                    // Initialize this item's attributes
                    this.attributes = {
                        discreet: {},
                        range: {}
                    };

                    // Check and initialize discreet and range of data's attributes incase they do not exist
                    data.attributes.discreet = data.attributes.discreet || {};
                    data.attributes.range = data.attributes.range || {};

                    // Loop through API shim's attributes definition
                    for (var discrID in $_api.map.attributes.discreet) {
                        // Check to see if data has attribute defined in shim
                        if (data.attributes.discreet[discrID]) {
                            // Map attribute with correct name
                            this.attributes.discreet[$_api.map.attributes.discreet[discrID]] = data.attributes.discreet[discrID];
                        } else {
                            // Otherwise set to Not Listed
                            this.attributes.discreet[$_api.map.attributes.discreet[discrID]] = "Unknown";
                        }
                    }

                    for (var rangeID in $_api.map.attributes.range) {
                        // Check to see if data has attribute, undefined ranged values will come in as ''
                        if (data.attributes.range[rangeID] === '' || !data.attributes.range.hasOwnProperty(rangeID)) {
                            // Set to NA so filter knows to ignore
                            this.attributes.range[$_api.map.attributes.range[rangeID]] = "NA";
                        } else {
                            // Map attribute with correct name
                            this.attributes.range[$_api.map.attributes.range[rangeID]] = data.attributes.range[rangeID];
                        }
                    }
                } else {
                    // If data did not have attributes, log error
                    throw new Error("Cannot find attributes in Item {id: " + data.id + "}");
                }

                this.title = data.title || "Title not listed";
                this.flyer = data.flyer || "";
                this.description = data.description || "No description provided";
                this.address = data.address || {
                    street1: "No address listed"
                };
                this.location = (data.address.latitude && data.address.longitude) ? [data.address.latitude, data.address.longitude] : undefined;
                this.thumbnail = data.thumbnail || "/img/apt0.jpg";
                this.favorites = data.favorites || false;
                this.hidden = data.hidden || false;
                this.hasComments = data.hasComments || false;
                this.hasFinances = data.hasFinances || false;
                this.isVisible = true;

                // Populate Attributes id stacks during construction of each item object
                this._mapAttributes(Attributes);
            };

            Item.query = function () {
                var defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: $_api.loading.main
                    }, $_api.config);

                $http.get($_api.path + '/properties/', config).then(function (response) {
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            };

            Item.prototype._mapAttributes = function (attributes) {
                for (var attrID in this.attributes.discreet) {
                    if (this.attributes.discreet.hasOwnProperty(attrID)) {
                        attributes.pushDiscreetId(attrID, this.id, this.attributes.discreet[attrID]);
                    }
                }
                for (var attrID in this.attributes.range) {
                    if (this.attributes.range.hasOwnProperty(attrID)) {
                        attributes.pushRangeId(attrID, this.id, this.attributes.range[attrID]);
                    }
                }
            };

            Item.prototype.getDetails = function () {
                var self = this,
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            self.details.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    locals = {
                        defaultFinances: [
                            {
                                name: 'Valuation',
                                valueFormat: 'currency'
                            },
                            {
                                name: 'Cap Rate',
                                valueFormat: 'percentage'},
                            {
                                name: 'IRR',
                                valueFormat: 'percentage'
                            },
                            {
                                name: 'Price / Unit',
                                valueFormat: 'currency'
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
                        transformRequest: function (data) {
                            self.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({value: (!self.favorites).toString()});

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
                        transformRequest: function (data) {
                            self.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({value: (!self.hidden).toString()});

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

            Item.prototype.refreshComments = function () {
                var self = this;

                Comment.query(self.id).then(function (response) {
                    angular.forEach(response, function (value, key) {
                        if (!_.contains(_.pluck(self.details.notes.comments, 'comment_id'), value.comment_id)) {
                            self.details.notes.comments.push(value);
                        }
                    });

                    for (var key in self.details.notes.comments) {
                        if (self.details.notes.comments.hasOwnProperty(key)) {
                            if (!_.contains(_.pluck(response, 'comment_id'), self.details.notes.comments[key].comment_id)) {
                                delete self.details.notes.comments[key];
                            }
                        }
                    }
                }, function (response) {
                    throw new Error("Could not refresh comments, response: " + response);
                });
            };

            Item.prototype.getAttribute = function (name) {
                if (this.attributes.discreet.hasOwnProperty(name)) {
                    return this.attributes.discreet[name];
                } else if (this.attributes.range.hasOwnProperty(name)) {
                    return this.attributes.range[name];
                } else {
                    return "Not Found";
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
                return _.map(this.items, function (item, id) {
                    return item;
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

                if (!subset) {
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
    .factory('Attributes', ['$timeout',
        function ($timeout) {
            // Gets the ids of the items on the edges of the high and low values for a single slider
            function getIdsWithinRange(range) {

                var endpointArray = [];

                // Iterate from bottom to find low bound on sorted id array
                for (var j = 0; j < range.ids.length; j++) {
                    if (range.ids[j].value >= range.lowSelected) {
                        endpointArray.push(j);
                        break;
                    }
                }

                // Iterate from top to find high bound on sorted id array
                for (var i = range.ids.length - 1; i > 0; i--) {
                    if (range.ids[i].value <= range.highSelected) {
                        endpointArray.push(i);
                        break;
                    }
                }

                endpointArray[1] = endpointArray[1] || endpointArray[0];

                // Remove ids from id, value objects
                return _.union(
                    range.na, // concat
                    _.map(range.ids.slice(endpointArray[0], endpointArray[1] + 1),
                        function (idPair) {
                            return idPair.id;
                        })
                );
            }

            // Attributes Constructor
            function Attributes() {
                var defaults = {
                    title: "",
                    discreet: {},
                    range: {},
                    visibleIds: []
                };
                // The essentials
                angular.extend(this, defaults);
            }

            Attributes.prototype.pushDiscreetId = function (attrID, itemID, value) {
                // If attribute doesn't exist, initialize attribute, then push
                if (!_.has(this.discreet, attrID)) {
                    // Initialize discreet category
                    this.discreet[attrID] = {
                        title: attrID,
                        values: {},
                        selected: 0
                    };

                    // This implies no items have come before, so add the first id
                    this.discreet[attrID].values[value] = {
                        ids: [itemID],
                        title: value,
                        isSelected: false
                    };
                    // If attribute has been loaded, but particular value doesn't exist yet, initialize
                } else if (!_.has(this.discreet[attrID].values, value)) {
                    // Add first ID
                    this.discreet[attrID].values[value] = {
                        ids: [itemID],
                        title: value,
                        isSelected: false
                    };
                    // If value is found then just push
                } else {
                    this.discreet[attrID].values[value].ids.push(itemID);
                }
            };

            Attributes.prototype.pushRangeId = function (attrID, itemID, value) {
                // Check to see if rangeID exists on itself
                if (!this.range.hasOwnProperty(attrID)) {
                    this.range[attrID] = {
                        title: attrID,
                        ids: [],
                        na: [],
                        high: null,
                        low: null
                    }
                }
                if (value === "NA") {
                    this.range[attrID].na.push(itemID);
                }
                else if (_.isNaN(parseInt(value, 10))) {
                    this.range[attrID].na.push(itemID);
                    throw new Error("Cannot push {" + attrID + ": " + value + "} onto Item {id: " + itemID + "}");
                } else {
                    var intVal = parseInt(value, 10);
                    this.range[attrID].ids.push({id: itemID, value: intVal});

                    // Check to see if current value is the low bound value
                    if (this.range[attrID].low === null || intVal <= this.range[attrID].low) {
                        this.range[attrID].low = intVal;
                    }

                    // Check to see if the current value is the high bound value
                    if (this.range[attrID].high === null || intVal >= this.range[attrID].high) {
                        this.range[attrID].high = intVal;
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
                        self.range[rangeID].visibleIds = getIdsWithinRange(self.range[rangeID]);
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
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/desktop/views/partials/saved-search-dialog.html',
                controller: "SaveSearchDialogController"
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
                                values: {}
                            };

                            for (var valueID in data.discreet[discreetID].values) {
                                if (data.discreet[discreetID].values.hasOwnProperty(valueID)) {
                                    self.discreet[discreetID].values[valueID] = {
                                        isSelected: data.discreet[discreetID].values[valueID].isSelected
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
                                    highSelected: data.range[rangeID].highSelected,
                                    lowSelected: data.range[rangeID].lowSelected
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
                    $http.put($_api.path + '/search/' + self.id, JSON.stringify({savedSearch: JSON.stringify(self)}), $_api.config).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                } else {
                    $http.post($_api.path + '/search/', JSON.stringify({savedSearch: JSON.stringify(self)}), $_api.config).then(function (response) {
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
                    action: 'save',
                    settings: settings
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
                        transformRequest: $_api.loading.none
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
                        transformRequest: function (data) {
                            self.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    propertyId = self.propertyId,
                    body = JSON.stringify({
                        text: self.text
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
                {icon: '$', valueFormat: 'currency', selected: true},
                {icon: '%', valueFormat: 'percentage', selected: false},
                {icon: '0.0', valueFormat: 'number', selected: false}
            ];

            Finance.fields = [
                "Valuation",
                "IRR",
                "Cap Rate",
                "Price / Unit"
            ];

            Finance.query = function () {
                var config = angular.extend({
                        transformRequest: $_api.loading.none
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
                        transformRequest: function (data) {
                            self.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({
                        name: self.name,
                        value: self.value,
                        valueFormat: self.valueFormat
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
                        method: 'DELETE',
                        url: $_api.path + '/properties/' + propertyId + '/finances/' + self.id,
                        headers: {'Content-Type': 'application/json'},
                        withCredentials: true,
                        transformRequest: function (data) {
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
    .factory('PropertyDetails', ['$dialog', '$q', 'Items', '$location',
        function ($dialog, $q, Items, $location) {
            var panes = [
                    {heading: "Details", active: true},
                    {heading: "Pictures", active: false},
                    {heading: "Contact", active: false},
                    {heading: "Comments", active: false},
                    {heading: "Finances", active: false}
                ],
                view = $dialog.dialog({
                    backdrop: false,
                    keyboard: false,
                    backdropClick: true,
                    dialogClass: 'property-details',
                    dialogFade: true,
                    backdropFade: false,
                    templateUrl: '/app/market/desktop/views/partials/market-details.html',
                    controller: "DetailsController",
                    resolve: {
                        activeItem: function (Items, $q, $location) {
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
                isOpen: function () {
                    return view.isOpen();
                },
                open: function (item, resolveCb) {
                    if (!item && !view.isOpen()) {
                        Items.setActive(null);
                    } else if (!item && view.isOpen()) {
                        console.log("closing here");
                        view.close();
                    } else {
                        Items.setActive(item);
                        view
                            .open()
                            .then(function () {
                                Items.setActive(null);
                            })
                            .then(resolveCb);
                    }

                    return this;
                },
                close: function (result) {
                    view.close();
                    return this;
                },
                panes: panes,
                selectPane: function (paneHeading) {
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
            restrict: 'A',
            link: function (scope, element, attr) {
                function setupSlider() {
                    element.find('.slider').slider({
                        range: true,
                        min: 0,
                        max: 100,
                        // Calculate percentages based off what the low selected and high selected are
                        values: [
                            parseInt((((1.0 * (scope.range.lowSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10),
                            parseInt((((1.0 * (scope.range.highSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10)
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
    });
