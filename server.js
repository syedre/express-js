// Route to insert sample values into Books table

// Route to create Books table

const express = require("express");
const { Client } = require("pg");

// Middleware to parse JSON bodies
const app = express();
app.use(express.json());

// Database connection setup
const con = new Client({
  user: "rehan",
  host: "localhost",
  database: "test_db",
  password: "rehan",
  port: 5432,
});

// connect database
con
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err));

// Sample route

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Route to display data from Users table
app.get("/users", async (req, res) => {
  try {
    const result = await con.query(`SELECT * FROM users`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/books", async (req, res) => {
  try {
    const result = await con.query(`SELECT * FROM books`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

const port = 3000;
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
