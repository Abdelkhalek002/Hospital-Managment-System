const mysql = require("mysql");
const mysql2 = require("mysql2/promise");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "main_database_v2_5",
});
//----------------------------------------------------------------
/*
//connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "main_database_v1",
  connectionLimit: 50,
});
*/

module.exports = db;
