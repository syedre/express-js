const express = require("express");
const app = express();
const con = require("./db");

const cors = require("cors");

const uploadFileToS3 = require("./s3Uploader");
const multer = require("multer");
require("dotenv").config();

// import routes
const authenticationRoutes = require("./routes/authentication");
const todosRoutes = require("./routes/todosRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/admin");

// explicitly allow your React app
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://sample-app-gray-omega.vercel.app",
    ],
  })
);

// Middleware to parse JSON bodies
// Middleware to parse URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World! newww changes");
});

// use routes
app.use("/", todosRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);
app.use("/", authenticationRoutes);

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
