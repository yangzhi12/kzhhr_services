const mysql = require('think-model-mysql');
// host: 'hhr.dianjuhui.com',
module.exports = {
  handle: mysql,
  database: 'nideshop',
  prefix: 'nideshop_',
  encoding: 'utf8mb4',
  host: '127.0.0.1',
  port: '3390',
  user: 'root',
  password: 'kmatm123#',
  dateStrings: true
};
