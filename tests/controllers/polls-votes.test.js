'use strict';

var expect = require('expect');
var request = require('supertest');
var _ = require('lodash');

var app = require('../../server/server');
var Poll = app.models.poll;
var Vote = app.models.vote;
var Option = app.models.option;

var initUsers = require('../seed-data').initUsers;
var initPolls = require('../seed-data').initPolls;
var populateVote = require('../seed-data').populateVote;

module.exports = function() {
  var loggedInUsers = [];

  beforeEach(populateVote);
  beforeEach(function(done) {
    var loginPromise = initUsers.map(function(user) {
      return new Promise(function(resolve, reject) {
        request(app)
          .post('/api/users/login')
          .send(user)
          .expect(200)
          .then(function(res) {
            resolve(res.body);
          })
          .catch(function(err) {
            reject();
          });
      });
    });

    Promise.all(loginPromise)
      .then(function(userCreds) {
        loggedInUsers = userCreds;
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  afterEach(function(done) {
    var logoutPromis = loggedInUsers.map(function(user) {
      var token = user.id;
      return new Promise(function(resolve, reject) {
        request(app)
          .post('/api/users/logout?access_token=' + token)
          .expect(200)
          .then(function(res) {
            resolve(res.body);
          })
          .catch(function(err) {
            reject();
          });
      });
    });

    Promise.all(logoutPromis)
      .then(function(res) {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('POST /api/polls/:pollId/votes', function() {
    it('should be able to votes on a poll', function(done) {
      Poll.findOne({
        where: {
          question: initPolls[1].question,
        },
      })
      .then(function(poll) {
        return Option.findOne({
          where: {
            description: initPolls[1]._options[1].description,
            pollId: poll.id,
          },
        });
      })
      .then(function(option) {
        request(app)
          .post('/api/polls/' + option.pollId + '/votes?access_token=' + loggedInUsers[0].id)
          .send({
            optionId: option.id,
          })
          .expect(function(res) {
            expect(res.body.pollId).toBe(option.pollId);
          })
          .expect(200)
          .end(function(err, res) {
            if (err) {
              done(err);
            }
            Vote.find({
              where: {
                userId: loggedInUsers[0].userId,
                pollId: option.pollId,
              }})
              .then(function(vote) {
                expect(vote).toBeTruthy();
                done();
              });
          });
      })
      .catch(function(err) {
        done(err);
      });
    });

    it('should not allowed to re-vote on poll already voted', function(done) {
      Poll.findOne({
        where: {
          question: initPolls[0].question,
        },
      })
      .then(function(poll) {
        return Option.findOne({
          where: {
            description: initPolls[1]._options[1].description,
            pollId: poll.id,
          },
        });
      })
      .then(function(option) {
        request(app)
          .post('/api/polls/' + option.pollId + '/votes?access_token=' + loggedInUsers[0].id)
          .send({
            optionId: option.id,
          })
          .expect(400)
          .end(function(err, res) {
            if (err) return done(err);
            Vote.count({
              where: {
                userId: loggedInUsers[0].userId,
                pollId: option.pollId,
              }})
              .then(function(voteCount) {
                expect(voteCount).toBe(1);
                done();
              })
              .catch(function(err) {
                done(err);
              });
          });
      })
      .catch(function(err) {
        done(err);
      });
    });
  });
};
