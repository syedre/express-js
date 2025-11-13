const express = require("express");
const router = express.Router();
const con = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

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
    return res.status(400).json({ message: "User does not exist" });
  }
  const otp = crypto.randomInt(100000, 999999);

  try {
    await transporter.sendMail({
      from: "syed.rehan123@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `The generated OTP is ${otp}`,
    });

    res.json({ success: true, message: "Email sent successfully!" });
    verify_user.otp = otp;
    verify_user.email = email;
    console.log(verify_user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending email." });
  }
});

router.post("/verify-otp", (req, res) => {
  const { otp } = req.body;
  console.log(otp, "user otp");
  console.log(verify_user, "stored otp");
  if (Number(otp) !== verify_user?.otp) {
    delete verify_user.otp;
    delete verify_user.email;
    return res.status(400).json({ message: "Invalid otp" });
  }
  delete verify_user.otp;
  delete verify_user.email;
  console.log(verify_user);

  return res.json({ message: "success" });
});

router.put("/reset-password", async (req, res) => {
  const { new_password, email } = req.body;
  const hashedPassword = await bcrypt.hash(new_password, 10);
  try {
    const result = await con.query(
      `UPDATE users
       SET password = $1
       WHERE email = $2 RETURNING *`,
      [hashedPassword, email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "password not updated" });
    }
    res.json({ message: "Password updated successfully", success: true });
  } catch (err) {
    return res.status(400).json({ message: err });
  }
});

module.exports = router;
