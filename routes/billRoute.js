const express = require('express');
const Bill = require('../models/Bill');
const router = express.Router();

router.post('/addBill', async (req, res) => {
  try {
    const data = req.body; 
    const newBill = new Bill({
      billId: data.billId,
      billAddress: data.custAdd,
      shippingAddress: data.shipAdd,
      customerPhone: data.phoneno,
      customerGST: data.custGSTIN,
      items: data.tableData.map(item => ({
        itemId: item.itemId,
        intialPrice:item.intialPrice,
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

module.exports = router;
