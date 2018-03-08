'use strict';

var expect = require('expect');
var request = require('supertest');
var _ = require('lodash');

var app = require('../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;

var PollTestCases = require('./controllers/polls.test');
var PollCommentTestCases = require('./controllers/polls-comment.test');
var PollVotesTestCases = require('./controllers/polls-votes.test');
var populateUser = require('./seed-data').populateUser;

before(populateUser);

describe('Polls', PollTestCases);
describe('Poll - Comments', PollCommentTestCases);
describe('Poll - Votes', PollVotesTestCases);
