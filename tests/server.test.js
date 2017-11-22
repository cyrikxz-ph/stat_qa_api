'use strict';

var expect = require('expect');
var request = require('supertest');
var _ = require('lodash');

var app = require('../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;

var populatePoll = require('./seed-data').populatePolls;
var populateComment = require('./seed-data').populateComment;
var populateUser = require('./seed-data').populateUser;

var initPoll = require('./seed-data').initPolls;
var initComment = require('./seed-data').initComment;
var initUsers = require('./seed-data').initUsers;

var standardPollPropertiesResponse = function(poll) {
  expect(poll).toHaveProperty('id');
  expect(poll).toHaveProperty('question');
  expect(poll).toHaveProperty('isOpen');
  expect(poll).toHaveProperty('openTime');
  expect(poll).toHaveProperty('_options');
  poll._options.forEach(function(option) {
    expect(option).toHaveProperty('id');
    expect(option).toHaveProperty('description');
    expect(option).toHaveProperty('voteCount');
  });
  expect(poll).toHaveProperty('totalVotes');
  expect(poll).toHaveProperty('totalComments');
  expect(poll).toHaveProperty('createdAt');
  expect(poll).toHaveProperty('updatedAt');
};

before(populateUser);

describe('Polls', function() {
  beforeEach(populatePoll);
  var loggedInUsers = [];

  beforeEach(function(done) {
    var loginPromise = initUsers.map(function(user) {
      return request(app)
              .post('/api/users/login')
              .send(user)
              .expect(200)
              .then(function(res) {
                loggedInUsers.push(res.body);
                Promise.resolve();
              });
    });

    Promise.all(loginPromise)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  afterEach(function(done) {
    var logoutPromis = loggedInUsers.map(function(user) {
      var token = user.id;
      return request(app)
              .post('/api/users/logout?access_token=' + token)
              .send(user)
              .then(function(res) {
                _.remove(loggedInUsers, function(loggedInUser) {
                  return user.userId = user.id;
                });
                Promise.resolve();
              });
    });

    Promise.all(logoutPromis)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('GET /api/polls', function() {
    it('should return all polls with 200 response code', function(done) {
      request(app)
        .get('/api/polls?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          expect(res.body).toHaveLength(initPoll.length);
        })
        .end(done);
    });

    it('should contains standard poll properties in response', function(done) {
      request(app)
        .get('/api/polls?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          res.body.forEach(standardPollPropertiesResponse);
        })
        .end(done);
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls?access_token=XXX')
        .expect(401, done);
    });
  });

  describe('POST /api/polls', function() {
    it('should create new poll and return poll document', function(done) {
      var newPoll = {
        question: 'New Poll',
        _options: [
          {description: 'Option 1'},
          {description: 'Option 2'},
        ],
      };

      request(app)
        .post('/api/polls?access_token=' + loggedInUsers[0].id)
        .send(newPoll)
        .expect(200)
        .expect(function(res) {
          standardPollPropertiesResponse(res.body);
          expect(res.body.question).toBe(newPoll.question);
        })
        .end(function(err, res) {
          if (err) done(err);

          if (err) return done(err);

          var promisePollFindByID = Poll.findById(res.body.id)
            .then(function(poll) {
              expect(poll).toBeTruthy();
              poll.options.find()
                .then(function(options) {
                  expect(options).toHaveLength(newPoll._options.length);
                });
            });

          var promisePollCount = Poll.count()
            .then(function(count) {
              expect(count).toBe(initPoll.length + 1);
            });
          Promise.all([promisePollCount, promisePollFindByID])
            .then(function() {
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      var newPoll = {
        question: 'New Poll',
        _options: [
          {description: 'Option 1'},
          {description: 'Option 2'},
        ],
      };

      request(app)
        .post('/api/polls')
        .send(newPoll)
        .expect(401, done);
    });

    it('should not create poll with invaid data (question: null)', function(done) {
      request(app)
        .post('/api/polls?access_token=' + loggedInUsers[0].id)
        .send({})
        .expect(400)
        .end(function(err, response) {
          if (err) done(err);

          Poll.find()
            .then(function(polls) {
              expect(polls).toHaveLength(initPoll.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should not create poll with invaid data (_options: null)', function(done) {
      var newPoll = {
        question: 'New Added questions',
      };

      request(app)
        .post('/api/polls?access_token=' + loggedInUsers[0].id)
        .send(newPoll)
        .expect(400)
        .end(function(err, response) {
          if (err) done(err);

          Poll.find()
            .then(function(polls) {
              expect(polls).toHaveLength(initPoll.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should not create poll with invaid data (_options: [])', function(done) {
      var newPoll = {
        question: 'New Added questions',
      };

      request(app)
        .post('/api/polls?access_token=' + loggedInUsers[0].id)
        .send(newPoll)
        .expect(400)
        .end(function(err, response) {
          if (err) done(err);

          Poll.find()
            .then(function(polls) {
              expect(polls).toHaveLength(initPoll.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should not create poll with invaid data (_options.description: null)', function(done) {
      var newPoll = {
        question: 'New Added questions',
        _options: [
          {xxxDescription: 'Option 1'},
        ],
      };

      request(app)
        .post('/api/polls?access_token=' + loggedInUsers[0].id)
        .send(newPoll)
        .expect(400)
        .end(function(err, response) {
          if (err) done(err);

          Poll.find()
            .then(function(polls) {
              expect(polls).toHaveLength(initPoll.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });
  });

  describe('GET /api/polls/:id', function() {
    it('should return poll document with standard poll properties in response', function(done) {
      Poll.findOne()
        .then(function(poll) {
          request(app)
          .get('/api/polls/' + poll.id + '?access_token=' + loggedInUsers[0].id)
          .expect(200)
          .expect(function(res) {
            standardPollPropertiesResponse(res.body);
            expect(res.body.question).toBe(poll.question);
          })
          .end(done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 404 if pollId not found', function(done) {
      request(app)
        .get('/api/polls/xxx?access_token=' + loggedInUsers[0].id)
        .expect(404, done);
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/xxx=')
        .expect(401, done);
    });
  });

  describe('GET /api/polls/count', function() {
    it('should return total poll count with 200 response code', function(done) {
      request(app)
        .get('/api/polls/count?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          expect(res.body).toHaveProperty('count');
        })
        .end(function(err, res) {
          if (err) done(err);

          Poll.count()
            .then(function(count) {
              expect(count).toBe(res.body.count);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/count')
        .expect(401, done);
    });
  });

  describe('GET /api/polls/open', function() {
    it('should return all polls that are still open with 200 response code', function(done) {
      request(app)
        .get('/api/polls/open?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          res.body.forEach(standardPollPropertiesResponse);
        })
        .end(function(err, res) {
          if (err) done(err);

          Poll.find({where: {isOpen: true}})
            .then(function(polls) {
              expect(polls).toHaveLength(res.body.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/open')
        .expect(401, done);
    });
  });

  describe('GET /api/polls/closed', function() {
    it('should return all polls that are still open with 200 response code', function(done) {
      request(app)
        .get('/api/polls/closed?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          res.body.forEach(standardPollPropertiesResponse);
        })
        .end(function(err, res) {
          if (err) done(err);

          Poll.find({where: {isOpen: false}})
            .then(function(polls) {
              expect(polls).toHaveLength(res.body.length);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/closed')
        .expect(401, done);
    });
  });

  describe('GET /api/polls/open/count', function() {
    it('should return poll count that are still open with 200 response code', function(done) {
      request(app)
        .get('/api/polls/open/count?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          expect(res.body).toHaveProperty('count');
        })
        .end(function(err, res) {
          if (err) done(err);

          Poll.count({where: {isOpen: true}})
            .then(function(count) {
              expect(count).toBe(res.body.count);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/open/count')
        .expect(401, done);
    });
  });

  describe('GET /api/polls/closed/count', function() {
    it('should return poll count that are already closed with 200 response code', function(done) {
      request(app)
        .get('/api/polls/closed/count?access_token=' + loggedInUsers[0].id)
        .expect(200)
        .expect(function(res) {
          expect(res.body).toHaveProperty('count');
        })
        .end(function(err, res) {
          if (err) done(err);

          Poll.count({where: {isOpen: false}})
            .then(function(count) {
              expect(count).toBe(res.body.count);
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      request(app)
        .get('/api/polls/closed/count')
        .expect(401, done);
    });
  });
});

describe('Poll - Comments', function() {
  var loggedInUsers = [];
  beforeEach(populateComment);

  beforeEach(function(done) {
    var loginPromise = initUsers.map(function(user) {
      return request(app)
              .post('/api/users/login')
              .send(user)
              .expect(200)
              .then(function(res) {
                loggedInUsers.push(res.body);
                Promise.resolve();
              });
    });

    Promise.all(loginPromise)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  afterEach(function(done) {
    var logoutPromis = loggedInUsers.map(function(user) {
      var token = user.id;
      return request(app)
              .post('/api/users/logout?access_token=' + token)
              .send(user)
              .then(function(res) {
                _.remove(loggedInUsers, function(loggedInUser) {
                  return user.userId = user.id;
                });
                Promise.resolve();
              });
    });

    Promise.all(logoutPromis)
      .then(function() {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  describe('GET /api/polls/:pollId/comments', function() {
    it('should return comments of a poll', function(done) {
      Poll.findOne()
        .then(function(poll) {
          request(app)
            .get('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[0].id)
            .expect(200)
            .expect(function(res) {
              res.body.forEach(function(comment) {
                expect(comment).toHaveProperty('comment');
              });
              poll.comments.find()
                .then(function(comments) {
                  expect(res.body).toHaveLength(comments.length);
                })
                .catch(function(err) {
                  done(err);
                });
            })
          .end(done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return comments of a poll created by other user', function(done) {
      Poll.findOne()
        .then(function(poll) {
          request(app)
            .get('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[1].id)
            .expect(200)
            .end(done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      Poll.findOne()
        .then(function(poll) {
          request(app)
            .get('/api/polls/' + poll.id + '/comments')
            .expect(401, done);
        })
        .catch(function(err) {
          done(err);
        });
    });
  });

  describe('POST /api/polls/:pollId/comments', function() {
    var newComment = {
      comment: 'New Comment',
    };

    it('should create new comments of a poll', function(done) {
      Poll.findOne()
        .then(function(poll) {
          request(app)
            .post('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[0].id)
            .send(newComment)
            .expect(200)
            .expect(function(res) {
              console.log(res.body);
              poll.comments.find()
                .then(function(comments) {
                  expect(res.body).toHaveProperty('comment');
                  expect(res.body.comment).toBe(newComment.comment);
                })
                .catch(function(err) {
                  done(err);
                });
            })
          .end(function(err, res) {
            if (err) done(err);

            Comment.count({pollId: poll.id})
              .then(function(count) {
                expect(count).toBe(initComment.length + 1);
                done(err);
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

    it('should create new comments of a poll created by other user', function(done) {
      var newComment = {
        comment: 'New Comment',
      };

      Poll.findOne({where: {not: {userId: loggedInUsers[1].userId}}})
        .then(function(poll) {
          request(app)
          .post('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[1].id)
          .send(newComment)
          .expect(200, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      var newComment = {
        comment: 'New Comment',
      };

      Poll.findOne()
        .then(function(poll) {
          request(app)
            .post('/api/polls/' + poll.id + '/comments')
            .send(newComment)
            .expect(401, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 404 and not create comment with invalid pollId', function(done) {
      var pollId = 999999999;
      var newComment = {
        comment: 'New Comment',
      };

      request(app)
        .post('/api/polls/' + pollId + '/comments?access_token=' + loggedInUsers[1].id)
        .send(newComment)
        .expect(404)
        .end(done);
    });

    it('should return 422 and not create comment invaid data (comment: null)', function(done) {
      var newComment = {};

      Poll.findOne()
        .then(function(poll) {
          request(app)
            .post('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[1].id)
            .send(newComment)
            .expect(422, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 422 and not create comment invaid data (comment: \'\')', function(done) {
      var newComment = {
        comment: '',
      };

      Poll.findOne()
        .then(function(poll) {
          request(app)
            .post('/api/polls/' + poll.id + '/comments?access_token=' + loggedInUsers[1].id)
            .send(newComment)
            .expect(422, done);
        })
        .catch(function(err) {
          done(err);
        });
    });
  });

  describe('PUT /api/polls/:pollId/comments/:commentId', function() {
    it('should update comment of a poll created by user', function(done) {
      var updateComment = {
        comment: 'Updated Comment',
      };

      Comment.findOne({where: {userId: loggedInUsers[0].userId}})
        .then(function(comment) {
          request(app)
            .put('/api/polls/' + comment.pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[0].id)
            .send(updateComment)
            .expect(200)
            .expect(function(res) {
              expect(res.body.comment).toBe(updateComment.comment);
            })
            .end(function(err, res) {
              if (err) done(err);

              Comment.findById(comment.id)
                .then(function(newComment) {
                  expect(newComment.comment).toBe(updateComment.comment);
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

    it('should return 401 if user not the comment owner', function(done) {
      var updateComment = {
        comment: 'Updated Comment',
      };

      Comment.findOne({where: {not: {userId: loggedInUsers[1].userId}}})
        .then(function(comment) {
          request(app)
            .put('/api/polls/' + comment.pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[1].id)
            .send(updateComment)
            .expect(401, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 401 for unauthorized user', function(done) {
      var updateComment = {
        comment: 'Updated Comment',
      };

      Comment.findOne()
      .then(function(comment) {
        request(app)
          .put('/api/polls/' + comment.pollId + '/comments/' + comment.id)
          .send(updateComment)
          .expect(401, done);
      })
      .catch(function(err) {
        done(err);
      });
    });

    it('should return 401 and not update comment if pollId is invalid', function(done) {
      var pollId = 999999999;
      var updateComment = {
        comment: 'New Comment',
      };

      Comment.findOne()
        .then(function(comment) {
          request(app)
          .put('/api/polls/' + pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[0].id)
          .send(updateComment)
          .expect(401, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 404 if commentId is invalid', function(done) {
      var commentId = 999999999;
      var updateComment = {
        comment: 'New Comment',
      };

      Poll.findOne()
        .then(function(poll) {
          request(app)
            .put('/api/polls/' + poll.id + '/comments/' + commentId + '?access_token=' + loggedInUsers[0].id)
            .send(updateComment)
            .expect(404, done);
        })
      .catch(function(err) {
        done(err);
      });
    });

    it('should return 422 and not update comment if data is invalid (comment: \'\')', function(done) {
      var updateComment = {
        comment: '',
      };

      Comment.findOne()
      .then(function(comment) {
        request(app)
        .put('/api/polls/' + comment.pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[0].id)
          .send(updateComment)
          .expect(422, done);
      })
      .catch(function(err) {
        done(err);
      });
    });
  });

  describe('DELETE /api/polls/:pollId/comments/:commentId', function() {
    it('should delete comment of a poll created by user', function(done) {

      Comment.findOne({where: {userId: loggedInUsers[0].userId}})
        .then(function(comment) {
          request(app)
            .delete('/api/polls/' + comment.pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[0].id)
            .expect(204)
            .end(function(err, res) {
              if (err) done(err);
              Comment.findById(comment.id)
                .then(function(comment) {
                  expect(comment).not.toBeTruthy();
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

    it('should return 401 if user not the comment owner', function(done) {
      Comment.findOne({where: {userId: loggedInUsers[0].userId}})
      .then(function(comment) {
        request(app)
          .delete('/api/polls/' + comment.pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[1].id)
          .expect(401, done);
      })
      .catch(function(err) {
        done(err);
      });
    });

    it('should return 401 pollId is invalid', function(done) {
      var pollId = 9999999;

      Comment.findOne()
        .then(function(comment) {
          request(app)
          .delete('/api/polls/' + pollId + '/comments/' + comment.id + '?access_token=' + loggedInUsers[0].id)
          .expect(401, done);
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should return 404 if commentId is invalid', function(done) {
      var commentId = 9999999;

      Poll.findOne()
      .then(function(poll) {
        request(app)
          .delete('/api/polls/' + poll.id + '/comments/' + commentId + '?access_token=' + loggedInUsers[0].id)
          .expect(404, done);
      })
      .catch(function(err) {
        done(err);
      });
    });
  });
});

// describe('Poll - Votes', function() {
//   describe('POST /api/polls/:pollId/votes', function() {
//     it('should return 200', function(done) {
//       request(app)
//       .get('/api/polls')
//       .expect(200)
//       .end(done);
//     });
//   });
// });
