'use strict';

/* Filters */

angular.module('nebuMarket')
    .filter('limitVisible', ['$document', function ($document) {
        return function (input, limit, exceptions) {
            var visibleItems = [];
            _.each(input, function (item) {
                if (item.isVisible) {
                    visibleItems.push(item);
                }
            });
            return visibleItems;
        };
    }])
    .filter('ellipsis', function () {
        return function (input, limit, exceptions) {
            if (input !== 'No description provided' && input.length > limit) {
                return input.substr(0, limit) + "...";
            } else {
                return input;
            }
        };
    })
    .filter('percentage', function () {
        return function (input, limit, exceptions) {
            var num = parseFloat(input);
            return num.toFixed(3) + " %";
        };
    });