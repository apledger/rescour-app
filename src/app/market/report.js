angular.module('rescour.app')
    .controller('ReportCtrl', ['$scope', 'Property', 'Finance',
        function ($scope, Property, Finance) {
            $scope.convertToCSV = function () {
                var str = Property.convertToCSV($scope.filteredItems);
                document.location = 'data:text/csv;charset=utf-8,' + encodeURIComponent(str);
            };

            $scope.defaultFinances = Finance.defaults;

            $scope.exportPower = {
                icon: 'icon-download-alt',
                action: function  () {
                    $scope.convertToCSV();
                }
            };
        }]);