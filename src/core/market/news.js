angular.module('rescour.news', [])
    .value('NewsZoomThreshold', 10)
    .factory('NewsMarket', ['News',
        function (News) {
            return new thotpod.Marketplace(News);
        }])
    .factory('News', ['$_api', '$q', '$http', 'ngProgress',
        function ($_api, $q, $http, ngProgress) {

            // Item constructor
            var News = function (data) {

                if (!data.address) {
                    throw new Error ("No address specified for " + data.id + ": " + data.title);
                } else if (!data.address.latitude || !data.address.longitude) {
                    throw new Error ("No lat,lng specified for " + data.id + ": " + data.title);
                }

                var defaults = {
                        address: {
                            street1: 'No address listed'
                        },
                        isVisible: true
                    },
                    opts = angular.extend({}, defaults, data),
                    self = this;

                angular.copy(opts, self);
                this.address = this.address || {};
                // Check if http is on URL
                if (this.url) {
                    if (this.url.indexOf('http://') == -1) {
                        this.url = 'http://' + this.url;
                    }
                }
                this.latitude = parseFloat(this.address.latitude) || 'NA';
                this.longitude = parseFloat(this.address.longitude) || 'NA';
            };

            News.$dimensions = {
                discreet: {
                    category: {
                        title: 'Category',
                        weight: 0
                    }
                },
                range: {
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

            News.query = function () {
                var items = [],
                    defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    batchLimit = 500,
                    rootPath = $_api.path + '/news/';

                (function batchItems(limit, offset) {
                    var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                    $http.get(path, config).then(function (response) {
                        items = items.concat(response.data);
                        ngProgress.set(ngProgress.status() + 10);

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

            return News;
        }]);