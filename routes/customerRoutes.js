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
    const customers = await Customer.find().sort({ name: 1 });
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

router.post("/addTransaction", async (req, res) => {
  try {
    const { phoneNo, type, mode, amount, date, transactionId, billId } = req.body;

    if (!phoneNo || !type || !amount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let record = await Payment.findOne({ phoneNo });

    if (!record) {
      record = new Payment({ phoneNo });
    }

    // ✅ PAYMENT RECEIVED (existing logic)
    if (type === "paymentReceived") {
      if (mode === "cash") {
        record.cash.push({ amount, date });
      } else if (mode === "digital") {
        record.gpay.push({ amount, date, transactionId });
      }
    }

    // ✅ PAYMENT DONE (NEW)
    else if (type === "paymentDone") {
      if (mode === "cash") {
        record.cashGiven.push({ amount, date });
      } else if (mode === "digital") {
        record.gpayGiven.push({ amount, date, transactionId });
      }
    }

    // ✅ BILL RECEIVED (NEW)
    else if (type === "billReceived") {
      record.billsReceived.push({ amount, date, billId });
    }

    else {
      return res.status(400).json({ message: "Invalid type" });
    }

    await record.save();

    res.status(200).json({
      message: "✅ Transaction added successfully",
      data: record,
    });

  } catch (error) {
    console.error("❌ Error:", error);
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