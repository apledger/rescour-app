angular.module('rescour.filters')
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
    })
    .filter('checkBounds', function () {
        return function (input, limit, e) {
            return input == limit ? input + "+" : input;
        }
    })
    .filter('integer', function () {
        return function (n) {
            return parseInt(n, 10);
        };
    });
