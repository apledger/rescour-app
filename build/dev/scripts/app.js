angular.module('nebuMarket', ['rescour.api']);

var rescourApp = angular.module('rescour.app',
    [
        'ngResource',
        'ui.bootstrap',
        'nebuMarket',
        'rescour.api'
    ]);

