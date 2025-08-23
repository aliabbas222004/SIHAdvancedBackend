// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const qrcode = require('qrcode');
const generatePDF = require('../utils/generatePdf');
// const sendWhatsApp = require('../utils/sendWhatsApp');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

router.post('/generate', async (req, res) => {
  try {
    const data = req.body;
    data.totalAmount = data.items.reduce((sum, item) => sum + item.givenPrice * item.quantity, 0);

    const bill = new Bill(data);
    await bill.save();

    const qrData = await qrcode.toDataURL(`Pay: ₹${data.totalAmount}`);
    const pdfPath = await generatePDF(bill, qrData);
    // console.log(pdfPath);
    // const mediaUrl = await uploadToCloudinary(pdfPath);
    // await sendWhatsApp(data.customerPhone, pdfPath);

    res.json({ success: true, qr: qrData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
