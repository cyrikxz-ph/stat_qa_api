'use strict';

var mysqlUrl = `mysqls://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_DBNAME}`;

module.exports = {
  mysqlDS: {
    connector: 'mysql',
    hostname: process.env.DB_HOSTNAME,
    url: mysqlUrl,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
  },
};
