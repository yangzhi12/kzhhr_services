const mysql = require('think-model-mysql');
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
// module.exports = {
//   handle: mysql,
//   database: 'test',
//   prefix: 'nideshop_',
//   encoding: 'utf8mb4',
//   host: 'localhost',
//   port: '3306',
//   user: 'root',
//   password: 'root',
//   dateStrings: true
// };
