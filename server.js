const express = require("express");
const app = express();
const con = require("./db");

const cors = require("cors");

const uploadFileToS3 = require("./s3Uploader");
const multer = require("multer");

require("dotenv").config();

// Middleware to parse JSON bodies

app.use(
  cors({
    origin: "http://localhost:3000", // explicitly allow your React app
  })
);

app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// const con = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

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

app.get("/listtodos", async (req, res) => {
  try {
    const result = await con.query(
      `SELECT * FROM todos where user_id='d3131912-10f8-4668-b247-465cd230059b'`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

app.delete("/api/:id", async (req, res) => {
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

// route to post name and description to todos table
app.post("/todos", async (req, res) => {
  const { name, description } = req.body;
  const user_id = "d3131912-10f8-4668-b247-465cd230059b"; // Hardcoded user_id for demonstration
  try {
    const result = await con.query(
      `INSERT INTO todos (name, description,user_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, description, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating todo:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// PUT route to update a todo
app.put("/updatetodo/:id", async (req, res) => {
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

app.get("/products", async (req, res) => {
  try {
    const result = await con.query(`SELECT * FROM products`);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
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
