const express = require("express");
const router = express.Router();
const con = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const verify_user = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "syed.rehan123@gmail.com",
    pass: process.env.EMAIL_SECRET, // NOT your normal Gmail password
  },
});

router.post("/send-email", async (req, res) => {
  const { email } = req.body;

  const existingUser = await con.query(
    "SELECT email FROM users WHERE email = $1",
    [email]
  );
  if (existingUser.rows.length === 0) {
    return res
      .status(400)
      .json({ message: "User does not exist", success: false });
  }
  const otp = crypto.randomInt(100000, 999999);

  try {
    await transporter.sendMail({
      from: "syed.rehan123@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `The generated OTP is ${otp}`,
    });

    verify_user.email = email;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await con.query(
      "INSERT INTO user_otp (email, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3",
      [email, otp, expiresAt]
    );

    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending email." });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  const result = await con.query("SELECT * FROM user_otp WHERE email = $1", [
    verify_user.email,
  ]);

  if (result.rows.length === 0) {
    return res.status(400).json({ message: "Please Re-Generate OTP" });
  }

  const { otp: storedOtp, expires_at } = result.rows[0];
  if (new Date() > expires_at) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (Number(otp) !== Number(storedOtp)) {
    return res.status(400).json({ message: "Invalid otp" });
  }
  const token = jwt.sign({ email: verify_user.email }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });

  delete verify_user.email;

  return res.json({ message: "success", token: token });
});

router.put("/reset-password", async (req, res) => {
  const { new_password, token } = req.body;
  const { email } = jwt.verify(token, process.env.JWT_SECRET);

  const hashedPassword = await bcrypt.hash(new_password, 10);
  try {
    const result = await con.query(
      `UPDATE users
       SET password = $1
       WHERE email = $2 RETURNING *`,
      [hashedPassword, email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Password updated successfully", success: true });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
});

module.exports = router;
