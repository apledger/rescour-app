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
    .factory('Property', ['$_api', '$q', '$http', 'Comment', 'Finance', 'Favorite', 'Hidden', '$exceptionHandler', 'ngProgress', '$filter',
        function ($_api, $q, $http, Comment, Finance, Favorite, Hidden, $exceptionHandler, ngProgress, $filter) {
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
                    opts = _.extend({}, defaults, data),
                    self = this;

                angular.copy(opts, this);
                this.title = this.title || 'Untitled Property';
                this.description = this.description || 'No description provided.';
                if ($_api.env !== 'local') {
                    this.thumbnail = this.thumbnail ? $_api.path + '/pictures/' + this.thumbnail : '/img/apt0.jpg';
                }
                this.state = this.address.state;
                this.location = (data.address.latitude && data.address.longitude) ? [data.address.latitude, data.address.longitude] : null;
                this.latitude = parseFloat(data.address.latitude) || 'NA';
                this.longitude = parseFloat(data.address.longitude) || 'NA';
                this.yearBuilt = parseInt(this.yearBuilt, 10) || 'NA';
                this.numUnits = parseInt(this.numUnits, 10) || 'NA';
                if (Date.parse(this.datePosted)) {
                    this.datePosted = new Date(this.datePosted);
                } else {
                    this.datePosted = this.datePosted ? new Date(parseInt(this.datePosted, 10)) : new Date(parseInt(this.id.toString().slice(0, 8), 16) * 1000);
                }
                this.daysOnMarket = Math.ceil(Math.abs(Date.now() - (this.datePosted.getTime())) / (1000 * 3600 * 24));
                this.resources = {};
                this.favorites = false;
                this.callForOffers = this.callForOffers ? new Date(this.callForOffers) : null;
                this.hidden = false;
                this.resources = {
                    finances: [],
                    comments: []
                };
                this.images = this.images || [];
                this.initializeDefaultFinances();
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
                        lowBound: 1930,
                        weight: 9
                    },
                    'daysOnMarket': {
                        title: 'Days on Market',
                        weight: 8
                    },
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

                        angular.forEach(_.keys(resourceMap), function (resourceKey, resourceIndex) {
                            angular.forEach(results[resourceIndex], function (resource) {
                                try {
                                    var propertyId = resource.propertyId,
                                        resourceId = resource.id,
                                        resourceModel = resourceMap[resourceKey];

                                    if (properties[propertyId]) {
                                        var property = properties[propertyId],
                                            propertyResources = property.resources[resourceKey] = property.resources[resourceKey] || [];

                                        console.log(property, resource);

                                        if (resourceKey === 'finances') {
                                            property.setFinance(resource);
                                        } else {
                                            propertyResources.push(new resourceModel(resource));
                                        }

                                        if (resourceKey === 'comments' || resourceKey === 'finances') {
                                            property.notes = true;
                                        } else {
                                            property[resourceKey] = true;
                                        }


                                    } else {
                                        throw new Error("Cannot add " + resourceKey + ": " + resource.id + " to Property ID: " + propertyId + ", does not exist")
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
                    batchLimit = 500;

                (function batchItems(limit, offset) {
                    var path = $_api.path + '/properties/' + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .1));

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

            Property.convertToCSV = function (items) {

                var reportConfig = [
                        {
                            key: 'datePosted',
                            title: 'Date Posted',
                            method: function (item) {
                                return $filter('date')(item.datePosted);
                            }
                        },
                        {
                            key: 'broker',
                            title: 'Broker'
                        },
                        {
                            key: 'title',
                            title: 'Title'
                        },
                        {
                            key: 'numUnits',
                            title: 'Num Units'
                        },
                        {
                            key: 'propertyType',
                            title: 'Property Type'
                        },
                        {
                            key: 'acres',
                            title: 'Acres'
                        },
                        {
                            key: 'yearBuilt',
                            title: 'Year Built'
                        },
                        {
                            key: 'callForOffers',
                            title: 'Call For Offers'
                        },
                        {
                            key: 'address',
                            title: 'Address',
                            method: function (item) {
                                if (!item.getAddress()) throw new Error('Method getAddress is not defined for ' + item);
                                return item.getAddress();
                            }
                        },
                        {
                            key: 'tourDates',
                            title: 'Tour Dates',
                            fields: ['date'],
                            fieldsFormat: {
                                date: function (field) {
                                    return $filter('date')(field);
                                }
                            }
                        },
                        {
                            key: 'propertyStatus',
                            title: 'Status'
                        },
                        {
                            key: 'comments',
                            title: 'Comments',
                            accessor: 'resources',
                            fields: ['userEmail', 'text'],
                            separator: ' - '
                        },
                        {
                            key: 'finances',
                            title: 'Valuation',
                            accessor: 'resources',
                            method: function (item) {
                                if (!item.getFinance) throw new Error('Method getFinance is not defined for ' + item);
                                return item.getFinance('Valuation').value;
                            }
                        },
                        {
                            key: 'finances',
                            title: 'Cap Rate',
                            accessor: 'resources',
                            method: function (item) {
                                if (!item.getFinance) throw new Error('Method getFinance is not defined for ' + item);
                                return item.getFinance('Cap Rate').value;
                            }
                        },
                        {
                            key: 'finances',
                            title: 'IRR',
                            accessor: 'resources',
                            method: function (item) {
                                if (!item.getFinance) throw new Error('Method getFinance is not defined for ' + item);
                                return item.getFinance('IRR').value;
                            }
                        },
                        {
                            key: 'finances',
                            title: 'Price / Unit',
                            accessor: 'resources',
                            method: function (item) {
                                if (!item.getFinance) throw new Error('Method getFinance is not defined for ' + item);
                                return item.getFinance('Price / Unit').value;
                            }
                        }
                    ],
                    str = '';

                (function setHeaders() {
                    var line = '';
                    for (var i = 0; i < reportConfig.length; i++) {
                        var reportFieldConfig = reportConfig[i];
                        if (line != '') line += ','

                        line += reportFieldConfig.title;
                    }
                    str += line + '\r\n';
                })();

                (function setFields() {
                    for (var i = 0; i < items.length; i++) {
                        var line = '',
                            item = items[i];

                        for (var j = 0; j < reportConfig.length; j++) {
                            var reportFieldConfig = reportConfig[j],
                                itemField = reportFieldConfig.accessor ? item[reportFieldConfig.accessor][reportFieldConfig.key] : item[reportFieldConfig.key];
                            if (line != '') line += ','

                            if (reportFieldConfig.method) {
                                line += '"' + (reportFieldConfig.method(item) || '') + '"';
                            } else if (_.isArray(itemField)) {
                                var reportArrayLine = '';

                                for (var k = 0; k < itemField.length; k++) {
                                    var reportArrayObj = itemField[k],
                                        reportArrayFields = reportFieldConfig.fields || _.keys(reportArrayObj),
                                        objLineArray = [];

                                    if (reportArrayLine != '') reportArrayLine += ', ';
                                    angular.forEach(reportArrayFields, function (fieldKey) {
                                        if (reportFieldConfig.fieldsFormat && reportFieldConfig.fieldsFormat.hasOwnProperty(fieldKey)) {
                                            objLineArray.push(reportFieldConfig.fieldsFormat[fieldKey](reportArrayObj[fieldKey]));
                                        } else {
                                            objLineArray.push(reportArrayObj[fieldKey]);
                                        }
                                    });

                                    reportArrayLine += objLineArray.join(reportFieldConfig.separator || ' - ');
                                }
                                line += ('"' + reportArrayLine + '"');
                            } else {
                                line += '"' + (itemField || '') + '"';
                            }
                        }

                        str += line + '\r\n';
                    }
                })();

                return str;
            };

            Property.prototype.initializeDefaultFinances = function () {
                var self = this;
                angular.forEach(Finance.defaults, function (defaultFinanceName) {
                    var defaultFinance = _.findWhere(self.resources.finances, {name: defaultFinanceName});
                    if (!defaultFinance) {
                        self.resources.finances.push(new Finance({
                            name: defaultFinanceName
                        }, self.id));
                    }
                });

                return this;
            };

            Property.prototype.addComment = function (comment) {
                var newComment = new Comment(comment, this.id);

                this.resources.comments = this.resources.comments || [];
                this.resources.comments.push(newComment);

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
                var newFinance = new Finance(finance, this.id);

                this.resources.finances = this.resources.finances || [];
                this.resources.finances.push(newFinance);

                this.notes = true;

                return newFinance;
            };

            Property.prototype.saveFinance = function (finance) {
                var self = this;
                if (finance.value) {
                    finance.$save().then(function () {
                        self.notes = true;
                    });
                }
            };

            Property.prototype.deleteFinance = function (finance) {
                var self = this;

                if (finance.id) {
                    finance.$delete().then(function (response) {
                        self.resources.finances = _.without(self.resources.finances, finance);
                    });
                } else {
                    self.resources.finances = _.without(self.resources.finances, finance);
                }
            };

            Property.prototype.toggleFavorites = function () {
                var self = this;
                self.$spinner = true;
                if (self.favorites) {
                    angular.forEach(self.resources.favorites, function (fav) {
                        var defer = $q.defer();

                        fav.$delete().then(function (response) {
                            self.$spinner = false;
                            self.favorites = false;
                            self.resources.favorites = _.without(self.resources.favorites, fav);
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
                    angular.forEach(self.resources.hidden, function (h) {
                        var defer = $q.defer();

                        h.$delete().then(function (response) {
                            self.$spinner = false;
                            self.hidden = false;
                            self.resources.hidden = _.without(self.resources.hidden, h);
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
                var suffix = type ? '-' + type : '';

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

            Property.prototype.getFinance = function (type) {
                return _.find(this.resources.finances, function (val) {
                    return val.name === type;
                });
            };

            Property.prototype.setFinance = function (finance) {
                // Check to see if in defaults
                // If so override
                var self = this;
                var defaultFinanceIndex = _.indexOf(_.indexBy(self.resources.finances, 'name'), finance.name);
                    console.log(defaultFinanceIndex);
                if (defaultFinanceIndex) {
                    this.resources.finances[defaultFinanceIndex] = new Finance(finance);
                } else {
                    // Otherwise push
                    this.resources.finances.push(new Finance(finance));
                }
            }

            return Property;
        }])
    .
    factory('Reports', ['$_api', '$q', '$http',
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
                    $http({
                        method: 'DELETE',
                        url: $_api.path + '/searches/' + self.id,
                        transformRequest: function (data) {
                            self.$spinner = true;
                            return data;
                        },
                        headers: $_api.config.headers,
                        withCredentials: true
                    })
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
                    self = this,
                    config = $_api.config;
                if (self.id) {
                    $http.put($_api.path + '/searches/' + self.id, JSON.stringify({savedSearch: JSON.stringify(self)}), $_api.config).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response.data);
                    });
                } else {
                    $http.post($_api.path + '/searches/', JSON.stringify({savedSearch: JSON.stringify(self)}), config).then(function (response) {
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

            var Comment = function (data, propertyId) {
                data = data || {};
                var opts = angular.extend({
                    propertyId: propertyId
                }, data);

                angular.copy(opts, this);
                this.userEmail = data.userEmail || (User.profile ? User.profile.email : "You");
            };

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
                        ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .05));

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
                    body = JSON.stringify(self);

                if (typeof propertyId !== 'undefined') {
                    $http.post($_api.path + '/comments/', body, config)
                        .then(function (response) {
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

            var Finance = function (data, propertyId) {
                data = data || {};
                var opts = angular.extend({
                    propertyId: propertyId,
                    valueFormat: 'currency'
                }, data);

                angular.copy(opts, this);
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
                        ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .01));

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
                    body = JSON.stringify(self),
                    propertyId = self.propertyId;

                if (typeof propertyId !== 'undefined') {
                    if (self.id) {
                        $http.put($_api.path + '/finances/' + self.id, body, config)
                            .then(function (response) {
                                self.$spinner = false;
                                defer.resolve(response);
                            }, function (response) {
                                self.$spinner = false;
                                defer.reject(response);
                            });
                    } else {
                        $http.post($_api.path + '/finances/', body, config)
                            .then(function (response) {
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
                        url: $_api.path + '/finances/' + self.id,
                        headers: $_api.config.headers,
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
                        ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .01));

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
                        ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .01));

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
    .factory('RentMetrics', ['$_api', '$http', '$q', 'ngProgress',
        function ($_api, $http, $q, ngProgress) {

            var RentMetrics = function (address, limit) {
                this.address = address.street1 + ' ' + address.city + ',' + address.state;
                this.comps = [];
                this.limit = 100;
                this.averages = {};
                this.past = 30;
                this.radius = 3;
                this.setStartDate();
            };

            RentMetrics.prototype.setStartDate = function (days) {
                var currentDate = new Date(Date.now());
                this.past = days || this.past;
                currentDate.setDate(currentDate.getDate() - this.past);
                this.startDate = currentDate.toJSON().split('T')[0];
                return this;
            };

            RentMetrics.prototype.getComps = function () {
                return comps;
            }

            RentMetrics.prototype.getAverages = function () {
                return _.map(this.averages, function (val) {
                    return val;
                });
            };

            RentMetrics.prototype.query = function (opts) {
                var self = this,
                    offset = 0,
                    defer = $q.defer(),
                    limit = this.limit;

                ngProgress.reset();
                ngProgress.height('4px');
                ngProgress.color('#0088cc');
                ngProgress.start();
                self.$spinner = true;
                self.comps = [];
                self.averages = {};
                (function batch(offset) {
                    $http.jsonp('http://www.rentmetrics.com/api/v1/apartments.json?', {
                        params: angular.extend(opts || {}, {
                            address: self.address,
                            limit: self.limit,
                            offset: offset,
                            api_token: $_api.rentMetricToken,
                            include_images: false,
                            max_distance_mi: self.radius,
                            callback: 'JSON_CALLBACK',
                            start_date: self.startDate
                        }),
                        cache: true,
                        headers: {'Content-Type': 'application/json'},
                        withCredentials: true
                    }).then(function (response) {
                            for (var i = response.data.collection.length - 1; i >= 0; i--) {
                                var comp = response.data.collection[i];
                                for (var j = 0; j < comp.latest_prices.length; j++) {
                                    var unit = comp.latest_prices[j];

                                    if (unit.bedrooms && (unit.full_bathrooms + unit.partial_bathrooms)) {
                                        var unitType = unit.bedrooms + 'BR/' + (unit.full_bathrooms + (unit.partial_bathrooms * 0.5)) + 'BA';

                                        // Some bedroom and bath data is incorrect, need to omit from average
                                        if ((unit.full_bathrooms + (unit.partial_bathrooms * 0.5)) > 10 || unit.bedrooms > 10) {
                                            break;
                                        }
                                        self.averages[unitType] = self.averages[unitType] || {
                                            bedrooms: unit.bedrooms,
                                            type: unitType,
                                            rent: 0,
                                            sqft: 0,
                                            count: 0
                                        }
                                        self.averages[unitType].rent += unit.rent;
                                        self.averages[unitType].sqft += unit.sq_ft;
                                        self.averages[unitType].count++;
                                    } else {
                                        break;
                                    }
                                }
                            }
                            self.comps = self.comps.concat(response.data.collection);
                            if (response.data.offset < response.data.total) {
                                batch(offset + limit);
                            } else {
                                ngProgress.complete();
                                self.$spinner = false;
                                defer.resolve(self.comps);
                            }
                        }, function (response) {
                            ngProgress.complete();
                            self.$spinner = false;
                            defer.reject(response);
                        },
                        function (response) {
                            ngProgress.complete();
                            self.$spinner = false;
                            self.error = "Error Loading Comps";
                            defer.reject(response);
                        });
                })(offset || 0);

                return defer.promise;
            };

            return RentMetrics;
        }]);
