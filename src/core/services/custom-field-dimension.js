angular.module('rescour.services')
    .factory('CustomFieldDimension',
    function (Environment, $q, $http, $log, segmentio) {

        /**
         * CustomFieldDimension
         * @param data
         * @param parent Link to parent model
         * @constructor
         */
        var CustomFieldDimension = function (data) {
            data = data || {};
            angular.copy(data, this);
            this.id = data.id || null;
            this.title = data.title;
            this.resourcePath = '/custom_field_dimensions/' + (this.id || '');
        };

        CustomFieldDimension.query = function (propertiesHash) {
            var items = [],
                defer = $q.defer(),
                config = _.extend({ ignoreLoadingBar: true }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/custom_field_dimensions/';

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
        };

        CustomFieldDimension.prototype.save = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + self.resourcePath,
                method = self.id ? 'PUT' : 'POST',
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    title: self.title
                });

            $http(_.extend({
                url: path,
                method: method,
                data: body
            }, config)).then(
                function (response) {
                    segmentio.track('Custom Field Dimension Saved', {
                        customFieldDimensionTitle: self.title
                    });
                    self.id = response.data.id;
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        CustomFieldDimension.prototype.delete = function () {
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
                    segmentio.track('Custom Field Dimension Deleted', {
                        customFieldDimensionTitle: self.title
                    });
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        return CustomFieldDimension;
    });