'use strict';

angular.module('nebuMarket')
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

                if (data.hasOwnProperty('geo')) {
                    this.location = [];
                    if (data.geo.lat && data.geo.lng) {
                        this.location = [data.geo.lat, data.geo.lng];
                    } else {
                        this.location = undefined;
                    }
                } else {
                    this.location = undefined;
                }

                this.title = data.title || "Title not listed";
                this.flyer = data.flyer || "";
                this.description = data.description || "No description provided";
                this.address = data.address || {
                    street1: "No address listed"
                };
                this.thumbnail = data.thumbnail || "/img/apt0.jpg";
                this.favorites = data.favorites || false;
                this.hidden = data.hidden || false;
                this.hasComments = data.hasComments || false;
                this.isVisible = true;

                // Populate Attributes id stacks during construction of each item object
                this.mapAttributes(Attributes.active);
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

            Item.prototype.mapAttributes = function (attributes) {
                for (var attrID in this.attributes.discreet) {
                    if (this.attributes.discreet.hasOwnProperty(attrID)) {
                        attributes.pushDiscreetID(attrID, this.id, this.attributes.discreet[attrID]);
                    }
                }
                for (var attrID in this.attributes.range) {
                    if (this.attributes.range.hasOwnProperty(attrID)) {
                        attributes.pushRangeID(attrID, this.id, this.attributes.range[attrID]);
                    }
                }
            };

            Item.prototype.getDetails = function () {
                var self = this,
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: $_api.loading.details
                    }, $_api.config),
                    locals = {};

                $http.get($_api.path + '/properties/' + this.id, config).then(function (response) {
                    self.details = {};
                    angular.copy(response.data, self.details);
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
                            for (var i = 0, len = self.details.finances.length; i < len; i++) {
                                self.details.finances[i] = new Finance(self.details.finances[i]);
                            }
                        } else {
                            throw new Error("Finances are not an array");
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            };

            Item.prototype.addComment = function (comment) {
                var newComment = new Comment(comment);

                newComment.propertyId = newComment.propertyId || this.id;

                if (angular.isArray(this.details.comments)) {
                    this.details.comments.push(newComment);
                    this.hasComments = true;
                } else {
                    this.details.comments = [newComment];
                }

                return newComment;
            };

            Item.prototype.addFinance = function (finance) {
                var newFinance = new Finance(finance);

                newFinance.propertyId = newFinance.propertyId || this.id;

                if (angular.isArray(this.details.finances)) {
                    this.details.finances.push(newFinance);
                } else {
                    this.details.finances = [newFinance];
                }

                return newFinance;
            };

            Item.prototype.deleteFinance = function (finance) {

                this.details.finances = _.reject(this.details.finances, function (value) {
                    return angular.equals(value, finance);
                });

                return finance;
            };

            Item.prototype.toggleFavorites = function () {
                var defer = $q.defer(),
                    self = this,
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify({value: (!self.favorites).toString()});

                $http.post($_api.path + '/properties/' + this.id + '/favorites/', body, config).then(
                    function (response) {
                        if (response.data.status === "success") {
                            self.favorites = !self.favorites;
                            defer.resolve(response);
                        } else {
                            defer.reject(response);
                        }
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );
            };

            Item.prototype.toggleHidden = function () {
                var defer = $q.defer(),
                    self = this,
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify({value: (!self.hidden).toString()});

                $http.post($_api.path + '/properties/' + this.id + '/hidden/', body, config).then(
                    function (response) {
                        if (response.data.status === "success") {
                            self.hidden = !self.hidden;
                            defer.resolve(response);
                        } else {
                            defer.reject(response);
                        }
                    },
                    function (response) {
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

            Item.prototype.getAddress = function() {
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
    .factory('Filter', ['Attributes',
        function (Attributes) {
            var visibleIds = [],
                filters = {};

            // Populates an id stack for each attribute criteria
            function filterAttributes(attributes, badgeFlag) {
                var intersectArray = [],
                    unionArray = [];

                // Make sure not being computed for badge
                if (!badgeFlag) {
                    filters = {};
                    // For each range attribute, determine the ids that fall within the highSelected and lowSelected
                    for (var rangeID in attributes.range) {
                        if (attributes.range.hasOwnProperty(rangeID)) {
                            filters[rangeID] = getIdsWithinRange(attributes.range[rangeID]);
                        }
                    }
                }

                // For each discreet attribute, concat together ids (assumes items can only contain 1 discreet attribute)
                for (var discreetID in attributes.discreet) {
                    if (attributes.discreet.hasOwnProperty(discreetID)) {
                        unionArray = [];
                        for (var attrID in attributes.discreet[discreetID].values) {
                            if (attributes.discreet[discreetID].values.hasOwnProperty(attrID)) {
                                var value = attributes.discreet[discreetID].values[attrID];
                                if (value.isSelected || value.compare) {
                                    unionArray = unionArray.concat(value.ids);
                                }
                            }
                        }
                        filters[discreetID] = unionArray;
                    }
                }

                // Loop through filters and intersect
                for (var id in filters) {
                    if (filters.hasOwnProperty(id)) {
                        if (filters[id].length === 0) {
                            continue;
                        }
                        if (intersectArray.length === 0) {
                            intersectArray = filters[id];
                        } else {
                            intersectArray = _.intersection(intersectArray, filters[id]);
                        }
                    }
                }

                return intersectArray;
            }

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

            return {
                getVisibleIds: function () {
                    return visibleIds;
                },
                filter: function () {
                    visibleIds = filterAttributes(Attributes.active);
                    return visibleIds;
                },
                addedLength: function (value) {
                    // Flag attribute for compare to see what amounts would be if value were selected
                    value.compare = true;
                    // Run filter
                    var comp = filterAttributes(Attributes.active, "badge");
                    // Turn off flag
                    delete value.compare;

                    // Return difference
                    return comp.length - visibleIds.length;
                }
            };
        }])
    .service('Items', ['Attributes', 'Item', 'Filter',
        function (Attributes, Item, Filter) {
            // Private items data
            this.items = {};

            this.active = null;

            this.getItems = function () {
                return _.map(this.items, function (item, id) {
                    return item;
                });
            };

            this.showHidden = function () {
                var visibleIds = Filter.getVisibleIds();
                for (var i = 0, len = visibleIds.length; i < len; i++) {
                    if (this.items.hasOwnProperty(visibleIds[i])) {
                        this.items[visibleIds[i]].isVisible = this.items[visibleIds[i]].hidden;
                    }
                }
            };

            this.showFavorites = function () {
                var visibleIds = Filter.getVisibleIds();
                for (var i = 0, len = visibleIds.length; i < len; i++) {
                    if (this.items.hasOwnProperty(visibleIds[i])) {
                        this.items[visibleIds[i]].isVisible = this.items[visibleIds[i]].favorites;
                    }
                }
            };

            this.showNotes = function () {
                var visibleIds = Filter.getVisibleIds();
                for (var i = 0, len = visibleIds.length; i < len; i++) {
                    if (this.items.hasOwnProperty(visibleIds[i])) {
                        this.items[visibleIds[i]].isVisible = this.items[visibleIds[i]].hasComments;
                    }
                }
            };

            this.createItems = function (products) {
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
                Attributes.active.setSelectedBounds();
                Attributes.active.sort();
                return _.map(this.items, function (item, id) {
                    return item;
                });
            };

            this.loadItems = function () {
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].mapAttributes(Attributes.active);
                    }
                }
                Attributes.active.setSelectedBounds();
                Attributes.active.sort();
            };

            this.updateVisible = function (visibleIds) {
                // Loop through each item
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].isVisible = (_.contains(visibleIds, this.items[id].id) && !this.items[id].hidden);
                    }
                }
            };
        }])
    .service('Attributes', function () {
        // Attributes Constructor
        function Attributes() {
            var defaults = {
                title: "",
                discreet: {},
                range: {}
            };
            // The essentials
            angular.extend(this, defaults);
        }

        Attributes.prototype.pushDiscreetID = function (attrID, itemID, value) {
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

        Attributes.prototype.pushRangeID = function (attrID, itemID, value) {
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

        Attributes.prototype.setSelectedBounds = function () {
            if (this.range !== {}) {
                _.each(this.range, function (r) {
                    r.highSelected = r.highSelected || r.high;
                    r.lowSelected = r.lowSelected || r.low;
                });
            }
        };

        Attributes.prototype.sort = function () {
            var attrID;
            for (attrID in this.range) {
                if (this.range.hasOwnProperty(attrID)) {
                    this.range[attrID].ids = _.sortBy(this.range[attrID].ids, function (i) {
                        return i.value;
                    });
                }
            }
        };

        Attributes.prototype.reset = function () {
            this.title = "";
            this.id = undefined;
            this.discreet = {};
            this.range = {};
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
                            // Then check if the selected on the save is still within bounds
                            if (search.range[rangeID].lowSelected >= self.range[rangeID].low && search.range[rangeID].highSelected <= self.range[rangeID].high) {
                                self.range[rangeID].lowSelected = search.range[rangeID].lowSelected;
                                self.range[rangeID].highSelected = search.range[rangeID].highSelected;
                            } else {
                                throw new Error(search.range[rangeID].lowSelected + " - " + search.range[rangeID].highSelected + " is not within active bounds");
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
                                    if (search.discreet[discreetID].values[attrID].isSelected === true || search.discreet[discreetID].values[attrID].isSelected === "True") {
                                        self.discreet[discreetID].values[attrID].isSelected = true;
                                        self.discreet[discreetID].selected++;
                                    }
                                } else {
                                    throw new Error(attrID + " not found in " + discreetID);
                                }
                            }
                        } else {
                            throw new Error(discreetID + " not found in discreet");
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                }
            }
        };

        this.active = new Attributes();

        this.initialize = function () {
            angular.copy(new Attributes(), this.active);
        };
    })
    .factory('SavedSearch', ['$_api', '$http', '$q',
        function ($_api, $http, $q) {
            var SavedSearch = function (data, id) {
                var self = this;
                this.title = data.title || undefined;
                this.id = id || undefined;
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
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                }

                return defer.promise;
            };

            return SavedSearch;
        }])
    .factory('Comment', ['$_api', '$q', '$http', 'User',
        function ($_api, $q, $http, User) {

            var Comment = function (data) {
                data = data || {};
                this.text = data.text || "";
                this.id = data.id || undefined;
                this.propertyId = data.propertyId || undefined;
                this.timestamp = data.timestamp || new Date().getTime();
                this.userEmail = data.userEmail || (User.profile ? User.profile.email : "You");
                console.log(User);
                console.log(this);
            };

            Comment.query = function (itemID) {
                var config = angular.extend({
                        transformRequest: angular.isFunction(transformFn) ? transformFn : $_api.loading.none
                    }, $_api.config),
                    defer = $q.defer();

                if (typeof itemID !== 'undefined') {
                    $http.get($_api.path + '/properties/' + itemID + '/comments/', config).then(function (response) {
                        defer.resolve(response.data.items);
                    }, function (response) {
                        defer.reject(response);
                        //throw new Error("HTTP Error: " + response);
                    });
                } else {
                    throw new Error("Comment.query received undefined itemID");
                }

                return defer.promise;
            };

            Comment.prototype.$save = function (transformFn) {
                var defer = $q.defer(),
                    self = this,
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    propertyId = self.propertyId;

                if (typeof propertyId !== 'undefined') {
                    $http.post($_api.path + '/properties/' + propertyId + '/comments/', JSON.stringify(self), config)
                        .then(function (response) {
                            defer.resolve(response);
                        }, function (response) {
                            defer.reject(response);
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

            var Finance = function (data) {
                data = data || {};
                console.log(data);
                this.id = data.id || undefined;
                this.propertyId = data.propertyId || undefined;
                this.name = data.name || '';
                this.valueFormat = data.valueFormat || 'currency';
                if (angular.isDefined(data.value) && angular.isNumber(parseFloat(data.value))) {
                    this.value = data.value;
                } else {
                    this.value = undefined;
                }
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

            Finance.prototype.$save = function (transformFn) {
                var defer = $q.defer(),
                    self = this,
                    config = angular.extend({
                        transformRequest: angular.isFunction(transformFn) ? transformFn : $_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify(self),
                    propertyId = self.propertyId;

                console.log("Saving:", self);
                if (typeof propertyId !== 'undefined') {
                    if (self.id) {
                        $http.put($_api.path + '/properties/' + propertyId + '/finances/' + self.id, body, config)
                            .then(function (response) {
                                console.log(response);
                                defer.resolve(response);
                            }, function (response) {
                                defer.reject(response);
                            });
                    } else {
                        console.log("POSTING:",body);
                        $http.post($_api.path + '/properties/' + propertyId + '/finances/', body, config)
                            .then(function (response) {
                                console.log(response);
                                self.id = response.data.id;
                                defer.resolve(response);
                            }, function (response) {
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
                        withCredentials: true
                    }).then(function (response) {
                            console.log("delete success", response);

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
    .factory('PropertyDetails', ['Finance', 'Comment', 'Panes',
        function (Finance, Comment, Panes) {
            var panes = [
                {heading: "Details", active: true},
                {heading: "Pictures", active: false},
                {heading: "Contact", active: false},
                {heading: "Comments", active: false},
                {heading: "Finances", active: false}
            ];

            return {
                Finance: Finance,
                Comment: Comment,
                panes: new Panes(panes)
            };
        }])
    .factory('Panes', function () {
        var Panes = function (data) {
            var self = this;
            data = data || {};
            this.panes = [];

            angular.forEach(data, function (value, key) {
                if (value.heading) {
                    self.panes.push({
                        heading: value.heading,
                        active: value.active || false
                    });
                }
            });
        };

        Panes.prototype.selectPane = function (paneHeading) {
            angular.forEach(this.panes, function (pane) {
                if (pane.heading === paneHeading) {
                    pane.active = true;
                } else {
                    pane.active = false;
                }
            });
        };

        return Panes;
    });



