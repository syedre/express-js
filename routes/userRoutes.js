const express = require("express");
const router = express.Router();
const con = require("../db");

// Route to get all users
router.get("/users", async (req, res) => {
  try {
    const result = await con.query(`SELECT * FROM users`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
