const express = require("express");
const router = express.Router();
const con = require("../db");
const { authenticateToken } = require("./token");

router.get("/tables", async (req, res) => {
  try {
    const result = await con.query(` SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;`);
    const get_tables = result.rows?.map((i) => i?.table_name);
    res.json(get_tables);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
