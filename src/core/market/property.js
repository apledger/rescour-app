/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:04 PM
 * File: /core/market/market.js
 */

'use strict';

angular.module('rescour.property', [])
    .factory('PropertyMarket', ['Property',
        function (Property) {
            return new thotpod.Marketplace(Property, {
                sortBy: {
                    predicate: 'datePosted',
                    reverse: false
                }
            });
        }])
    .factory('Property', ['$_api', '$q', '$http', 'Comment', 'Finance', 'Favorite', 'Hidden', '$exceptionHandler', 'ngProgress',
        function ($_api, $q, $http, Comment, Finance, Favorite, Hidden, $exceptionHandler, ngProgress) {

            // Item constructor
            var Property = function (data) {
                if (data.hasOwnProperty('id')) {
                    this.id = data.id;
                } else {
                    throw new Error("Cannot find id in " + data);
                }
                var defaults = {
                        address: {
                            street1: 'No address listed'
                        },
                        isVisible: true
                    },
                    opts = angular.extend({}, defaults, data),
                    self = this;

                angular.copy(opts, this);
                this.title = this.title || 'Untitled Property';
                this.description = this.description || 'No description provided.';
                this.thumbnail = this.thumbnail || '/img/apt0.jpg';
                this.state = this.address.state;
                this.location = (data.address.latitude && data.address.longitude) ? [data.address.latitude, data.address.longitude] : null;
                this.latitude = parseFloat(data.address.latitude) || 'NA';
                this.longitude = parseFloat(data.address.longitude) || 'NA';
                this.yearBuilt = parseInt(this.yearBuilt, 10) || 'NA';
                this.numUnits = parseInt(this.numUnits, 10) || 'NA';
                this.daysOnMarket = Math.ceil(Math.abs(Date.now() - (this.id * 1000)) / (1000 * 3600 * 24));
                this.resources = {};
                this.favorites = false;
                this.hidden = false;
//                angular.forEach(this.attributes.discreet, function (value, key) {
//                    if (!value) {
//                        self.attributes.discreet[key] = 'Unknown'
//                    }
//                });
//
//                angular.forEach(this.attributes.range, function (value, key) {
//                    if (_.isNaN(parseInt(value, 10)) || !value) {
//                        self.attributes.range[key] = 'NA'
//                    } else {
//                        self.attributes.range[key] = parseInt(self.attributes.range[key], 10);
//                    }
//                });
//                this.attributes.range.latitude = data.address.latitude || 'NA';
//                this.attributes.range.longitude = data.address.longitude || 'NA';
//                this.notes = this.hasComments || this.hasFinances;
            };

            Property.$dimensions = {
                discreet: {
                    'broker': {
                        title: 'Broker',
                        weight: 10
                    },
                    'state': {
                        title: 'State',
                        weight: 9
                    },
                    'propertyStatus': {
                        title: 'Property Status',
                        weight: 8
                    },
                    'propertyType': {
                        title: 'Property Type',
                        weight: 7
                    }
                },
                range: {
                    'numUnits': {
                        title: 'Number of Units',
                        highBound: 500,
                        weight: 10
                    },
                    'yearBuilt': {
                        title: 'Year Built',
                        weight: 9
                    },
//                    'daysOnMarket': {
//                        title: 'Days on Market',
//                        weight: 8
//                    },
                    'latitude': {
                        title: 'Latitude',
                        weight: 9,
                        hidden: true
                    },
                    'longitude': {
                        title: 'Longitude',
                        weight: 9,
                        hidden: true
                    }
                }
            };

            Property.getResources = function (properties) {
                var defer = $q.defer(),
                    resourceMap = {
                        hidden: Hidden,
                        favorites: Favorite,
                        comments: Comment,
                        finances: Finance
                    };

                $q.all([
                        Hidden.query(),
                        Favorite.query(),
                        Comment.query(),
                        Finance.query()
                    ])
                    .then(function (results) {
                        // Because q.all doesn't support hashes in 1.0.8 we must assume order

                        console.log(results);
                        angular.forEach(_.keys(resourceMap), function (resourceKey, resourceIndex) {
                            angular.forEach(results[resourceIndex], function (resource) {
                                try {
                                    var propertyId = resource.propertyId,
                                        resourceId = resource.id,
                                        resourceModel = resourceMap[resourceKey];

                                    if (properties[propertyId]) {
                                        var property = properties[propertyId],
                                            propertyResources = property.resources[resourceKey] = property.resources[resourceKey] || [];

                                        propertyResources.push(new resourceModel(resource));

                                        if (resourceKey === 'comments' || resourceKey === 'finances') {
                                            property.notes = true;
                                        } else {
                                            property[resourceKey] = true;
                                        }
                                    } else {
                                        throw new Error("Cannot add " + resourceKey + " to Property ID: " + propertyId + ", does not exist")
                                    }

                                } catch (e) {
                                    $exceptionHandler(e);
                                }
                            });
                        });

                        defer.resolve(properties);
                    });

                return defer.promise;
            }

            Property.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 50;

                (function batchItems(limit, offset) {
                    var path = $_api.path + '/properties/' + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 1);

                        if (response.data.length < limit || response.data.length === 0) {
                            defer.resolve(items);
                        } else {
                            batchItems(limit, response.data[response.data.length - 1].id);
                        }
                    }, function (response) {
                        defer.reject(response);
                    });

                })(batchLimit);

                return defer.promise;
            };

            Property.prototype.getDetails = function () {
                var self = this,
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            self.details.$spinner = true;
                            return data;
                        }
                    }, $_api.config),
                    locals = {};

                locals.defaultFinances = angular.extend([], Finance.defaults);

                self.details = self.details || {};

                $http.get($_api.path + '/properties/' + this.id, config).then(function (response) {
//                    locals.comments = response.data.comments;
//                    locals.finances = response.data.finances;
//                    self.details = angular.extend({}, response.data);

                    self.details.$spinner = false;
                    try {
//                        // Initialize Comments
//                        if (angular.isArray(locals.comments)) {
//                            self.details.comments = [];
//                            for (var i = 0; i < locals.comments.length; i++) {
//                                self.addComment(locals.comments[i]);
//                            }
//                        } else {
//                            throw new Error("Comments were not received as Array");
//                        }
//
//                        // Initialize Finances
//                        if (angular.isArray(locals.finances)) {
//                            self.details.finances = [];
//                        } else {
//                            throw new Error("Comments were not received as Array");
//                        }
//
//                        (function () {
//                            for (var i = 0; i < Finance.defaults.length; i++) {
//                                var defaultFinanceName = Finance.defaults[i],
//                                    finance = _.findWhere(locals.finances, {name: defaultFinanceName}) || {name: defaultFinanceName};
//
//                                // If a default finance was found in the locals, add to self, remove from locals
//                                self.addFinance(finance);
//                                locals.finances = _.reject(locals.finances, function (val) {
//                                    return angular.equals(finance, val);
//                                });
//                            }
//                        })();
//
//                        (function () {
//                            for (var i = 0; i < locals.finances.length; i++) {
//                                self.addFinance(locals.finances[i]);
//                                Finance.defaults.push(locals.name);
//                            }
//                        })();
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

            Property.prototype.addComment = function (comment) {
                var newComment = new Comment(comment, this);

                newComment.propertyId = newComment.propertyId || this.id;

                if (angular.isArray(this.resources.comments)) {
                    this.resources.comments.push(newComment);
                } else {
                    this.resources.comments = [newComment];
                }

                this.notes = true;

                return newComment;
            };

            Property.prototype.deleteComment = function (comment) {
                var self = this;

                self.resources.comments = _.reject(self.resources.comments, function (value) {
                    return angular.equals(value, comment);
                });
            };

            Property.prototype.addFinance = function (finance) {
                var newFinance = new Finance(finance, this);

                newFinance.propertyId = newFinance.propertyId || this.id;

                if (angular.isArray(this.resources.finances)) {
                    this.resources.finances.push(newFinance);
                } else {
                    this.resources.finances = [newFinance];
                }

                this.notes = true;

                return newFinance;
            };

            Property.prototype.deleteFinance = function (finance) {
                var self = this;

                if (finance.id) {
                    finance.$delete().then(function (response) {
                        self.resources.finances = _.reject(self.resources.finances, function (value) {
                            return angular.equals(value, finance);
                        });
                    });
                } else {
                    self.resources.finances = _.reject(self.resources.finances, function (value) {
                        return angular.equals(value, finance);
                    });
                }
            };

            Property.prototype.toggleFavorites = function () {
                var self = this;
                self.$spinner = true;
                if (self.favorites) {
                    angular.forEach(self.resources.favorites, function(fav){
                        var defer = $q.defer();

                        fav.$delete().then(function (response) {
                            self.$spinner = false;
                            self.favorites = false;
                            self.resources.favorites = _.without(self.resources.favorites, fav);
                            console.log(self);
                            defer.resolve(response);
                        })
                    });
                } else {
                    var newFavorite = new Favorite({
                        propertyId: self.id
                    }),
                        defer = $q.defer();

                    newFavorite.$save().then(function (response) {
                            self.$spinner = false;
                            self.favorites = true;
                            self.resources.favorites = self.resources.favorites || [];
                            self.resources.favorites.push(newFavorite);
                            defer.resolve(response);
                        },
                        function (response) {
                            self.$spinner = false;
                            defer.reject(response);
                        });
                }

            };

            Property.prototype.toggleHidden = function () {
                var self = this;
                self.$spinner = true;
                if (self.hidden) {
                    angular.forEach(self.resources.hidden, function(h){
                        var defer = $q.defer();

                        h.$delete().then(function (response) {
                            self.$spinner = false;
                            self.hidden = false;
                            self.resources.hidden = _.without(self.resources.hidden, h);
                            console.log(self);
                            defer.resolve(response);
                        })
                    });
                } else {
                    var newHidden = new Hidden({
                            propertyId: self.id
                        }),
                        defer = $q.defer();

                    newHidden.$save().then(function (response) {
                            self.$spinner = false;
                            self.hidden = true;
                            self.resources.hidden = self.resources.hidden || [];
                            self.resources.hidden.push(newHidden);
                            defer.resolve(response);
                        },
                        function (response) {
                            self.$spinner = false;
                            defer.reject(response);
                        });
                }
            };

            Property.prototype.getAttribute = function (name) {
                if (this.hasOwnProperty(name)) {
                    return this[name];
                } else if (this.attributes.discreet.hasOwnProperty(name)) {
                    return this.attributes.discreet[name];
                } else if (this.attributes.range.hasOwnProperty(name)) {
//                    var parsed = parseInt(this.attributes.range[name], 10);
                    return this.attributes.range[name];
                } else {
                    return "Not Available";
                }
            };

            Property.prototype.getStatusClass = function (type) {
                var suffix = (type === 'solid' || type === 'gradient') ? '-' + type : '';

                switch (this.getAttribute('propertyStatus')) {
                    case 'Marketing':
                        return 'status-marketing' + suffix;
                    case 'Marketing - Past Due':
                        return 'status-under' + suffix;
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

            Property.prototype.getAddress = function () {
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

            Property.prototype.getImages = function () {
                return this.details ? _.map(this.details.images, function (value) {
                    return value;
                }) : undefined;
            };
            return Property;
        }])
    .factory('Reports', ['$_api', '$q', '$http',
        function ($_api, $q, $http) {
            var items;

            return {
                getItems: function () {
                    return items;
                },
                setItems: function (_items) {
                    items = _items;
                },
                send: function (settings) {
                    var defer = $q.defer(),
                        path = $_api.path + '/reports/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify({
                            ids: settings.ids,
                            token: settings.token
                        });

                    $http.post(path, body, config).then(
                        function (response) {
                            console.log(response);
                            defer.resolve(response);
                        },
                        function (response) {
                            defer.reject(response);
                        }
                    );

                    return defer.promise;
                }
            }
        }])
    .factory('SavedSearch', ['$_api', '$http', '$q', '$dialog',
        function ($_api, $http, $q, $dialog) {
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

            SavedSearch.query = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/searches/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config);

                $http.get(path, config).then(
                    function (response) {
                        var searches = [];
                        angular.forEach(response.data, function (value, key) {
                            try {
                                searches.push(new SavedSearch(angular.fromJson(value.savedSearch), value.id));
                            } catch (e) {
                                console.log(e.message);
                            }
                        });
                        defer.resolve(searches);
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );

                return defer.promise;
            };

            SavedSearch.prototype.$delete = function () {
                var defer = $q.defer(),
                    self = this;
                if (self.id) {
                    $http(
                        angular.extend({
                            method: 'DELETE',
                            url: $_api.path + '/searches/' + self.id,
                            transformRequest: function (data) {
                                self.$spinner = true;
                                return data;
                            }}, $_api.config))
                        .then(function (response) {
                            self.$spinner = false;
                            defer.resolve(response);
                        }, function (response) {
                            defer.reject(response);
                        });
                }
                return defer.promise;
            };

            SavedSearch.prototype.$save = function () {
                var defer = $q.defer(),
                    self = this;
                if (self.id) {
                    $http.put($_api.path + '/searches/' + self.id, JSON.stringify({savedSearch: JSON.stringify(self)}), $_api.config).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                } else {
                    $http.post($_api.path + '/searches/', JSON.stringify({savedSearch: JSON.stringify(self)}), $_api.config).then(function (response) {
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
    .factory('Comment', ['$_api', '$q', '$http', 'User', 'ngProgress',
        function ($_api, $q, $http, User, ngProgress) {

            var Comment = function (data, property) {
                data = data || {};
                this.text = data.text || "";
                this.id = data.id || undefined;
                this.propertyId = data.propertyId || undefined;
                this.property = property;
                this.timestamp = data.timestamp || new Date().getTime();
                this.userEmail = data.userEmail || (User.profile ? User.profile.email : "You");
            };

//            Comment.query = function (itemID) {
//                var config = angular.extend({
//                        transformRequest: $_api.loading.none
//                    }, $_api.config),
//                    defer = $q.defer();
//
//                if (typeof itemID !== 'undefined') {
//                    $http.get($_api.path + '/properties/' + itemID + '/comments/', config).then(function (response) {
//                        defer.resolve(response.data.items);
//                    }, function (response) {
//                        defer.reject(response);
//                    });
//                } else {
//                    throw new Error("Comment.query received undefined itemID");
//                }
//
//                return defer.promise;
//            };

            Comment.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 50,
                    rootPath = $_api.path + '/comments/';

                (function batchItems(limit, offset) {
                    var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 1);

                        if (response.data.length < limit || response.data.length === 0) {
                            defer.resolve(items);
                        } else {
                            batchItems(limit, response.data[response.data.length - 1].id);
                        }
                    }, function (response) {
                        defer.reject(response);
                    });

                })(batchLimit);

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
    .factory('Finance', ['$_api', '$q', '$http', 'ngProgress',
        function ($_api, $q, $http, ngProgress) {

            var Finance = function (data, property) {
                data = data || {};
                this.id = data.id || undefined;
                this.propertyId = data.propertyId || undefined;
                this.property = property;
                this.name = data.name || '';
                this.valueFormat = data.valueFormat || 'currency';
                this.value = data.value ? parseFloat(data.value) : undefined;
            };

            Finance.defaults = ['Valuation', 'Cap Rate', 'IRR', 'Price / Unit'];

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

//            Finance.query = function () {
//                var config = angular.extend({
//                        transformRequest: $_api.loading.none
//                    }, $_api.config),
//                    defer = $q.defer(),
//                    propertyId = self.propertyId;
//
//                if (typeof propertyId !== 'undefined') {
//                    $http.get($_api.path + '/properties/' + propertyId + '/finances/', config).then(function (response) {
//                        defer.resolve(response.data.items);
//                    }, function (response) {
//                        defer.reject(response);
//                        //throw new Error("HTTP Error: " + response);
//                    });
//                } else {
//                    throw new Error("Finance.query received undefined itemID");
//                }
//
//                return defer.promise;
//            };

            Finance.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 50,
                    rootPath = $_api.path + '/finances/';

                (function batchItems(limit, offset) {
                    var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 1);

                        if (response.data.length < limit || response.data.length === 0) {
                            defer.resolve(items);
                        } else {
                            batchItems(limit, response.data[response.data.length - 1].id);
                        }
                    }, function (response) {
                        defer.reject(response);
                    });

                })(batchLimit);

                return defer.promise;
            }

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
    .factory('Favorite', ['$http', '$q', '$_api', 'ngProgress',
        function ($http, $q, $_api, ngProgress) {
            var Favorite = function (data) {
                data = data || {};
                this.id = data.id;
                this.propertyId = data.propertyId;

                if (!this.propertyId) {
                    throw new Error("Invalid favorite resource");
                }
            };

            Favorite.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 50,
                    rootPath = $_api.path + '/favorites/';

                (function batchItems(limit, offset) {
                    var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 1);

                        if (response.data.length < limit || response.data.length === 0) {
                            defer.resolve(items);
                        } else {
                            batchItems(limit, response.data[response.data.length - 1].id);
                        }
                    }, function (response) {
                        defer.reject(response);
                    });

                })(batchLimit);

                return defer.promise;
            };

            Favorite.prototype.$save = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/favorites/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({
                        propertyId: self.propertyId
                    });

                $http.post(path, body, config).then(
                    function (response) {
                        defer.resolve(response);
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );

                return defer.promise;
            }

            Favorite.prototype.$delete = function () {
                var self = this,
                    defer = $q.defer(),
                    path = $_api.path + '/favorites/' + this.id;

                $http({
                    method: 'DELETE',
                    url: path,
                    headers: {'Content-Type': 'application/json'},
                    withCredentials: true
                }).then(function (response) {
                        defer.resolve(response);
                    }, function (response) {
                        defer.reject(response);
                    })

                return defer.promise;
            }

            return Favorite;
        }])
    .factory('Hidden', ['$http', '$q', '$_api', 'ngProgress',
        function ($http, $q, $_api, ngProgress) {
            var Hidden = function (data) {
                data = data || {};
                this.id = data.id;
                this.propertyId = data.propertyId;

                if (!this.propertyId) {
                    throw new Error("Invalid hidden resource");
                }
            };

            Hidden.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 50,
                    rootPath = $_api.path + '/hidden/';

                (function batchItems(limit, offset) {
                    var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 1);

                        if (response.data.length < limit || response.data.length === 0) {
                            defer.resolve(items);
                        } else {
                            console.log(response);
                            batchItems(limit, response.data[response.data.length - 1].id);
                        }
                    }, function (response) {
                        defer.reject(response);
                    });

                })(batchLimit);

                return defer.promise;
            };

            Hidden.prototype.$save = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/hidden/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({
                        propertyId: self.propertyId
                    });

                $http.post(path, body, config).then(
                    function (response) {
                        defer.resolve(response);
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );

                return defer.promise;
            }

            Hidden.prototype.$delete = function () {
                var self = this,
                    defer = $q.defer(),
                    path = $_api.path + '/hidden/' + this.id;

                $http({
                    method: 'DELETE',
                    url: path,
                    headers: {'Content-Type': 'application/json'},
                    withCredentials: true
                }).then(function (response) {
                        defer.resolve(response);
                    }, function (response) {
                        defer.reject(response);
                    })

                return defer.promise;
            }

            return Hidden;
        }])
    .directive('imgViewer', ['$window', function ($document) {
        return{
            restrict: 'EA',
//            transclude: true,
//            replace: true,
            templateUrl: '/template/img-viewer/img-viewer.html',
            controller: 'viewerCtrl',
            scope: {
                images: '='
            },
            link: function (scope, element, attr, viewerCtrl) {
                if (scope.images.length > 0) {
                    scope.images[0].isActive = true;

                    for (var i = 1; i < scope.images.length; i++) {
                        var _image = scope.images[i];
                        _image.isActive = false;
                    }
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
            };

            $scope.prev = function () {
                $scope.slides[$scope.current].isActive = false;
                $scope.current = $scope.current == 0 ? $scope.slides.length - 1 : $scope.current -= 1;
                $scope.slides[$scope.current].isActive = true;
            };

            $scope.next = function () {
                $scope.slides[$scope.current].isActive = false;
                $scope.current = $scope.current == $scope.slides.length - 1 ? $scope.current = 0 : $scope.current += 1;
                $scope.slides[$scope.current].isActive = true;
            };
        }])
    .filter('checkBounds', function () {
        return function (input, limit, e) {
            return input == limit ? input + "+" : input;
        }
    });
