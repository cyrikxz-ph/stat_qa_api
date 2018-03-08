'use strict';

var expect = require('expect');
var request = require('supertest');
var _ = require('lodash');

var app = require('../../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;

var populateComment = require('../seed-data').populateComment;
var initComment = require('../seed-data').initComment;
var initUsers = require('../seed-data').initUsers;
// var standardPollPropertiesResponse = require('../helper').standardPollPropertiesResponse;

module.exports = function() {
  var loggedInUsers = [];
  beforeEach(populateComment);

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
            .delete('/api/polls/' +
              comment.pollId + '/comments/' +
              comment.id + '?access_token=' +
              loggedInUsers[0].id
            )
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
      Comment.find({
        where: {
          userId: loggedInUsers[0].userId,
        }})
        .then(function(comments) {
          request(app)
            .delete('/api/polls/' + comments[0].pollId + '/comments/' + comments[0].id + '?access_token=' + loggedInUsers[1].id)
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
};
