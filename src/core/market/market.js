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
                bound: 500,
                weight: 10
            },
            'yearBuilt': {
                title: 'Year Built',
                weight: 9
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
    })

    .factory('Item', ['$_api', '$q', '$http', 'Comment', 'Finance',
        function ($_api, $q, $http, Comment, Finance) {

            // Item constructor
            var Item = function (data) {
                if (data.hasOwnProperty('id')) {
                    this.id = data.id;
                } else {
                    throw new Error("Cannot find id in " + data);
                }
                var defaults = {
                        attributes: {
                            discreet: {},
                            range: {}
                        },
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

                this.attributes.range.latitude = data.address.latitude || 'NA';
                this.attributes.range.longitude = data.address.longitude || 'NA';
            };

            Item.query = function () {
                var defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
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

            Item.prototype.getAttribute = function (name) {
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

            Item.prototype.getStatusClass = function (type) {
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
                    path = $_api.path + '/search/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config);

                $http.get(path, config).then(
                    function (response) {
                        var searches = [];
                        angular.forEach(response.data.resources, function (value, key) {
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
