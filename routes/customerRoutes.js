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

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      updatedData,
      { new: true } 
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;