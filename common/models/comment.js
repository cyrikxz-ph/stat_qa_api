'use strict';

module.exports = function(Comment) {
  var config = require('../../server/config.json');

  // Comment.beforeRemote('find', function(ctx, instance, next) {
  //   if (!ctx.args.filter || !ctx.args.filter.limit) {
  //     if (!ctx.args.filter) ctx.args.filter = {};
  //     ctx.args.filter.limit = config.modelFilter.limit;
  //   }
  //   next();
  // });

  Comment.observe('before save', function(ctx, next) {
    // Add userId to Comment
    if (ctx.instance) {
      if (!ctx.instance.userId) {
        ctx.instance.userId = ctx.options.accessToken.userId;
      }
    } else if (ctx.data) {
      if (ctx.data.userId) {
        ctx.data.userId = ctx.options.accessToken.userId;
      }
    }
    next();
  });
};
