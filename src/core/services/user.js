/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:58 PM
 * File: user.js
 */
angular.module('rescour.services')
    .service('User', function ($http, $q, Environment, CustomFieldDimension, segmentio) {
        this.profile = {};
        this.billing = {};
        this.customFieldDimensions = [];

        this.get = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/auth/user/',
                config = _.extend({
                }, Environment.config);

            $http.get(path, config).then(
                function (response) {
                    angular.copy(response.data[0], self.profile);
                    self.id = response.data[0].id;
                    self.isAdmin = _.contains(self.profile.roles, 'admin');
                    self.isGoodStanding = _.contains(self.profile.roles, 'good-standing');
                    self.getBilling();
                    self.getCustomFieldDimensions();

                    segmentio.identify(self.id, {
                        email: self.profile.email,
                        firstName: self.profile.firstName,
                        lastName: self.profile.lastName,
                        company: self.profile.company,
                        created: self.profile._createdTs
                    });

                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        this.getCustomFieldDimensions = function () {
            var defer = $q.defer(),
                self = this;

            CustomFieldDimension.query().then(function (results) {
                self.customFieldDimensions = [];
                angular.forEach(results, function(value){
                    self.customFieldDimensions.push(new CustomFieldDimension(value));
                });
                defer.resolve(self.customFieldDimensions);
            });

            return defer.promise;
        };

        this.removeCustomFieldDimension = function (customFieldDimension) {
            var defer = $q.defer(),
                self = this,
                oldCustomFieldDimensions = _.extend({}, self.customFieldDimensions);

            self.customFieldDimensions = _.without(self.customFieldDimensions, customFieldDimension);

            customFieldDimension
                .delete()
                .then(function (response) {
                    if (response.status === 200) {
                        defer.resolve(self);
                    } else {
                        self.customFieldDimensions = oldCustomFieldDimensions;
                        defer.reject(response);
                    }
                }, function (response) {
                    self.customFieldDimensions = oldCustomFieldDimensions;
                    defer.reject(response);
                });
        };

        this.saveProfile = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/auth/user/' + self.id,
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    firstName: self.profile.firstName,
                    lastName: self.profile.lastName,
                    email: self.profile.email,
                    company: self.profile.company,
                    phone: self.profile.phone
                });

            if (this.id) {
                $http.put(path, body, config).then(
                    function (response) {
                        defer.resolve(response);
                    },
                    function (response) {
                        self.get();
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
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/auth/user/' + self.id + '/payment/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    card: tok,
                    plan: 'one_license',
                    description: 'One Seat License'
                });

            $http.put(path, body, config).then(
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
                path = Environment.path + '/auth/user/' + self.id + '/payment/',
                config = _.extend({}, Environment.config);

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

        this.changePassword = function (creds) {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/auth/user/' + self.id + '/password/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify(creds);

            $http.put(path, body, config).then(
                function (response) {
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        }

        this.login = function (creds) {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/auth/login/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify(creds);

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
    });
