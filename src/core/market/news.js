angular.module('rescour.news', [])
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

                this.attributes.range.latitude = this.address.latitude || 'NA';
                this.attributes.range.longitude = this.address.longitude || 'NA';
            };

            News.$dimensions = {
                discreet: {},
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