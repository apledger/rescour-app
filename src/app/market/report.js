angular.module('rescour.app')
    .controller('ReportCtrl', ['$scope', 'Property',
        function ($scope, Property) {
            $scope.convertToCSV = function () {
                var str = Property.convertToCSV($scope.filteredItems);
                console.log(str);
            };

            $scope.exportPower = {
                icon: 'icon-download-alt',
                float: 'right',
                action: function  () {
                    $scope.convertToCSV();
                }
            }
        }]);