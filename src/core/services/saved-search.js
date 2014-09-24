angular.module('rescour.services')
    .factory('SavedSearch',
    function (Environment, $http, $q, segmentio) {
        var SavedSearch = function (data, id) {
            var self = this;
            this.title = data.title || undefined;
            this.id = id || data.id;
            this.discrete = {};
            this.range = {};

            if (data.discrete) {
                for (var discreteID in data.discrete) {
                    if (data.discrete.hasOwnProperty(discreteID)) {
                        self.discrete[discreteID] = {
                            values: {}
                        };

                        for (var valueID in data.discrete[discreteID].values) {
                            if (data.discrete[discreteID].values.hasOwnProperty(valueID)) {
                                self.discrete[discreteID].values[valueID] = {
                                    isSelected: data.discrete[discreteID].values[valueID].isSelected
                                };
                            }
                        }
                    }
                }
            }

            if (data.range) {
                for (var rangeID in data.range) {
                    if (data.range.hasOwnProperty(rangeID)) {
                        if (data.range.hasOwnProperty(rangeID)) {
                            self.range[rangeID] = {
                                highSelected: data.range[rangeID].highSelected,
                                lowSelected: data.range[rangeID].lowSelected
                            };
                        }
                    }
                }
            }
        };

        SavedSearch.query = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/searches/',
                config = _.extend({
                    transformRequest: function (data) {
                        return data;
                    }
                }, Environment.config);

            $http.get(path, config).then(
                function (response) {
                    var searches = [];
                    angular.forEach(response.data, function (value, key) {
                        try {
                            searches.push(new SavedSearch(angular.fromJson(value.savedSearch), value.id));
                        } catch (e) {
                            console.log(e.message);
                        }
                    });
                    defer.resolve(searches);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        SavedSearch.prototype.$delete = function () {
            var defer = $q.defer(),
                self = this;
            if (self.id) {
                $http({
                    method: 'DELETE',
                    url: Environment.path + '/searches/' + self.id,
                    transformRequest: function (data) {
                        self.$spinner = true;
                        return data;
                    },
                    headers: Environment.config.headers,
                    withCredentials: true
                })
                    .then(function (response) {
                        self.$spinner = false;
                        segmentio.track('Deleted Saved Search', {
                            search: self
                        });
                        defer.resolve(response);
                    }, function (response) {
                        defer.reject(response);
                    });
            }
            return defer.promise;
        };

        SavedSearch.prototype.$save = function () {
            var defer = $q.defer(),
                self = this,
                config = Environment.config;
            if (self.id) {
                $http.put(Environment.path + '/searches/' + self.id, JSON.stringify({savedSearch: JSON.stringify(self)}), Environment.config).then(function (response) {
                    segmentio.track('Modified Saved Search', {
                        search: self
                    });
                    defer.resolve(response.data);
                }, function (response) {
                    defer.reject(response.data);
                });
            } else {
                $http.post(Environment.path + '/searches/', JSON.stringify({savedSearch: JSON.stringify(self)}), config).then(function (response) {
                    self.id = response.data.id;
                    segmentio.track('Created Saved Search', {
                        search: self
                    });
                    defer.resolve(response.data);
                }, function (response) {
                    defer.reject(response.data);
                });
            }

            return defer.promise;
        };

        return SavedSearch;
    });