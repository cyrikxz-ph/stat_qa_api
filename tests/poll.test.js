'use strict';

var expect = require('expect');
var request = require('supertest');

var app = require('../server/server');
var Poll = app.models.poll;

var populatePoll = require('./seed-data').populatePolls;
var initPoll = require('./seed-data').initPolls;

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

beforeEach(populatePoll);

describe('GET /api/polls', function() {
  it('should get all polls', function(done) {
    request(app)
      .get('/api/polls')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(3);
      })
      .end(done);
  });

  it('should contains standard poll properties in response',
      function(done) {
        request(app)
          .get('/api/polls')
          .expect(200)
          .expect(function(res) {
            res.body.forEach(standardPollPropertiesResponse);
          })
          .end(done);
      });
});

describe('POST /api/polls', function() {
  it('should create new poll', function(done) {
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
      .expect(200)
      .expect(function(res) {
        standardPollPropertiesResponse(res.body);
      })
      .expect(function(res) {
        expect(res.body.question).toBe(newPoll.question);
      })
      .end(function(err, res) {
        if (err) return done(err);

        Poll.findById(res.body.id)
          .then(function(poll) {
            expect(poll).toBeTruthy();
            poll.options.find()
              .then(function(options) {
                expect(options).toHaveLength(newPoll._options.length);
                done();
              });
          })
          .catch(function(err) {
            done(err);
          });
      });
  });

  it('should not create poll with invaid data (question: null)', function(done) {
    request(app)
      .post('/api/polls')
      .send({})
      .expect(400)
      .end(function(err, response) {
        Poll.find()
          .then(function(polls) {
            expect(polls).toHaveLength(3);
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
      .post('/api/polls')
      .send(newPoll)
      .expect(400)
      .end(function(err, response) {
        Poll.find()
          .then(function(polls) {
            expect(polls).toHaveLength(3);
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
      .post('/api/polls')
      .send(newPoll)
      .expect(400)
      .end(function(err, response) {
        Poll.find()
          .then(function(polls) {
            expect(polls).toHaveLength(3);
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
      .post('/api/polls')
      .send(newPoll)
      .expect(400)
      .end(function(err, response) {
        Poll.find()
          .then(function(polls) {
            expect(polls).toHaveLength(3);
            done();
          })
          .catch(function(err) {
            done(err);
          });
      });
  });
});
