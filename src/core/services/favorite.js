angular.module('rescour.services')
    .factory('Favorite',
    function (Environment, $q, $http, User) {

        /**
         * Favorite
         * @param data
         * @param parent Link to parent model
         * @constructor
         */
        var Favorite = function (data) {
            if (!data.propertyId) {
                throw new Error("Favorite cannot be initialized" + JSON.stringify(data));
            }
            data = data || {};
            this.id = data.id || null;
            this.propertyId = data.propertyId;
            this.resourcePath = '/favorites/' + (this.id || '');
            this.datePosted = data.datePosted || data._createdTs || Date.now();
        };

        Favorite.query = function (propertiesHash) {
            var items = [],
                defer = $q.defer(),
                config = _.extend({ ignoreLoadingBar: true }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/favorites/';

            (function batchItems(limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    for (var i = response.data.length - 1; i >= 0; i--) {
                        var _favorite = new Favorite(response.data[i]);
                        if (propertiesHash[_favorite.propertyId]) {
                            propertiesHash[_favorite.propertyId].favorites.push(_favorite);
                            propertiesHash[_favorite.propertyId].isFavorite = true;
                        }
                    }
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
        };

        Favorite.prototype.save = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + self.resourcePath,
                method = self.id ? 'PUT' : 'POST',
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    propertyId: self.propertyId
                });

            $http(_.extend({
                url: path,
                method: method,
                data: body
            }, config)).then(
                function (response) {
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        Favorite.prototype.delete = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + self.resourcePath,
                method = 'DELETE',
                config = _.extend({}, Environment.config);

            $http(_.extend({
                url: path,
                method: method
            }, config)).then(
                function (response) {
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        return Favorite;
    });