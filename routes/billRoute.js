const express = require('express');
const Bill = require('../models/Bill');
const DirectBill = require('../models/DirectBill');
const router = express.Router();

router.post('/addBill', async (req, res) => {
  try {
    const data = req.body;
    const newBill = new Bill({
      billId: data.billId,
      customerName: data.custName,
      customerPhone: data.phoneno,
      billAddress: data.custAdd,
      customerState: data.custState,
      shippingAddress: data.shipAdd,
      customerGST: data.custGSTIN,
      shipCustName: data.shipcustName,
      shipCustPhone: data.shipcustPhone,
      shipCustState: data.shipbillState,
      shipCustGST: data.shipcustGST,
      items: data.tableData.map(item => ({
        itemId: item.itemId,
        initialPrice: item.initialPrice,
        finalPrice: item.finalPrice,
        quantity: item.selectedQuantity
      })),
      totalAmount: data.totalPrice,
      createdAt: data.billDate ? new Date(data.billDate) : undefined
    });

    await newBill.save();

    res.json({ status: 'success', message: 'Bill saved successfully!', billId: newBill.billId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/direct', async (req, res) => {
  try {
    const { customerName, items, date } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid data',
      });
    }

    const formattedItems = items.map(item => ({
      itemName: item.name,
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
      quantity: Number(item.quantity), 
    }));


    const bill = new DirectBill({
      customerName,
      items: formattedItems,
      createdAt: date ? new Date(date) : new Date(),
    });

    await bill.save();

    res.json({
      status: 'success',
      message: 'Direct entry added successfully!',
      billId: bill._id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

module.exports = router;
