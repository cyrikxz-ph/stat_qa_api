'use strict';
var _ = require('lodash');

module.exports = function(Poll) {
  var app = require('../../server/server');
  var config = require('../../server/config.json');
  var Comment = app.models.Comment;
  var Option = app.models.Option;
/*
  #########################################
  # Enable / Disable Default Model Routes #
  #########################################
 */
/*
  ###############
  Poll - Options
  ##############
*/
  Poll.disableRemoteMethodByName('prototype.__count__options');
  Poll.disableRemoteMethodByName('prototype.__delete__options');
  Poll.disableRemoteMethodByName('prototype.__create__options');
  Poll.disableRemoteMethodByName('prototype.__findById__options');
  Poll.disableRemoteMethodByName('prototype.__get__options');
  Poll.disableRemoteMethodByName('prototype.__destroyById__options');
  Poll.disableRemoteMethodByName('prototype.__updateById__options');
/*
  ################
  Poll - Comments
  ################
*/
  Poll.disableRemoteMethodByName('prototype.__count__comments');
  Poll.disableRemoteMethodByName('prototype.__delete__comments');
  // Poll.disableRemoteMethodByName('prototype.__create__comments');
  Poll.disableRemoteMethodByName('prototype.__findById__comments');
  // Poll.disableRemoteMethodByName('prototype.__get__comments');
  // Poll.disableRemoteMethodByName('prototype.__destroyById__comments');
  // Poll.disableRemoteMethodByName('prototype.__updateById__comments');
  Poll.disableRemoteMethodByName('prototype.__count__comments');
  /*
    ##############
    Poll - Votes
    ##############
  */
  Poll.disableRemoteMethodByName('prototype.__delete__votes');
  // Poll.disableRemoteMethodByName('prototype.__create__votes');
  Poll.disableRemoteMethodByName('prototype.__findById__votes');
  Poll.disableRemoteMethodByName('prototype.__get__votes');
  Poll.disableRemoteMethodByName('prototype.__destroyById__votes');
  Poll.disableRemoteMethodByName('prototype.__updateById__votes');
  Poll.disableRemoteMethodByName('prototype.__count__votes');

  // Poll.disableRemoteMethodByName('prototype.__findById__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__count__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__create__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__delete__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__findById__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__get__accessTokens');
  // Poll.disableRemoteMethodByName('prototype.__updateById__accessTokens');
  Poll.disableRemoteMethodByName('prototype.updateAttributes');
  Poll.disableRemoteMethodByName('prototype.patchAttributes');
  // Poll.disableRemoteMethodByName('create');
  Poll.disableRemoteMethodByName('destroyById');
  // Poll.disableRemoteMethodByName('find');
  // Poll.disableRemoteMethodByName('findById');
  // Poll.disableRemoteMethodByName('count');
  Poll.disableRemoteMethodByName('replaceById');
  Poll.disableRemoteMethodByName('upsert');
  Poll.disableRemoteMethodByName('updateAll');
  Poll.disableRemoteMethodByName('findOne');
  Poll.disableRemoteMethodByName('confirm');
  Poll.disableRemoteMethodByName('exists');
  Poll.disableRemoteMethodByName('replace');
  Poll.disableRemoteMethodByName('createChangeStream');
  Poll.disableRemoteMethodByName('replaceOrCreate');
  Poll.disableRemoteMethodByName('upsertWithWhere');

  // Poll.validatesPresenceOf('_options');
  Poll.open = function(callback) {
    // TODO
    Poll.find({where: {isOpen: true}})
      .then(function(polls) {
        callback(null, polls);
      })
      .catch(function(err) {
        var error = new Error;
        error.statusCode = err.statusCode || 500;
        error.name = err.name;
        error.message = err.message;
        callback(err);
      });
  };

  Poll.closed = function(callback) {
    // TODO
    Poll.find({where: {isOpen: false}})
      .then(function(polls) {
        callback(null, polls);
      })
      .catch(function(err) {
        var error = new Error;
        error.statusCode = err.statusCode || 500;
        error.name = err.name;
        error.message = err.message;
        callback(err);
      });
  };
/*
  ####################
  # Custom Functions #
  ####################
 */
  function defaultFilterLimit(ctx, instance, next) {
    if (!ctx.args.filter || !ctx.args.filter.limit) {
      if (!ctx.args.filter) ctx.args.filter = {};
      ctx.args.filter.limit = config.modelFilter.limit;
    }
    next();
  }

  Poll.beforeRemote('create', function(ctx, instance, next) {
    if (ctx.args.data._options) {
      if (ctx.args.data._options.length > 0) {
        next();
      } else {
        next({
          statusCode: 404,
          name: 'Bad Request',
          message: 'The `poll` instance is not valid. Details: `_options` can\'t be empty array (value: []).',
        });
      }
    } else {
      next({
        statusCode: 404,
        name: 'Bad Request',
        message: `The \`poll\` instance is not valid. Details: \`_options\` can't be blank (value: ${ctx.args.data._options}).`,
      });
    }
  });

  Poll.beforeRemote('find', defaultFilterLimit);
  Poll.beforeRemote('prototype.__get__comments', defaultFilterLimit);

  // # Add Options to Poll - Relation
  Poll.observe('after save', function(ctx, next) {
    var poll = ctx.instance;
    if (ctx.isNewInstance) {
      var optionsPromise = [];
      optionsPromise = poll._options.map(function(option, index) {
        if (option.description) {
          return poll.options.create({description: option.description})
          .then(function(newOption) {
            console.log(newOption);
            return newOption;
          });
        } else {
          var error = new Error;
          error.statusCode = 422;
          error.name = 'ValidationError';
          error.message = 'The `poll` instance is not valid. Details: _option[' + index + '].description can\'t be blank. (value: ' +
                            option.description + ')';

          return new Promise(function(resolve, reject) {
            reject(error);
          });
        }
      });

      Promise.all(optionsPromise)
        .then(function() {
          next();
        })
        .catch(function(err) {
          var error = new Error;
          error.statusCode = err.statusCode || 500;
          error.name = err.name;
          error.message = err.message;
          next(error);
        });
    } else {
      // TODO: poll update
      next();
    }
  });

  Poll.afterRemote('*', function(ctx, results, next) {
    var appendPollProperties = function(poll) {
      return new Promise(function(resolve, reject) {
        poll.options.find()
        .then(function(options) {
          var optionsPromise = options.map(
            function(option) {
              return option.votes.count()
                .then(function(count) {
                  option.voteCount = count;
                  return _.omit(option.toJSON(), 'pollId');
                });
            });

          return Promise.all(optionsPromise)
            .then(function(options) {
              poll._options = options;
              return poll;
            });
        })
        .then(function(poll) {
          return poll.comments.count()
            .then(function(count) {
              poll.totalComments = count || 0;
              return Promise.resolve(poll);
            });
        })
        .then(function(poll) {
          return poll.votes.count()
            .then(function(count) {
              poll.totalVotes = count;
              return poll;
            });
        })
        .then(function(poll) {
          resolve(poll);
        })
        .catch(function(err) {
          reject(err);
        });
      });
    };

    if (results && (ctx.resultType === 'poll' || _.includes(ctx.resultType, 'poll'))) {
      if (Array.isArray(results)) {
        var polls = results;

        var resultsPromise = polls.map(
          function(poll) {
            return appendPollProperties(poll);
          }
        );

        Promise.all(resultsPromise)
          .then(function() {
            next();
          })
          .catch(function(err) {
            var error = new Error;
            error.statusCode = 500;
            error.message = err.message;
            next(error);
          });
      } else {
        appendPollProperties(results)
          .then(function(poll) {
            next();
          })
          .catch(function(err) {
            var error = new Error;
            error.statusCode = 500;
            error.message = err.message;
            next(error);
          });
      }
    } else {
      next();
    }
  });
};
