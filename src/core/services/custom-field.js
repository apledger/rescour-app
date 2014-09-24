angular.module('rescour.services')
    .factory('CustomField',
    function (Environment, $q, $http, $rootScope, segmentio) {

        /**
         * CustomField
         * @param data
         * @param parent Link to parent model
         * @constructor
         */
        var CustomField = function (data) {
            if (!data.propertyId) {
                throw new Error("CustomField cannot be initialized" + JSON.stringify(data));
            }
            data = data || {};
            this.id = data.id || null;
            this.propertyId = data.propertyId;
            this.customFieldDimensionId = data.customFieldDimensionId;
            this.title = data.title || '';
            this.resourcePath = '/custom_fields/' + (this.id || '');
            this.savedTitle = this.title;
        };

        CustomField.query = function (propertiesHash) {
            var items = [],
                defer = $q.defer(),
                config = _.extend({ ignoreLoadingBar: true }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/custom_fields/';

            (function batchItems(limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    for (var i = response.data.length - 1; i >= 0; i--) {
                        var _customField = new CustomField(response.data[i]);
                        if (propertiesHash[_customField.propertyId]) {
                            propertiesHash[_customField.propertyId].customFields[_customField.customFieldDimensionId] = _customField;
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

        CustomField.prototype.save = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + self.resourcePath,
                method = self.id ? 'PUT' : 'POST',
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    title: self.title,
                    customFieldDimensionId: self.customFieldDimensionId,
                    propertyId: self.propertyId
                });

            if (this.savedTitle !== this.title) {
                $http(_.extend({
                    url: path,
                    method: method,
                    data: body
                }, config)).then(
                    function (response) {
                        $rootScope.$broadcast('noteAdded', self.propertyId);
                        segmentio.track('Custom Field Value Saved', {
                            customFieldValue: self.title,
                            mduId: self.propertyId
                        });
                        self.id = response.data.id;
                        self.savedTitle = self.title;
                        defer.resolve(response);
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );
            } else {
                defer.resolve();
            }


            return defer.promise;
        };

        CustomField.prototype.delete = function () {
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
                    segmentio.track('Custom Field Value Deleted', {
                        customFieldTitle: self.title,
                        mduId: self.propertyId
                    });
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        return CustomField;
    });