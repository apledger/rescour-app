angular.module('rescour.news', [])
    .value('NewsZoomThreshold', 10)
    .factory('NewsMarket', ['News',
        function (News) {
            return new thotpod.Marketplace(News);
        }])
    .factory('News', ['$_api', '$q', '$http',
        function ($_api, $q, $http) {

            // Item constructor
            var News = function (data) {

                if (!data.address) {
                    throw new Error ("No address specified for " + data.id + ": " + data.title);
                } else if (!data.address.latitude || !data.address.longitude) {
                    throw new Error ("No lat,lng specified for " + data.id + ": " + data.title);
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

                angular.copy(opts, self);
                this.address = this.address || {};
                // Check if http is on URL
                if (this.url) {
                    if (this.url.indexOf('http://') == -1) {
                        this.url = 'http://' + this.url;
                    }
                }
                this.attributes.discreet.category = this.category;
                this.attributes.range.latitude = parseFloat(this.address.latitude) || 'NA';
                this.attributes.range.longitude = parseFloat(this.address.longitude) || 'NA';
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
                var defer = $q.defer(),
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config);

                $http.get($_api.path + '/news/', config).then(function (response) {
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            };

            return News;
        }]);