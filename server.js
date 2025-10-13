// Route to insert sample values into Books table

// Route to create Books table

const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const uploadFileToS3 = require("./s3Uploader");
const multer = require("multer");

require("dotenv").config();

// Middleware to parse JSON bodies
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // explicitly allow your React app
  })
);

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

// Route to list non-system tables in the current database
app.get("/tables", async (req, res) => {
  const listTablesQuery = `
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `;
  try {
    const result = await con.query(listTablesQuery);
    // Map to a simple representation: schema.table
    const tables = result.rows.map((r) => `${r.table_name}`);
    res.json(tables);
  } catch (err) {
    console.error("Error listing tables:", err);
    res.status(500).json({ error: "Failed to list tables" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = await uploadFileToS3(req.file);
    res.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

const port = 5001;
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
