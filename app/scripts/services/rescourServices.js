'use strict';

angular.module('rescour.app')
    .service('User', ['$http', '$q', '$_api', function ($http, $q, $_api) {
        this.user = {};

        this.getUser = function(){
            var user = {};
            var defer = $q.defer(),
                self = this,
                path = $_api.path + '/auth/users/user/',
                config = angular.extend({
                    transformRequest: $_api.loading.none
                }, $_api.config);

            $http.get(path, config).then(
                function (response) {
                    angular.copy(response.data, self.user);

                    console.log(self.user);
                    defer.resolve();
                },
                function (response) {
                    defer.reject();
                }
            );

            return this.user;
        }


}]);
