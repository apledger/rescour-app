angular.module('rescour.app')
    .controller('ReportCtrl', ['$scope', 'Property', 'Finance',
        function ($scope, Property, Finance) {
            $scope.convertToCSV = function () {
                var str = Property.convertToCSV($scope.filteredItems);
                console.log(str);
            };

            $scope.defaultFinances = Finance.defaults;

            $scope.exportPower = {
                icon: 'icon-download-alt',
                action: function  () {
                    $scope.convertToCSV();
                }
            };
        }]);