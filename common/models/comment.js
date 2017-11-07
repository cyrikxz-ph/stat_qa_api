'use strict';

module.exports = function(Comment) {
  var config = require('../../server/config.json');

  Comment.beforeRemote('find', function(ctx, instance, next) {
    if (!ctx.args.filter || !ctx.args.filter.limit) {
      if (!ctx.args.filter) ctx.args.filter = {};
      ctx.args.filter.limit = config.modelFilter.limit;
    }
    next();
  });
};
