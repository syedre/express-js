const { Client } = require("pg");

const con = new Client({
  user: "postgres",
  host: "database-1.c3oooeqq27cv.ap-south-1.rds.amazonaws.com",
  database: "my_new_db",
  password: "postgres",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = con;
