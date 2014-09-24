angular.module('rescour.services')
.factory('Finance',
    function (Environment, $q, $http) {

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

//            Finance.query = function () {
//                var config = angular.extend({
//                        transformRequest: Environment.loading.none
//                    }, Environment.config),
//                    defer = $q.defer(),
//                    propertyId = self.propertyId;
//
//                if (typeof propertyId !== 'undefined') {
//                    $http.get(Environment.path + '/properties/' + propertyId + '/finances/', config).then(function (response) {
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
                }, Environment.config),
                batchLimit = 50,
                rootPath = Environment.path + '/finances/';

            (function batchItems(limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    items = items.concat(response.data);

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
                }, Environment.config),
                body = JSON.stringify(self),
                propertyId = self.propertyId;

            if (typeof propertyId !== 'undefined') {
                if (self.id) {
                    $http.put(Environment.path + '/finances/' + self.id, body, config)
                        .then(function (response) {
                            self.$spinner = false;
                            defer.resolve(response);
                        }, function (response) {
                            self.$spinner = false;
                            defer.reject(response);
                        });
                } else {
                    $http.post(Environment.path + '/finances/', body, config)
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
                    url: Environment.path + '/finances/' + self.id,
                    headers: Environment.config.headers,
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
    });