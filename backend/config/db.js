const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

module.exports = {
  pool,
  query(sql, params = []) {
    return pool.query(sql, params);
  },
};
