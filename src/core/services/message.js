/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:58 PM
 * File: user.js
 */
angular.module('rescour.services')
    .service('Message', function ($http, $q, Environment, segmentio) {
        this.send = function (message) {
            var defer = $q.defer(),
                path = Environment.path + '/messages/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify({
                    to: message.to,
                    subject: message.subject,
                    text: message.text
                });

            $http.post(path, body, config).then(
                function (response) {
                    segmentio.track('Sent Message');
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };
    });
