'use strict';

module.exports = {
  restApiRoot: '/api',
  host: process.env.HOST_ADDRESS || '127.0.0.1',
  port: process.env.HOST_PORT || '3000',
  remoting: {
    context: false,
    rest: {
      handleErrors: false,
      normalizeHttpPath: false,
      xml: false,
    },
    json: {
      strict: false,
      limit: '100kb',
    },
    urlencoded: {
      extended: true,
      limit: '100kb',
    },
    cors: false,
  },
};
