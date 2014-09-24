angular.module('rescour.services')
    .factory('Comment',
    function (Environment, $q, $http, User) {

        /**
         * Comment
         * @param data
         * @param parent Link to parent model
         * @constructor
         */
        var Comment = function (data, parent) {
            if (!parent && !data.propertyId) {
                throw new Error("Comment cannot be initialized" + JSON.stringify(data));
            }
            data = data || {};
            parent = parent || {};
            this.id = data.id || null;
            this.propertyId = data.propertyId || parent.id;
            this.resourcePath = '/comments/' + (this.id || '');
            this.text = data.text || '';
            this.datePosted = data.datePosted || data._createdTs ? new Date(data._createdTs * 1000) : Date.now();
            this.userEmail = data.userEmail || (User.profile ? User.profile.email : "You");
        };

        Comment.query = function (propertiesHash) {
            var items = [],
                defer = $q.defer(),
                config = _.extend({ ignoreLoadingBar: true }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/comments/';

            (function batchItems(limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    for (var i = response.data.length - 1; i >= 0; i--) {
                        var _comment = new Comment(response.data[i]);
                        if (propertiesHash[_comment.propertyId]) {
                            propertiesHash[_comment.propertyId].comments.push(_comment);
                            propertiesHash[_comment.propertyId].isNote = true;
                        }
                    }
                    items = items.concat(response.data);

                    if (response.data.length < limit || response.data.length === 0) {
                        defer.resolve(items);
                    } else {
                        batchItems(limit, response.data[response.data.length - 1].id);
                    }
                }, function (response) {
                    defer.reject(response);
                });

            })(batchLimit);

            return defer.promise;
        };

        Comment.prototype.save = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + self.resourcePath,
                method = self.id ? 'PUT' : 'POST',
                config = _.extend({}, Environment.config),
                body = JSON.stringify(self);

            $http(_.extend({
                url: path,
                method: method,
                data: body
            }, config)).then(
                function (response) {
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        return Comment;
    });