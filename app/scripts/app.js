angular.module('nebuMarket', ['rescour.api']);

var rescourApp = angular.module('rescour.app',
    [
        'ngResource',
        'ui.bootstrap.tabs',
        'ui.bootstrap.carousel',
        'nebuMarket',
        'rescour.api'
    ]);

