const express = require('express');
const Customer = require('../models/Customer');
const router = express.Router();

router.post('/addCustomer', async (req, res) => {
  try {
    const { name, phone, address, state, gst } = req.body.formData;

    const customer = await Customer.findOne({ phoneNo: phone });

    if (customer) {
      return res.status(400).json({ message: 'Customer already exists' });
    }

    const newCustomer = new Customer({
      name,
      address,
      phoneNo: phone,
      state,
      GSTIN: gst || null, 
    });

    await newCustomer.save();

    return res.status(201).json({ message: 'Customer added successfully' });

  } catch (err) {
    console.error("Error adding customer:", err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;