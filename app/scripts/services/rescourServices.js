'use strict';

angular.module('rescour.app')
    .service('User', ['$http', '$q', '$_api', function ($http, $q, $_api) {
        this.profile = {};
        this.billing = {};

        this.getProfile = function () {
            var defer = $q.defer(),
                self = this,
                path = $_api.path + '/auth/users/user/',
                config = angular.extend({
                }, $_api.config);

            $http.get(path, config).then(
                function (response) {
                    angular.copy(response.data, self.profile);
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        this.saveProfile = function () {
            var defer = $q.defer(),
                self = this,
                path = $_api.path + '/auth/users/user/',
                config = angular.extend({
                    transformRequest: function (data) {
                        return data;
                    }
                }, $_api.config),
                body = JSON.stringify(this.profile);
            $http.put(path, body, config).then(
                function (response) {
                    defer.resolve(response);
                },
                function (response) {
                    console.log(response);
                    self.getProfile();
                    throw new Error("Error updating profile");
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        this.getBilling = function () {
            var defer = $q.defer(),
                self = this,
                path = $_api.path + '/auth/users/user/payment/',
                config = angular.extend({
                    transformRequest: function (data) {
                        return data;
                    }
                }, $_api.config);

            $http.get(path, config).then(
                function (response) {
                    angular.copy(response.data, self.billing);
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        this.cancelSubscription = function (reason, transform) {
            var defer = $q.defer(),
                self = this,
                path = $_api.path + '/auth/users/user/cancel/',
                config = angular.extend({
                    transformRequest: transform
                }, $_api.config),
                body = JSON.stringify({
                    text: reason
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
        };
    }]);
