'use strict';

/* Filters */

angular.module('nebuMarket')
    .filter('limitVisible', function () {
        return function (input, limit, exceptions) {
            var visibleItems = [];
            _.each(input, function (item) {
                if (item.isVisible) {
                    visibleItems.push(item);
                }
            });
            return visibleItems.slice(0, limit);
        };
    })
    .filter('ellipsis', function () {
        return function (input, limit, exceptions) {
            return input.substr(0, limit) + "...";
        };
    });