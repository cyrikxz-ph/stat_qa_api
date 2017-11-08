'use strict';

var app = require('../server/server');
var Poll = app.models.poll;

var initPolls = [
  {
    question: 'Poll Question 1',
    openTime: 3600,
    _options: [
      {
        description: 'Yes',
      },
      {
        description: 'No',
      },
    ],
  },
  {
    question: 'Poll Question 2',
    _options: [
      {
        description: 'Yes',
      },
      {
        description: 'No',
      },
      {
        description: 'Maybe',
      },
    ],
  },
  {
    question: 'Poll Question 3',
    openTime: 172800,
    _options: [
      {
        description: 'Yes',
      },
    ],
  },
];

var populatePolls = function(done) {
  Poll.destroyAll()
    .then(function() {
      Promise.all(initPolls.map(function(poll) {
        return Poll.create(poll);
      }))
      .then(function() {
        done();
      }).catch(function(err) {
        done(err);
      });
    })
    .catch(function(err) {
      done(err);
    });

};

module.exports = {
  initPolls,
  populatePolls,
};
