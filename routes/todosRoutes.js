const express = require("express");
const router = express.Router();
const con = require("../db");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // attach user info (id, email, etc.) to request
    next();
  } catch (err) {
    console.error("Invalid token:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// to list all todos
router.get("/listtodos", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from token
    const result = await con.query(`SELECT * FROM todos WHERE user_id = $1`, [
      userId,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// to post a todo
router.post("/todos", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    const result = await con.query(
      `INSERT INTO todos (name, description, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, description, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating todo:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

//Delete a todo by ID
router.delete("/api/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await con.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    return res
      .status(200)
      .json({ message: "Todo deleted", todo: result.rows[0] });
  } catch (err) {
    console.error("Error deleting todo:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// route to update a todo

router.put("/updatetodo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required" });
    }

    const result = await con.query(
      `UPDATE todos 
       SET name = $1, description = $2
       WHERE id = $3 RETURNING *`,
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo updated successfully", todo: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
