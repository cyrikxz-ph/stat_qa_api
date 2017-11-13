'use strict';

var RdsUrl = `mysqls://${process.env.RDS_USERNAME}:${process.env.RDS_PASSWORD}@${process.env.RDS_HOSTNAME}:${process.env.RDS_PORT}/${process.env.RDS_DBNAME}`;

module.exports = {
  mysqlDS: {
    connector: 'mysql',
    hostname: process.env.RDS_HOSTNAME,
    url: RdsUrl,
    port: process.env.RDS_PORT,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DBNAME,
  },
};
