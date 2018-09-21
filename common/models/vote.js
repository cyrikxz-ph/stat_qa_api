'use strict';

module.exports = function(Vote) {
  var app = require('../../server/server');

  Vote.validatesPresenceOf('optionId');

  // Vote.beforeRemote('create', function(ctx, instance, next) {
  //   console.log('Casting vote');
  //   console.log(instance);
  // });
  Vote.observe('before save', function(ctx, next) {
    var Option = app.models.option;
    var vote = ctx.instance;

    if (ctx.isNewInstance) {
      Option.findOne({where: {id: vote.optionId, pollId: vote.pollId}})
        .then(function(option) {
          if (option) {
            return Promise.resolve();
          } else {
            return Promise.reject({
              statusCode: 404,
              name: 'Bad Request',
              message: 'Invalid optionId or pollId',
            });
          }
        })
        .then(function() {
          vote.poll.get()
            .then(function(poll) {
              if (poll.isOpen) {
                if (ctx.instance) {
                  if (!ctx.instance.userId) {
                    ctx.instance.userId = ctx.options.accessToken.userId;
                  }
                } else if (ctx.data) {
                  if (ctx.data.userId) {
                    ctx.data.userId = ctx.options.accessToken.userId;
                  }
                }
                var userId = ctx.instance.userId || ctx.data.userId;
                poll.votes.count({
                  userId: userId,
                })
                  .then(function(voteCount) {
                    if (voteCount) {
                      // Already votes
                      next({
                        statusCode: 400,
                        name: 'Bad Request',
                        message: 'user ' + userId + 'already voted for pollId ' + poll.id + '.',
                      });
                    } else {
                      next();
                    }
                  });
              } else {
                next({
                  statusCode: 400,
                  name: 'Bad Request',
                  message: `pollId ${poll.id} is already closed.`,
                });
              }
            });
        })
        .catch(function(err) {
          next(err);
        });
    } else {
      next();
    }
  });
};
