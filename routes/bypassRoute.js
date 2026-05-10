const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

/*
POST /bypass/verify-password
*/
router.post("/verify-password", (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password required",
      });
    }

    if (password !== process.env.APP_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      { access: "granted" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.json({
      success: true,
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/*
GET /bypass/verify-token
*/
router.get("/verify-token", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        valid: false,
      });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET);

    return res.json({
      valid: true,
    });
  } catch {
    return res.status(401).json({
      valid: false,
    });
  }
});

module.exports = router;