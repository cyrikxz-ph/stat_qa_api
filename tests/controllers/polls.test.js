'use strict';

var expect = require('expect');
var request = require('supertest');
var _ = require('lodash');

var app = require('../../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;

var populatePoll = require('../seed-data').populatePolls;
var populateUser = require('../seed-data').populateUser;
var standardPollPropertiesResponse = require('../helper').standardPollPropertiesResponse;

var initPoll = require('../seed-data').initPolls;
var initUsers = require('../seed-data').initUsers;

module.exports = function() {
  var loggedInUsers = [];

  beforeEach(populatePoll);
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
};
