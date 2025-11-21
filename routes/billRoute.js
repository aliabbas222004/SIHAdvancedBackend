const express = require('express');
const Bill = require('../models/Bill');
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

module.exports = router;
