const { Client } = require("pg");
const { Pool } = require("pg");

require("dotenv").config();

// const con = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });
const con = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

con.on("connect", () => console.log("✅ Connected to Neon DB"));
con.on("error", (err) => console.error("❌ DB error:", err));

module.exports = con;
