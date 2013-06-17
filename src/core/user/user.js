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
            var getCookies = function(){
                var pairs = document.cookie.split(";");
                var cookies = {};
                for (var i=0; i<pairs.length; i++){
                    var pair = pairs[i].split("=");
                    cookies[pair[0]] = unescape(pair[1]);
                }
                return cookies;
            }

            this.getProfile = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/auth/users/user/',
                    config = angular.extend({
                    }, $_api.config);

                console.log($cookieStore.user);
                console.log($cookies.user);

                $http.get(path, config).then(
                    function (response) {
                        angular.copy(response.data, self.profile);
                        console.log(document.cookie);
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

            this.cancelSubscription = function (reason, transformFn) {
                var defer = $q.defer(),
                    path = $_api.path + '/auth/users/user/cancel/',
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
