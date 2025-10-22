const express = require("express");
const router = express.Router();
const con = require("../db");
const { authenticateToken } = require("./token");
const uploadFileToS3 = require("../s3Uploader");
const multer = require("multer");

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

const upload = multer({ storage: multer.memoryStorage() });
router.put(
  "/profile",
  authenticateToken,
  upload.single("image"), // handle file if provided
  async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;

    try {
      let imageUrl = null;

      // If file uploaded, upload to S3
      if (req.file) {
        imageUrl = await uploadFileToS3(req.file);
      }

      // Update both name & image (if present)
      const result = await con.query(
        `UPDATE users 
         SET 
           name = COALESCE($1, name), 
           image_url = COALESCE($2, image_url)
         WHERE id = $3 
         RETURNING *`,
        [name, imageUrl, userId]
      );

      res.json({
        message: "Profile updated successfully",
        user: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

module.exports = router;
