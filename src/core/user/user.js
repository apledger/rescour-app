/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:58 PM
 * File: user.js
 */
angular.module('rescour.user', ['ngCookies'])
    .service('User', ['$http', '$q', '$_api', '$cookieStore', '$cookies',
        function ($http, $q, $_api, $cookieStore, $cookies) {
            this.profile = {};
            this.billing = {};

            this.getProfile = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/auth/user/',
                    config = angular.extend({
                    }, $_api.config);


                $http.get(path, config).then(
                    function (response) {
                        console.log(response);
                        self.id = response.data[0].id;
                        angular.copy(response.data[0], self.profile);
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
                    path = $_api.path + '/auth/user/' + self.id,
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify(this.profile);

                if (this.id) {
                    $http.put(path, body, config).then(
                        function (response) {
                            defer.resolve(response);
                        },
                        function (response) {
                            self.getProfile();
                            throw new Error("Error updating profile");
                            defer.reject(response);
                        }
                    );
                } else {
                    throw new Error("Could not save profile, id not specified");
                }


                return defer.promise;
            };
            
            this.addStripe = function (tok) {
                console.log(this);
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/auth/user/' + self.id + '/payment/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({
                        token: tok
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

            this.cancelSubscription = function (reason, transformFn) {
                var defer = $q.defer(),
                    path = $_api.path + '/email/',
                    config = angular.extend({
                        transformRequest: transformFn
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
