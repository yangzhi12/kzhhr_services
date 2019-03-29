const mysql = require('think-model-mysql');
// host: 'hhr.dianjuhui.com',
module.exports = {
  handle: mysql,
  database: 'test',
  prefix: 'nideshop_',
  encoding: 'utf8mb4',
  host: 'hhr.dianjuhui.com',
  port: '3390',
  user: 'root',
  password: 'kmatm123#',
  dateStrings: true
};
