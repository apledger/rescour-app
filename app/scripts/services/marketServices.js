'use strict';

angular.module('nebuMarket')
    .factory('Item', ['$_api', '$q', '$http', 'Attributes', 'Comment',
        function ($_api, $q, $http, Attributes, Comment) {

            // Item constructor
            var Item = function (data) {

                //angular.extend(this, data);
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
                            this.attributes.discreet[$_api.map.attributes.discreet[discrID]] = "Not Listed";
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

                if (data.hasOwnProperty('location')) {
                    this.location = data.location;
                } else {
                    throw new Error("Cannot find location in " + "Item {id: " + data.id + "}");
                }

                this.title = data.title || "Title not listed";
                this.description = data.description || "No description provided.";
                this.thumbnail = data.thumbnail || "apt0.jpg";
                this.favorites = data.favorites || false;
                this.hidden = data.hidden || false;
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
                    }, $_api.config);

                $http.get($_api.path + '/properties/' + this.id, config).then(function (response) {
                    self.details = {};
                    angular.copy(response.data, self.details);
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            };

            Item.prototype.addComment = function (commentText) {
                var _comment = new Comment(commentText),
                    defer = $q.defer(),
                    self = this;

                _comment.$save(this.id).then(function (response) {
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
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
    .service('Items', ['Attributes', 'Item',
        function (Attributes, Item) {
            // Private items data
            this.items = {};

            this.getItems = function () {
                return _.map(this.items, function (item, id) {
                    return item;
                });
            };

            this.showHidden = function () {
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].isVisible = this.items[id].hidden;
                    }
                }
            };

            this.showFavorites = function () {
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].isVisible = this.items[id].favorites;
                    }
                }
            };

            this.showNotes = function () {
                for (var id in this.items) {
                    if (this.items.hasOwnProperty(id)) {
                        this.items[id].isVisible = this.items[id].details ? (this.items[id].details.notes.comments.length > 0) : false;
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
            for (var discreetID in this.discreet) {
                this.discreet[discreetID].selected = 0;
                // If "Region" or whatever discreet ID exists, copy selected
                for (var attrID in this.discreet[discreetID].values) {
                    this.discreet[discreetID].values[attrID].isSelected = false;
                    // If the saved search attribute exists
                }
            }
        };

        this.active = new Attributes();

        this.initialize = function () {
            angular.copy(new Attributes(), this.active);
        };

        this.load = function (attr) {
            if (!attr) {
                this.initialize();
            } else {
                // reset the saved
                var self = this;
                this.active.reset();
                this.active.id = attr.id;
                this.active.title = attr.title;
                // error handling here
                for (var rangeID in attr.range) {
                    // Check if range attribute exists
                    if (_.has(self.active.range, rangeID)) {
                        self.active.range[rangeID].ids = [];
                        self.active.range[rangeID].na = [];
                        // Then check if the selected on the save is still within bounds
                        if (attr.range[rangeID].lowSelected >= self.active.range[rangeID].low && attr.range[rangeID].highSelected <= self.active.range[rangeID].high) {
                            self.active.range[rangeID].lowSelected = attr.range[rangeID].lowSelected;
                            self.active.range[rangeID].highSelected = attr.range[rangeID].highSelected;
                        }
                    }
                }

                for (var discreetID in attr.discreet) {
                    // If "Region" or whatever discreet ID exists, copy selected
                    if (_.has(self.active.discreet, discreetID)) {
                        for (var attrID in attr.discreet[discreetID].values) {
                            // If the saved search attribute exists
                            if (_.has(self.active.discreet[discreetID].values, attrID)) {
                                attr.discreet[discreetID].values[attrID].ids = [];
                                if (attr.discreet[discreetID].values[attrID].isSelected === true || attr.discreet[discreetID].values[attrID].isSelected === "True") {
                                    self.active.discreet[discreetID].values[attrID].isSelected = true;
                                    self.active.discreet[discreetID].selected++;
                                }
                            }
                        }
                    }
                }
            }
        };
    })
    .factory('Templates',
    function () {
        return {
            newSearch: '/template/newSearch.html'
        };
    })
    .factory('SavedSearch', ['$_api', '$http', '$q',
        function ($_api, $http, $q) {
            var SavedSearch = function (data) {
                angular.extend(this, data);
            };

            SavedSearch.query = function () {
                var searches = [];
                $http.get($_api.path + '/search/', $_api.config).then(function (response) {
                    angular.copy(response.data.resources, searches);
                });
                return searches;
            };

            SavedSearch.prototype.$save = function () {
                var defer = $q.defer(),
                    self = this;

                if (self.id) {
                    $http.put($_api.path + '/search/' + self.id, JSON.stringify({saved_search: self}), $_api.config).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                } else {
                    $http.post($_api.path + '/search/', JSON.stringify({saved_search: self}), $_api.config).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                }

                return defer.promise;
            };

            return SavedSearch;
        }])
    .factory('Comment', ['$_api', '$q', '$http',
        function ($_api, $q, $http) {

            var Comment = function (data) {
                this.message = data || "";
                this.timestamp = new Date().getTime();
            };

            Comment.query = function (itemID) {
                var config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    _comments = [],
                    defer = $q.defer();

                if (typeof itemID !== 'undefined') {
                    $http.get($_api.path + '/properties/' + itemID + '/notes/comments/', config).then(function (response) {
                        angular.copy(response.data.notes.comments, _comments);
                        defer.resolve(response.data.notes.comments);
                    }, function (response) {
                        defer.reject(response);
                        //throw new Error("HTTP Error: " + response);
                    });
                } else {
                    throw new Error("Comment.query received undefined itemID");
                }

                return defer.promise;
            };

            Comment.prototype.$save = function (itemID) {
                var defer = $q.defer(),
                    self = this,
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config);

                if (typeof itemID !== 'undefined') {
                    $http.post($_api.path + '/properties/' + itemID + '/notes/comments/', JSON.stringify(self), config)
                        .then(function (response) {
                            defer.resolve(response);
                        }, function (response) {
                            defer.reject(response);
                        });
                } else {
                    throw new Error("comment.$save received undefined itemID");
                }

                return defer.promise;
            };

            return Comment;
        }]);



