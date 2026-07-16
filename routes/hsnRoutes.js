const express = require('express');
const HsnIdentifier = require('../models/HsnIdentifier');
const Company = require('../models/Company');
const router = express.Router();

router.post('/addHsn', async (req, res) => {
  try {
    const { type, hsn, company, gst } = req.body;
    if (!type || !hsn || !company) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await HsnIdentifier.findOne({ itemType: type, company });

    if (existing) {
      return res.status(400).json({ message: '❌Item type already exists for given company!' });
    }


    const gstValue = Number(gst);

    const newEntry = new HsnIdentifier({
      itemType: type,
      hsn,
      company,
      gst: isNaN(gstValue) ? 18 : gstValue
    });
    await newEntry.save();
    return res.status(201).json({ message: 'HSN entry added successfully', entry: newEntry });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/getHsn', async (req, res) => {
  try {
    const { company, itemType } = req.query;
    const hsn = await HsnIdentifier.find({ company, itemType });
    return res.status(200).json(hsn[0].hsn);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/itemType', async (req, res) => {
  try {
    const { company } = req.query;
    const types = await HsnIdentifier.distinct('itemType', { company });
    console.log(types);
    return res.status(200).json(types);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/company', async (req, res) => {
  try {
    const companies = await Company.find().distinct('name');
    console.log(companies);
    return res.status(200).json(companies);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/gstValue', async(req,res)=>{
  const {hsn} = req.query;
  const entries= await HsnIdentifier.findOne({hsn:hsn})
  return res.status(200).json(entries.gst)
})


module.exports = router;