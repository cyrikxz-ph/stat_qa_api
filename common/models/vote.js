'use strict';

module.exports = function(Vote) {
  var app = require('../../server/server');

  Vote.validatesPresenceOf('optionId');

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
                next();
              } else {
                next({
                  statusCode: 404,
                  name: 'Bad Request',
                  message: `pollId ${poll.id} is already closed`,
                });
              }
            });
        })
        .catch(function(err) {
          next(err);
        });
    }
  });
};
