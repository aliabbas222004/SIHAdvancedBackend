const express = require('express');
const Company = require('../models/Company');
const router = express.Router();

router.post('/addCompany', async (req, res) => {
  try {
    const { name,address,phoneNo } = req.body;
    if (!name || !address || !phoneNo) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newCompany = new Company({ name,address,phoneNo });
    await newCompany.save();
    return res.status(201).json({ message: 'Company added successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;