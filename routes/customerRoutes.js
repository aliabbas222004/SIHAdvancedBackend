const express = require('express');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
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

router.post("/addPayment", async (req, res) => {
  try {
    const { phoneNo, mode, amount, date, transactionId } = req.body;

    if (!phoneNo || !mode || !amount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let paymentRecord = await Payment.findOne({ phoneNo });

    if (!paymentRecord) {
      paymentRecord = new Payment({ phoneNo });
    }

    if (mode === "cash") {
      paymentRecord.cash.push({ amount, date });
    } else if (mode === "gpay") {
      paymentRecord.gpay.push({ amount, date, transactionId });
    } else {
      return res.status(400).json({ message: "Invalid payment mode" });
    }

    await paymentRecord.save();

    res.status(200).json({
      message: "✅ Payment added successfully",
      data: paymentRecord,
    });
  } catch (error) {
    console.error("❌ Error adding payment:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/showLedger", async (req, res) => {
  try {
    const { phoneNo } = req.query; 

    if (!phoneNo) {
      return res.status(400).json({ message: "Missing required fields: phoneNo" });
    }

    const paymentRecord = await Payment.findOne({ phoneNo });

    const bills = await Bill.find({ customerPhone: phoneNo })
      .select("billId createdAt totalAmount -_id"); 

    res.status(200).json({
      paymentRecord: paymentRecord || {},
      bills: bills || [],
    });
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;