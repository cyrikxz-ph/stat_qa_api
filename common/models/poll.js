'use strict';
var _ = require('lodash');
var loopback = require('loopback');
var utils = require('loopback/lib/utils');
var moment = require('moment');

module.exports = function(Poll) {
  var app = require('../../server/server');
  // var config = require('../../server/config.json');

  function getCurrentUserId() {
    var ctx = loopback.getCurrentContext();
    var accessToken = ctx && ctx.get('accessToken');
    var userId = accessToken && accessToken.userId;
    // console.log(userId);
    return userId;
  }
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

  // // Poll.validatesPresenceOf('_options');
  // Poll.open = function(filter, callback) {
  //   // TODO
  //   console.log(filter);
  //   Poll.find({where: {isOpen: true}})
  //     .then(function(polls) {
  //       callback(null, polls);
  //     })
  //     .catch(function(err) {
  //       var error = new Error;
  //       error.statusCode = err.statusCode || 500;
  //       error.name = err.name;
  //       error.message = err.message;
  //       callback(err);
  //     });
  // };

  // Poll.openCount = function(where, callback) {
  //   var whereObj = where ? _.pick(JSON.parse(where), ['']) : {};
  //   whereObj['isOpen'] = true;

  //   console.log(whereObj);
  //   Poll.count(whereObj)
  //     .then(function(count) {
  //       callback(null, count);
  //     })
  //     .catch(function(err) {
  //       var error = new Error;
  //       error.statusCode = err.statusCode || 500;
  //       error.name = err.name;
  //       error.message = err.message;
  //       callback(err);
  //     });
  // };

  // Poll.closed = function(callback) {
  //   // TODO
  //   Poll.find({where: {isOpen: false}})
  //     .then(function(polls) {
  //       callback(null, polls);
  //     })
  //     .catch(function(err) {
  //       var error = new Error;
  //       error.statusCode = err.statusCode || 500;
  //       error.name = err.name;
  //       error.message = err.message;
  //       callback(err);
  //     });
  // };

  // Poll.closedCount = function(callback) {
  //   // TODO
  //   Poll.count({where: {isOpen: false}})
  //     .then(function(count) {
  //       callback(null, count);
  //     })
  //     .catch(function(err) {
  //       var error = new Error;
  //       error.statusCode = err.statusCode || 500;
  //       error.name = err.name;
  //       error.message = err.message;
  //       callback(err);
  //     });
  // };
/*
  ####################
  # Custom Functions #
  ####################
 */
  Poll.expireOpenPolls = function(cb) {
    console.log('Querying Open Polls...');
    var Polls = app.models.Poll;

    Poll.find({where: {isOpen: true}})
      .then(function(polls) {
        var expiredPolls = _.filter(polls, function(poll) {
          return moment(poll.createdAt).add(poll.openTime, 'seconds').diff(moment(), 'hours') < 0;
        });
        // console.log(expiredPolls);
        var exPollPromise = expiredPolls.map(function(poll) {
          return poll.close()
            .then(function(poll) {
              console.log(poll.id);
              return poll.id;
            });
        });

        Promise.all(exPollPromise)
          .then(function(polls) {
            console.log(polls);
            cb(null, polls);
          })
          .catch(function(e) {
            cb(e);
          });
      })
      .catch(function(e) {
        cb(e);
      });
  };
  Poll.prototype.voteDetails = function(cb) {
    var pollVotes = this.votes.find(
      {
        include: [{
          relation: 'user',
          scope: {
            include: {
              relation: 'profile',
            },
          },
        },
        {
          relation: 'option',
          scope: {
            fields: ['description', 'id'],
          },
        }],
      });

    Promise.all([
      pollVotes,
    ])
    .then(function(props) {
      var votesData = _.map(props[0], function(vote) {
        return {
          optionId: vote.toJSON().option.id,
          optionDesc: vote.toJSON().option.description,
          userId: vote.toJSON().user.id,
          specialtyId: vote.toJSON().user.profile.specialization.id,
          specialtyName: vote.toJSON().user.profile.specialization.name,
          trainingLvlId: vote.toJSON().user.profile.trainingLvl.id,
          trainingLvlDesc: vote.toJSON().user.profile.trainingLvl.description,
        };
      });

      var voteBySpecialty = _.chain(votesData)
        .map(function(item) {
          return {
            specialtyId: item.specialtyId,
            specialtyName: item.specialtyName,
          };
        })
        .uniqBy('specialtyId')
        .map(function(specialty) {
          console.log(specialty.specialtyName);
          specialty['optionVotes'] = _.chain(votesData)
            .filter(function(data) {
              return specialty.specialtyId == data.specialtyId;
            })
            .reduce(function(result, current) {
              var optionIdx = _.findIndex(result, function(resultOption) {
                return resultOption.optionId == current.optionId;
              });
              if (optionIdx <= 0) {
                result.push({
                  optionId: current.optionId,
                  optionDesc: current.optionDesc,
                  voteCount: 1,
                });
              } else {
                current[optionIdx].voteCount++;
              }
              return result;
            }, [])
            .value();

          return specialty;
        })
        .value();

      var voteByTrainingLvl = _.chain(votesData)
        .map(function(item) {
          return {
            trainingLvlId: item.trainingLvlId,
            trainingLvlDesc: item.trainingLvlDesc,
          };
        })
        .uniqBy('trainingLvlId')
        .map(function(trainingLvl) {
          trainingLvl['optionVotes'] = _.chain(votesData)
            .filter(function(data) {
              return trainingLvl.trainingLvlId == data.trainingLvlId;
            })
            .reduce(function(result, current) {
              var optionIdx = _.findIndex(result, function(resultOption) {
                return resultOption.optionId == current.optionId;
              });
              if (optionIdx < 0) {
                result.push({
                  optionId: current.optionId,
                  optionDesc: current.optionDesc,
                  voteCount: 1,
                });
              } else {
                result[optionIdx].voteCount++;
              }
              return result;
            }, [])
            .value();
          return trainingLvl;
        })
        .value();

      var ret = {
        optionVotesBySpecialty: voteBySpecialty,
        optionVotesByTrainingLvl: voteByTrainingLvl,
      };
      return cb(null, ret);
    })
    .catch(function(err) {
      var error = new Error;
      error.statusCode = err.statusCode || 500;
      error.name = err.name;
      error.message = err.message;
      return cb(error);
    });
  };

  Poll.prototype.close = function(cb) {
    cb = cb || utils.createPromiseCallback();
    this.updateAttribute('isOpen', false)
      .then(function(poll) {
        cb(null, poll);
      })
      .catch(function(e) {
        cb(e);
      });

    return cb.promise;
  };

  Poll.observe('before save', function(ctx, next) {
    // Validate Poll input structure on create
    if (ctx.isNewInstance) {
      if (!ctx.instance.question) {
        next({
          statusCode: 400,
          name: 'Bad Request',
          message: 'The `poll` instance is not valid. Details: `question` can\'t be empty or blank (value: ' + ctx.instance.question + ').',
        });
      } else if (!ctx.instance._options) {
        next({
          statusCode: 400,
          name: 'Bad Request',
          message: 'The `poll` instance is not valid. Details: `_options` can\'t be empty or blank (value: ' + ctx.instance._options + ').',
        });
      } else {
        var options = ctx.instance._options;
        if (options.every(function(option) {
          return option.hasOwnProperty('description');
        })) {
          // Add userId to Poll from request token
          var poll = ctx.instance || ctx.data;

          if (!poll.userId) {
            poll.userId = ctx.options.accessToken.userId;
          }

          if (!poll.specializationId) {
            poll.user.get()
              .then(function(user) {
                if (user && user.toJSON().profile.specialization.id) {
                  poll.specializationId = user.toJSON().profile.specialization.id;
                  next();
                } else {
                  next({
                    statusCode: 500,
                    name: 'Internal Server Error',
                    message: `Unable to find userId ${poll.userId} of poll`,
                  });
                }
              });
          } else {
            next();
          }
        } else {
          next({
            statusCode: 400,
            name: 'Bad Request',
            message: 'The `poll` instance is not valid. Details: `_options.description` can\'t be blank (value: ' + ctx.instance._options + ').',
          });
        }
      }
    } else {
      next();
    }
  });

  // # Add Options to Poll - Relation
  Poll.observe('after save', function(ctx, next) {
    var Notification = app.models.Notification;

    var poll = ctx.instance;
    if (ctx.isNewInstance) {
      // # Create Notification Reference
      Notification.create({
        notificationType: 'COMMENT_NOTIFICATION',
        referenceId: poll.id,
      });
      // # Populate Options table
      var optionsPromise = [];
      optionsPromise = poll._options.map(function(option, index) {
        return poll.options.create({description: option.description})
          .then(function(newOption) {
            return newOption;
          });
      });

      Promise.all(optionsPromise)
        .then(function(options) {
          poll._options = options;
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

  Poll.prototype.getOptions = function() {
    return this.options.find()
      .then(function(options) {
        return Promise.all(options.map(function(option) {
          return option.votes.count()
            .then(function(voteCount) {
              return {
                voteCount: voteCount,
                description: option.description,
                id: option.id,
              };
            });
        }))
        .then(function(options) {
          return options;
        });
      });
  };

  Poll.afterRemote('*', function(ctx, results, next) {
    var appendPollProperties = function(poll) {
      return new Promise(function(resolve, reject) {
        var loggedUserId = ctx.args.options.accessToken.userId;
        var commentCount = poll.comments.count();
        var voteCount = poll.votes.count();
        var options = poll.getOptions();
        var userVote = poll.votes.findOne({
          where: {
            userId: loggedUserId,
          }})
          .then(function(vote) {
            if (vote) {
              return _.omit(vote.toJSON(), ['id', 'pollId', 'userId']);
            } else {
              return {};
            }
          });

        Promise.all([
          commentCount,
          voteCount,
          userVote,
          options,
        ])
          .then(function(properties) {
            poll.totalComments = properties[0];
            poll.totalVotes = properties[1];
            poll.userVote = properties[2];
            poll._options = properties[3];
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
          .then(function(poll) {
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
