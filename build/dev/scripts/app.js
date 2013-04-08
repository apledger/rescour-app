if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };

angular.module('nebuMarket', ['rescour.api']);

var rescourApp = angular.module('rescour.app',
    [
        'ngResource',
        'ui.bootstrap',
        'nebuMarket',
        'rescour.api',
        'ui'
    ]);

